/**
 * Conch 2.0 Context Engine
 *
 * The core infrastructure for structured context management.
 * This is NOT simply "save chat messages" — it's a structured context layer
 * that allows meaning to survive between agents, applications, and tasks.
 *
 * Architecture:
 *   MODEL → AGENT → CONCH CONTEXT → MEMORY / STATE / DECISIONS / CONSTRAINTS / PERMISSIONS
 */

import { Query, ID } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { generateEmbedding } from "./embeddings";
import {
  DB_ID,
  COLLECTIONS,
  type ContextObjectDoc,
  type ContextObjectType,
  type ContextLifecycle,
  type ProvenanceSource,
  type DecisionDoc,
  type ConstraintDoc,
  type ProjectDoc,
  type AgentHandoffDoc,
  type AgentHandoffStatus,
  type AppwriteDoc,
} from "./db";

// ── Context Object Operations ──────────────────────────────────────────────

export interface ContextRetrievalOptions {
  userId: string;
  query: string;
  projectId?: string;
  agentId?: string;
  types?: ContextObjectType[];
  lifecycle?: ContextLifecycle[];
  topK?: number;
  minScore?: number;
  maxImportance?: number;
}

export interface RankedContext extends AppwriteDoc<ContextObjectDoc> {
  score: number;
}

/**
 * The intelligent retrieval pipeline.
 *
 * When a request arrives:
 * 1. Understand the request (via embedding)
 * 2. Search semantic context
 * 3. Search structured context (type/lifecycle filters)
 * 4. Check recent context
 * 5. Check important constraints
 * 6. Rank results by relevance, recency, importance, confidence
 * 7. Remove irrelevant information
 * 8. Build a compact context package
 *
 * The objective: "Retrieve the smallest amount of context necessary to preserve meaning."
 */
export async function retrieveContext(
  options: ContextRetrievalOptions
): Promise<RankedContext[]> {
  const {
    userId,
    query,
    projectId,
    agentId,
    types,
    lifecycle = ["active", "verified"],
    topK = 10,
    minScore = 0.3,
  } = options;

  try {
    const queryVector = await generateEmbedding(query);
    const { databases } = createAdminClient();

    const MAX_CANDIDATES = 500;
    const filters = [
      Query.equal("userId", userId),
      Query.equal("lifecycle", lifecycle.length === 1 ? lifecycle[0] : lifecycle),
      Query.limit(MAX_CANDIDATES),
    ];

    if (projectId) filters.push(Query.equal("projectId", projectId));
    if (agentId) filters.push(Query.equal("agentId", agentId));
    if (types && types.length > 0) {
      filters.push(Query.equal("type", types.length === 1 ? types[0] : types));
    }

    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      filters
    );

    const candidates = result.documents as unknown as AppwriteDoc<ContextObjectDoc>[];

    // Rank by composite score: semantic similarity + importance + confidence
    const ranked = candidates
      .map((doc) => {
        const semanticScore = queryVector.length > 0 && doc.embedding?.length > 0
          ? cosineSimilarity(queryVector, doc.embedding)
          : 0;
        const importanceBoost = doc.importance * 0.15;
        const confidenceBoost = doc.confidence * 0.1;
        const recencyBoost = getRecencyBoost(doc.$createdAt) * 0.05;

        return {
          ...doc,
          score: semanticScore + importanceBoost + confidenceBoost + recencyBoost,
        };
      })
      .filter((doc) => doc.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return ranked;
  } catch {
    return [];
  }
}

/**
 * Store a context object with full provenance tracking.
 */
export async function storeContext(params: {
  userId: string;
  type: ContextObjectType;
  content: string;
  projectId?: string | null;
  agentId?: string | null;
  importance?: number;
  confidence?: number;
  source?: ProvenanceSource;
  sourceDetail?: string | null;
  tags?: string[];
  relatedIds?: string[];
  lifecycle?: ContextLifecycle;
}): Promise<AppwriteDoc<ContextObjectDoc>> {
  const {
    userId,
    type,
    content,
    projectId = null,
    agentId = null,
    importance = 0.5,
    confidence = 0.5,
    source = "user",
    sourceDetail = null,
    tags = [],
    relatedIds = [],
    lifecycle = "active",
  } = params;

  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(content);
  } catch {
    // Context saved even if embedding fails
  }

  const { databases } = createAdminClient();
  const id = ID.unique();

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    id,
    {
      userId,
      projectId,
      type,
      content,
      lifecycle,
      importance,
      confidence,
      source,
      sourceDetail,
      agentId,
      tags,
      relatedIds,
      supersededBy: null,
      version: 1,
      embedding,
    }
  ) as unknown as AppwriteDoc<ContextObjectDoc>;

  // Store provenance record
  try {
    await databases.createDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_PROVENANCE,
      ID.unique(),
      {
        contextId: id,
        contextType: type,
        source,
        sourceDetail,
        agentId,
        verifiedAt: null,
        confidence,
      }
    );
  } catch {
    // Non-critical — provenance tracking must never block context storage
  }

  return doc;
}

/**
 * Update context lifecycle — e.g. promote temporary → active, or supersede.
 */
export async function updateContextLifecycle(
  contextId: string,
  newLifecycle: ContextLifecycle,
): Promise<void> {
  const { databases } = createAdminClient();
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    contextId,
    { lifecycle: newLifecycle }
  );
}

/**
 * Supersede a context object — mark old as superseded, create new version.
 */
export async function supersedeContext(
  oldContextId: string,
  newContent: string,
  userId: string,
  reason?: string
): Promise<AppwriteDoc<ContextObjectDoc>> {
  const { databases } = createAdminClient();

  // Get the old context
  const old = await databases.getDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    oldContextId
  ) as unknown as AppwriteDoc<ContextObjectDoc>;

  // Mark old as superseded
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    oldContextId,
    { lifecycle: "superseded" }
  );

  // Create new version
  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(newContent);
  } catch {}

  const newDoc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    ID.unique(),
    {
      userId: old.userId,
      projectId: old.projectId,
      type: old.type,
      content: newContent,
      lifecycle: "active",
      importance: old.importance,
      confidence: old.confidence,
      source: old.source,
      sourceDetail: reason ?? old.sourceDetail,
      agentId: old.agentId,
      tags: old.tags,
      relatedIds: old.relatedIds,
      supersededBy: null,
      supersededFrom: oldContextId,
      version: (old.version ?? 1) + 1,
      embedding,
    }
  ) as unknown as AppwriteDoc<ContextObjectDoc>;

  // Link old → new
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    oldContextId,
    { supersededBy: newDoc.$id }
  );

  return newDoc;
}

// ── Decision Memory ────────────────────────────────────────────────────────

/**
 * Store a decision with full reasoning context.
 *
 * Decision: Use Anthropic for current model infrastructure.
 * Reason: Stable performance and manageable development cost.
 * Constraint: Keep initial infrastructure budget low.
 * Status: Active.
 *
 * This allows future agents to understand the reasoning
 * instead of simply seeing the final answer.
 */
export async function storeDecision(params: {
  userId: string;
  projectId?: string | null;
  what: string;
  why: string;
  who?: string;
  alternatives?: string;
  constraints?: string;
  assumptions?: string;
  fallbackCondition?: string | null;
  agentId?: string | null;
  confidence?: number;
  tags?: string[];
}): Promise<AppwriteDoc<DecisionDoc>> {
  const {
    userId,
    projectId = null,
    what,
    why,
    who = "user",
    alternatives = "",
    constraints = "",
    assumptions = "",
    fallbackCondition = null,
    agentId = null,
    confidence = 0.5,
    tags = [],
  } = params;

  const { databases } = createAdminClient();
  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.DECISIONS,
    ID.unique(),
    {
      userId,
      projectId,
      what,
      why,
      who,
      alternatives,
      constraints,
      assumptions,
      fallbackCondition,
      status: "active",
      supersededBy: null,
      agentId,
      confidence,
      tags,
    }
  ) as unknown as AppwriteDoc<DecisionDoc>;

  // Also store as a context object for unified retrieval
  await storeContext({
    userId,
    type: "decision",
    content: `Decision: ${what}\nReason: ${why}\nConstraints: ${constraints}`,
    projectId,
    agentId,
    importance: 0.8,
    confidence,
    source: agentId ? "agent" : "user",
    tags: [...tags, "decision"],
  });

  return doc;
}

/**
 * Retrieve relevant decisions for a given query/project.
 */
export async function retrieveDecisions(params: {
  userId: string;
  projectId?: string;
  status?: string;
  limit?: number;
}): Promise<AppwriteDoc<DecisionDoc>[]> {
  const { userId, projectId, status = "active", limit = 20 } = params;
  const { databases } = createAdminClient();

  const filters = [
    Query.equal("userId", userId),
    Query.equal("status", status),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ];

  if (projectId) filters.push(Query.equal("projectId", projectId));

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.DECISIONS,
    filters
  );

  return result.documents as unknown as AppwriteDoc<DecisionDoc>[];
}

// ── Constraint Memory ──────────────────────────────────────────────────────

/**
 * Store a constraint — rules or requirements that must continue to apply.
 *
 * Agents must know what they are not allowed to change.
 * An agent should be able to say:
 * "This decision conflicts with an existing project constraint."
 */
export async function storeConstraint(params: {
  userId: string;
  projectId?: string | null;
  content: string;
  category: string;
  severity?: "hard" | "soft";
  source?: ProvenanceSource;
  sourceDetail?: string | null;
  agentId?: string | null;
  tags?: string[];
}): Promise<AppwriteDoc<ConstraintDoc>> {
  const {
    userId,
    projectId = null,
    content,
    category,
    severity = "hard",
    source = "user",
    sourceDetail = null,
    agentId = null,
    tags = [],
  } = params;

  const { databases } = createAdminClient();
  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.CONSTRAINTS,
    ID.unique(),
    {
      userId,
      projectId,
      content,
      category,
      severity,
      source,
      sourceDetail,
      status: "active",
      agentId,
      tags,
    }
  ) as unknown as AppwriteDoc<ConstraintDoc>;

  // Also store as context object for unified retrieval
  await storeContext({
    userId,
    type: "constraint",
    content: `[${severity.toUpperCase()} CONSTRAINT] ${content}`,
    projectId,
    agentId,
    importance: severity === "hard" ? 0.95 : 0.7,
    confidence: 1.0,
    source,
    tags: [...tags, "constraint", category],
  });

  return doc;
}

/**
 * Retrieve active constraints for a project/agent.
 */
export async function retrieveConstraints(params: {
  userId: string;
  projectId?: string;
  severity?: "hard" | "soft";
  limit?: number;
}): Promise<AppwriteDoc<ConstraintDoc>[]> {
  const { userId, projectId, severity, limit = 50 } = params;
  const { databases } = createAdminClient();

  const filters = [
    Query.equal("userId", userId),
    Query.equal("status", "active"),
    Query.limit(limit),
  ];

  if (projectId) filters.push(Query.equal("projectId", projectId));
  if (severity) filters.push(Query.equal("severity", severity));

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.CONSTRAINTS,
    filters
  );

  return result.documents as unknown as AppwriteDoc<ConstraintDoc>[];
}

// ── Project Operations ─────────────────────────────────────────────────────

export async function createProject(params: {
  userId: string;
  name: string;
  description?: string;
  tags?: string[];
}): Promise<AppwriteDoc<ProjectDoc>> {
  const { databases } = createAdminClient();
  return databases.createDocument(
    DB_ID,
    COLLECTIONS.PROJECTS,
    ID.unique(),
    {
      userId: params.userId,
      name: params.name,
      description: params.description ?? null,
      status: "active",
      tags: params.tags ?? [],
      agentIds: [],
      memoryIds: [],
    }
  ) as unknown as Promise<AppwriteDoc<ProjectDoc>>;
}

export async function listProjects(userId: string): Promise<AppwriteDoc<ProjectDoc>[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROJECTS, [
    Query.equal("userId", userId),
    Query.notEqual("status", "archived"),
    Query.orderDesc("$updatedAt"),
    Query.limit(50),
  ]);
  return result.documents as unknown as AppwriteDoc<ProjectDoc>[];
}

// ── Agent Handoff ──────────────────────────────────────────────────────────

/**
 * Create a structured agent handoff.
 *
 * When Agent A finishes a task for Agent B, it should not simply send a huge
 * conversation transcript. It should produce a structured handoff containing:
 *   objective, work completed, decisions, reasoning, constraints,
 *   unresolved issues, assumptions, required next action.
 *
 * Agent B receives the meaningful context required to continue.
 *
 * The goal: AGENT A → CONCH CONTEXT → AGENT B
 */
export async function createHandoff(params: {
  fromAgentId: string;
  toAgentId: string;
  userId: string;
  projectId?: string | null;
  objective: string;
  workCompleted: string;
  findings: string;
  decisions: string;
  reasoning: string;
  constraints: string;
  unresolvedIssues: string;
  assumptions: string;
  requiredAction: string;
  relevantMemoryIds?: string[];
  sources?: string;
  confidence?: number;
}): Promise<AppwriteDoc<AgentHandoffDoc>> {
  const { databases } = createAdminClient();

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.AGENT_HANDOFFS,
    ID.unique(),
    {
      fromAgentId: params.fromAgentId,
      toAgentId: params.toAgentId,
      userId: params.userId,
      projectId: params.projectId ?? null,
      objective: params.objective,
      workCompleted: params.workCompleted,
      findings: params.findings,
      decisions: params.decisions,
      reasoning: params.reasoning,
      constraints: params.constraints,
      unresolvedIssues: params.unresolvedIssues,
      assumptions: params.assumptions,
      requiredAction: params.requiredAction,
      relevantMemoryIds: params.relevantMemoryIds ?? [],
      sources: params.sources ?? "",
      confidence: params.confidence ?? 0.5,
      status: "pending",
      contextVersion: 1,
    }
  ) as unknown as AppwriteDoc<AgentHandoffDoc>;

  // Store handoff as context objects for future retrieval
  await storeContext({
    userId: params.userId,
    type: "task_state",
    content: `Handoff from ${params.fromAgentId} to ${params.toAgentId}: ${params.objective}. Completed: ${params.workCompleted}. Next: ${params.requiredAction}`,
    projectId: params.projectId,
    agentId: params.toAgentId,
    importance: 0.7,
    source: "agent",
    tags: ["handoff", "agent-transition"],
  });

  return doc;
}

export async function updateHandoffStatus(
  handoffId: string,
  status: AgentHandoffStatus
): Promise<void> {
  const { databases } = createAdminClient();
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.AGENT_HANDOFFS,
    handoffId,
    { status }
  );
}

export async function getPendingHandoffs(
  userId: string,
  agentId: string
): Promise<AppwriteDoc<AgentHandoffDoc>[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.AGENT_HANDOFFS,
    [
      Query.equal("userId", userId),
      Query.equal("toAgentId", agentId),
      Query.equal("status", "pending"),
      Query.orderDesc("$createdAt"),
      Query.limit(20),
    ]
  );
  return result.documents as unknown as AppwriteDoc<AgentHandoffDoc>[];
}

// ── Context Package Builder ────────────────────────────────────────────────

export interface ContextPackage {
  memories: RankedContext[];
  decisions: AppwriteDoc<DecisionDoc>[];
  constraints: AppwriteDoc<ConstraintDoc>[];
  recentContext: RankedContext[];
  importantContext: RankedContext[];
  handoffs: AppwriteDoc<AgentHandoffDoc>[];
  compactSummary: string;
}

/**
 * Build a compact context package for an agent or conversation.
 *
 * This is the intelligence layer: instead of dumping everything,
 * it selects the smallest amount of context necessary to preserve meaning.
 */
export async function buildContextPackage(params: {
  userId: string;
  query: string;
  projectId?: string;
  agentId?: string;
}): Promise<ContextPackage> {
  const { userId, query, projectId, agentId } = params;

  // Parallel retrieval of all context types
  const [memories, decisions, constraints, recentContext, importantContext, handoffs] =
    await Promise.all([
      retrieveContext({
        userId,
        query,
        projectId,
        agentId,
        topK: 5,
      }),
      retrieveDecisions({
        userId,
        projectId,
        limit: 5,
      }),
      retrieveConstraints({
        userId,
        projectId,
        limit: 10,
      }),
      retrieveContext({
        userId,
        query,
        projectId,
        lifecycle: ["active"],
        topK: 3,
        minScore: 0,
      }),
      retrieveContext({
        userId,
        query,
        projectId,
        topK: 3,
        minScore: 0,
      }).then((docs) =>
        docs
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 3)
      ),
      agentId
        ? getPendingHandoffs(userId, agentId)
        : Promise.resolve([]),
    ]);

  // Build compact summary
  const parts: string[] = [];

  if (decisions.length > 0) {
    parts.push(
      `Active decisions: ${decisions
        .map((d) => d.what)
        .join("; ")}`
    );
  }

  if (constraints.length > 0) {
    const hardConstraints = constraints.filter((c) => c.severity === "hard");
    if (hardConstraints.length > 0) {
      parts.push(
        `Hard constraints: ${hardConstraints
          .map((c) => c.content)
          .join("; ")}`
      );
    }
  }

  if (memories.length > 0) {
    parts.push(
      `Relevant context: ${memories
        .map((m) => m.content.slice(0, 100))
        .join("; ")}`
    );
  }

  if (handoffs.length > 0) {
    parts.push(
      `Pending handoffs: ${handoffs
        .map((h) => h.objective)
        .join("; ")}`
    );
  }

  return {
    memories,
    decisions,
    constraints,
    recentContext,
    importantContext,
    handoffs,
    compactSummary: parts.join("\n"),
  };
}

/**
 * Format a context package into a system prompt fragment.
 */
export function formatContextForPrompt(pkg: ContextPackage): string {
  const sections: string[] = [];

  if (pkg.decisions.length > 0) {
    sections.push(
      "## Active Decisions\n" +
        pkg.decisions
          .map(
            (d) =>
              `- **${d.what}**: ${d.why}${
                d.constraints ? ` (Constraints: ${d.constraints})` : ""
              }`
          )
          .join("\n")
    );
  }

  if (pkg.constraints.length > 0) {
    const hard = pkg.constraints.filter((c) => c.severity === "hard");
    const soft = pkg.constraints.filter((c) => c.severity === "soft");

    if (hard.length > 0) {
      sections.push(
        "## Hard Constraints (must not violate)\n" +
          hard.map((c) => `- ${c.content}`).join("\n")
      );
    }
    if (soft.length > 0) {
      sections.push(
        "## Soft Constraints (prefer to respect)\n" +
          soft.map((c) => `- ${c.content}`).join("\n")
      );
    }
  }

  if (pkg.memories.length > 0) {
    sections.push(
      "## Relevant Context\n" +
        pkg.memories
          .map(
            (m) =>
              `- [${m.type}] ${m.content.slice(0, 200)}${
                m.content.length > 200 ? "…" : ""
              }`
          )
          .join("\n")
    );
  }

  if (pkg.handoffs.length > 0) {
    sections.push(
      "## Pending Agent Handoffs\n" +
        pkg.handoffs
          .map(
            (h) =>
              `- From agent ${h.fromAgentId}: "${h.objective}" → Required: ${h.requiredAction}`
          )
          .join("\n")
    );
  }

  if (sections.length === 0) return "";

  return `\n\n## Context Engine\n${sections.join("\n\n")}`;
}

// ── Utility Functions ──────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

function getRecencyBoost(createdAt: string): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const ageHours = (now - created) / (1000 * 60 * 60);

  // Exponential decay: recent = high boost, old = low boost
  if (ageHours < 1) return 1.0;
  if (ageHours < 24) return 0.8;
  if (ageHours < 168) return 0.6; // 1 week
  if (ageHours < 720) return 0.4; // 1 month
  return 0.2;
}
