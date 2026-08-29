"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Download,
  ExternalLink,
  Package,
  Globe,
  Smartphone,
  Play,
  Boxes,
  Zap,
  Shield,
  FileCode,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ApiPlayground } from "@/components/developers/ApiPlayground";

// ── Language Definitions ─────────────────────────────────────────────────────

type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "ruby"
  | "rust"
  | "java"
  | "php"
  | "curl";

interface LanguageDef {
  id: Language;
  label: string;
  icon: string;
  color: string;
  install: string;
  installLabel: string;
  quickstart: string;
  features: string[];
}

const LANGUAGES: LanguageDef[] = [
  {
    id: "javascript",
    label: "JavaScript",
    icon: "📦",
    color: "text-yellow-400",
    install: "npm install @conch/sdk",
    installLabel: "npm",
    quickstart: `import { ConchClient } from "@conch/sdk";

const conch = new ConchClient({
  apiKey: "cnch_your_api_key",
});

// Store a memory
const memory = await conch.memory.create({
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
  tags: ["coffee", "preferences"],
});

// Search memories
const results = await conch.memory.search({
  query: "What does the user drink?",
  topK: 5,
});

// Recall context for AI
const context = await conch.memory.recall({
  query: "user preferences",
});

console.log(context.context); // Ready-to-inject context block`,
    features: [
      "Full TypeScript support",
      "Automatic retries",
      "Streaming chat",
      "Type-safe API calls",
    ],
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: "🔷",
    color: "text-blue-400",
    install: "npm install @conch/sdk",
    installLabel: "npm",
    quickstart: `import { ConchClient, type Memory } from "@conch/sdk";

const conch = new ConchClient({
  apiKey: "cnch_your_api_key",
});

// Type-safe memory creation
const memory: Memory = await conch.memory.create({
  content: "Deployments happen on Fridays",
  category: "PROCEDURAL",
  tags: ["deployment", "process"],
  importance: 0.9,
});

// Type-safe search
const results = await conch.memory.search<{
  memory: Memory;
  score: number;
}>({
  query: "deployment schedule",
  topK: 5,
});

// Streaming chat with type safety
const stream = await conch.chat.send({
  message: "What's our deployment process?",
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}`,
    features: [
      "Full IntelliSense support",
      "Generic type parameters",
      "Strict API contracts",
      "IDE autocompletion",
    ],
  },
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    color: "text-green-400",
    install: "pip install conch-sdk",
    installLabel: "pip",
    quickstart: `from conch import ConchClient

client = ConchClient(api_key="cnch_your_api_key")

# Store a memory
memory = client.memory.create(
    content="User prefers dark roast coffee",
    category="PREFERENCE",
    tags=["coffee", "preferences"],
    importance=0.8,
)

# Search memories
results = client.memory.search(
    query="What does the user drink?",
    top_k=5,
)

# Recall context for AI
context = client.memory.recall(
    query="user preferences",
)

print(context.context)  # Ready-to-inject context block

# Async support available
import asyncio
from conch import AsyncConchClient

async def main():
    async with AsyncConchClient(api_key="cnch_your_api_key") as client:
        memory = await client.memory.create(
            content="Async memory creation",
            category="SEMANTIC",
        )

asyncio.run(main())`,
    features: [
      "Sync and async clients",
      "Pydantic models",
      "Type hints",
      "Python 3.8+",
    ],
  },
  {
    id: "go",
    label: "Go",
    icon: "🔵",
    color: "text-cyan-400",
    install: "go get github.com/conch-ai/conch-go",
    installLabel: "go get",
    quickstart: `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/conch-ai/conch-go"
)

func main() {
    client := conch.NewClient("cnch_your_api_key")
    ctx := context.Background()

    // Store a memory
    memory, err := client.Memory.Create(ctx, &conch.MemoryParams{
        Content:    "User prefers dark roast coffee",
        Category:   conch.CategoryPreference,
        Tags:       []string{"coffee", "preferences"},
        Importance: 0.8,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Stored: %s\\n", memory.ID)

    // Search memories
    results, err := client.Memory.Search(ctx, &conch.SearchParams{
        Query: "What does the user drink?",
        TopK:  5,
    })
    if err != nil {
        log.Fatal(err)
    }

    for _, r := range results.Results {
        fmt.Printf("Score: %.2f - %s\\n", r.Score, r.Memory.Content)
    }
}`,
    features: [
      "Context-aware",
      "Error handling",
      "Idiomatic Go",
      "Go 1.21+",
    ],
  },
  {
    id: "ruby",
    label: "Ruby",
    icon: "💎",
    color: "text-red-400",
    install: "gem install conch-sdk",
    installLabel: "gem",
    quickstart: `require "conch"

client = Conch::Client.new(api_key: "cnch_your_api_key")

# Store a memory
memory = client.memories.create(
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
  tags: ["coffee", "preferences"],
  importance: 0.8,
)

# Search memories
results = client.memories.search(
  query: "What does the user drink?",
  top_k: 5,
)

# Recall context for AI
context = client.memories.recall(
  query: "user preferences",
)

puts context[:context]  # Ready-to-inject context block

# Rails integration
# config/initializers/conch.rb
Conch.configure do |config|
  config.api_key = ENV["CONCH_API_KEY"]
end

# In your model
class User < ApplicationRecord
  include Conch::Memoryable
end`,
    features: [
      "Ruby 3.0+",
      "Rails integration",
      "Convention over configuration",
      "Block syntax",
    ],
  },
  {
    id: "rust",
    label: "Rust",
    icon: "🦀",
    color: "text-orange-400",
    install: "cargo add conch-sdk",
    installLabel: "cargo",
    quickstart: `use conch_sdk::{Client, MemoryParams, SearchParams};
use conch_sdk::models::{Category, Memory};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new("cnch_your_api_key");

    // Store a memory
    let memory = client
        .memory()
        .create(MemoryParams {
            content: "User prefers dark roast coffee".into(),
            category: Some(Category::Preference),
            tags: Some(vec!["coffee".into(), "preferences".into()]),
            importance: Some(0.8),
            ..Default::default()
        })
        .await?;

    println!("Stored: {}", memory.id);

    // Search memories
    let results = client
        .memory()
        .search(SearchParams {
            query: "What does the user drink?".into(),
            top_k: Some(5),
            ..Default::default()
        })
        .await?;

    for result in &results.results {
        println!("Score: {:.2} - {}", result.score, result.memory.content);
    }

    Ok(())
}`,
    features: [
      "Async/await",
      "Type-safe",
      "Zero-cost abstractions",
      "Rust 1.70+",
    ],
  },
  {
    id: "java",
    label: "Java / Kotlin",
    icon: "☕",
    color: "text-amber-400",
    install: "implementation 'com.conch:sdk:1.0.0'",
    installLabel: "Gradle",
    quickstart: `// Java
import com.conch.sdk.ConchClient;
import com.conch.sdk.models.*;

public class Main {
    public static void main(String[] args) {
        ConchClient client = new ConchClient("cnch_your_api_key");

        // Store a memory
        Memory memory = client.getMemory().create(
            MemoryParams.builder()
                .content("User prefers dark roast coffee")
                .category(Category.PREFERENCE)
                .tags(List.of("coffee", "preferences"))
                .importance(0.8)
                .build()
        );

        System.out.println("Stored: " + memory.getId());

        // Search memories
        SearchResults results = client.getMemory().search(
            SearchParams.builder()
                .query("What does the user drink?")
                .topK(5)
                .build()
        );

        results.getResults().forEach(r ->
            System.out.printf("Score: %.2f - %s%n",
                r.getScore(), r.getMemory().getContent())
        );
    }
}

// Kotlin
val client = ConchClient("cnch_your_api_key")

val memory = client.memory.create(
    MemoryParams(
        content = "User prefers dark roast coffee",
        category = Category.PREFERENCE,
        tags = listOf("coffee", "preferences"),
        importance = 0.8
    )
)

val results = client.memory.search(
    SearchParams(
        query = "What does the user drink?",
        topK = 5
    )
)`,
    features: [
      "Java 11+ / Kotlin 1.8+",
      "Builder pattern",
      "Maven / Gradle",
      "Spring Boot ready",
    ],
  },
  {
    id: "php",
    label: "PHP",
    icon: "🐘",
    color: "text-indigo-400",
    install: "composer require conch/sdk",
    installLabel: "Composer",
    quickstart: `<?php

use Conch\\SDK\\Client;

$client = new Client("cnch_your_api_key");

// Store a memory
$memory = $client->memory()->create([
    "content" => "User prefers dark roast coffee",
    "category" => "PREFERENCE",
    "tags" => ["coffee", "preferences"],
    "importance" => 0.8,
]);

echo "Stored: " . $memory["id"];

// Search memories
$results = $client->memory()->search([
    "query" => "What does the user drink?",
    "topK" => 5,
]);

foreach ($results["results"] as $result) {
    printf("Score: %.2f - %s\\n",
        $result["score"],
        $result["memory"]["content"]
    );
}

// Laravel integration
// config/services.php
'conch' => [
    'api_key' => env('CONCH_API_KEY'),
],

// Usage in Laravel
$memory = app(Client::class)->memory()->create([
    "content" => "Stored via Laravel",
    "category" => "SEMANTIC",
]);`,
    features: [
      "PHP 8.1+",
      "Laravel integration",
      "PSR standards",
      "Type declarations",
    ],
  },
  {
    id: "curl",
    label: "cURL / REST",
    icon: "🔗",
    color: "text-slate-400",
    install: "No installation required",
    installLabel: "HTTP",
    quickstart: `# Store a memory
curl -X POST "https://conchportal.com/api/memory" \\
  -H "Authorization: Bearer cnch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "User prefers dark roast coffee",
    "category": "PREFERENCE",
    "tags": ["coffee", "preferences"],
    "importance": 0.8
  }'

# Search memories
curl -X POST "https://conchportal.com/api/search" \\
  -H "Authorization: Bearer cnch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What does the user drink?",
    "topK": 5
  }'

# Recall context for AI
curl -X POST "https://conchportal.com/api/memory/recall" \\
  -H "Authorization: Bearer cnch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "user preferences"
  }'

# List agents
curl "https://conchportal.com/api/agents" \\
  -H "Authorization: Bearer cnch_your_api_key"`,
    features: [
      "No SDK needed",
      "Any HTTP client",
      "Universal compatibility",
      "Direct API access",
    ],
  },
];

// ── Code Block Component ─────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="text-[11px] sm:text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-3 sm:p-4 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
        {code}
      </pre>
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
        title="Copy code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>
    </div>
  );
}

// ── Platform Guides ──────────────────────────────────────────────────────────

const PLATFORM_GUIDES = [
  {
    title: "Node.js",
    icon: Globe,
    content: `# Environment variable
export CONCH_API_KEY="cnch_your_api_key"

# Or in .env
CONCH_API_KEY=cnch_your_api_key

# Install
npm install @conch/sdk`,
    color: "text-green-400",
  },
  {
    title: "Browser",
    icon: Globe,
    content: `<!-- Direct script tag -->
<script type="module">
  import { ConchClient } from "https://cdn.conchportal.com/sdk/index.js";
  
  const conch = new ConchClient({
    apiKey: "cnch_your_api_key",
  });
  
  // Use in your frontend
  const memories = await conch.memory.list();
</script>`,
    color: "text-blue-400",
  },
  {
    title: "React / Next.js",
    icon: Smartphone,
    content: `// hooks/useConch.ts
"use client";
import { ConchClient } from "@conch/sdk";

let client: ConchClient | null = null;

export function useConch() {
  if (!client) {
    client = new ConchClient({
      apiKey: process.env.NEXT_PUBLIC_CONCH_API_KEY,
    });
  }
  return client;
}

// Usage in component
function MyComponent() {
  const conch = useConch();
  
  useEffect(() => {
    conch.memory.list().then(setMemories);
  }, []);
}`,
    color: "text-cyan-400",
  },
  {
    title: "Python (Django / Flask)",
    icon: Package,
    content: `# settings.py or config.py
CONCH_API_KEY = os.environ.get("CONCH_API_KEY")

# Initialize once
from conch import ConchClient
conch = ConchClient(api_key=CONCH_API_KEY)

# In your view/route
@app.route("/api/context")
def get_context():
    memories = conch.memory.recall(
        query="user preferences",
        namespace="my-app"
    )
    return jsonify(memories)`,
    color: "text-yellow-400",
  },
];

// ── Main Component ───────────────────────────────────────────────────────────

export function InstallConch() {
  const [activeLang, setActiveLang] = useState<Language>("javascript");

  const currentLang = LANGUAGES.find((l) => l.id === activeLang)!;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Hero */}
      <GlassCard className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-coral-600/10 via-transparent to-gold-600/5 pointer-events-none" />

        <div className="relative">
          <Badge className="mb-3 bg-coral-500/15 text-coral-300 border-coral-500/30 text-xs">
            Installation
          </Badge>
          <h1 className="font-display text-2xl md:text-3xl text-white mb-2">
            Install Conch in your app
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl">
            Connect your application to Conch&apos;s persistent context infrastructure.
            Available for every major programming language and platform.
          </p>
        </div>
      </GlassCard>

      {/* Language Selector */}
      <GlassCard className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Choose your language</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                activeLang === lang.id
                  ? "bg-coral-600/20 text-coral-300 border border-coral-500/30"
                  : "bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>{lang.icon}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* SDK Packages Overview */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Boxes className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">SDK Packages</h2>
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
            Auto-generated
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Official SDK packages generated from the API spec. Each package includes type definitions,
          error handling, and authentication — ready for production use.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              name: "@conch/sdk",
              registry: "npm",
              lang: "TypeScript / JavaScript",
              icon: "📦",
              color: "text-yellow-400",
              install: "npm install @conch/sdk",
              features: ["Full types", "Streaming", "Auto-retry"],
              url: "https://www.npmjs.com/package/@conch/sdk",
            },
            {
              name: "conch-sdk",
              registry: "PyPI",
              lang: "Python",
              icon: "🐍",
              color: "text-green-400",
              install: "pip install conch-sdk",
              features: ["Sync + async", "Type hints", "Pydantic"],
              url: "https://pypi.org/project/conch-sdk/",
            },
            {
              name: "github.com/conch-ai/conch-go",
              registry: "Go modules",
              lang: "Go",
              icon: "🔵",
              color: "text-cyan-400",
              install: "go get github.com/conch-ai/conch-go",
              features: ["Context-aware", "Idiomatic", "Error handling"],
              url: "https://pkg.go.dev/github.com/conch-ai/conch-go",
            },
            {
              name: "conch-sdk",
              registry: "RubyGems",
              lang: "Ruby",
              icon: "💎",
              color: "text-red-400",
              install: "gem install conch-sdk",
              features: ["Rails ready", "Block syntax", "PSR"],
              url: "https://rubygems.org/gems/conch-sdk",
            },
            {
              name: "conch-sdk",
              registry: "crates.io",
              lang: "Rust",
              icon: "🦀",
              color: "text-orange-400",
              install: "cargo add conch-sdk",
              features: ["Async/await", "Type-safe", "Zero-cost"],
              url: "https://crates.io/crates/conch-sdk",
            },
            {
              name: "com.conch:sdk",
              registry: "Maven Central",
              lang: "Java / Kotlin",
              icon: "☕",
              color: "text-amber-400",
              install: "implementation 'com.conch:sdk:1.0.0'",
              features: ["Builder pattern", "Spring Boot", "Kotlin"],
              url: "https://central.sonatype.com/namespace/com.conch",
            },
            {
              name: "conch/sdk",
              registry: "Packagist",
              lang: "PHP",
              icon: "🐘",
              color: "text-indigo-400",
              install: "composer require conch/sdk",
              features: ["Laravel", "PSR-4", "PHP 8.1+"],
              url: "https://packagist.org/packages/conch/sdk",
            },
          ].map((sdk) => (
            <div
              key={sdk.name}
              className="p-4 bg-white/5 rounded-xl border border-white/8 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{sdk.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{sdk.lang}</p>
                  <p className="text-[10px] text-slate-500">{sdk.registry}</p>
                </div>
              </div>
              <code className="text-[11px] font-mono text-coral-300 bg-black/30 px-2 py-1 rounded-lg block mb-2 overflow-x-auto">
                {sdk.name}
              </code>
              <div className="flex flex-wrap gap-1 mb-3">
                {sdk.features.map((f) => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                    {f}
                  </span>
                ))}
              </div>
              <a
                href={sdk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-coral-300 hover:text-coral-200 flex items-center gap-1 transition-colors"
              >
                View on {sdk.registry} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-white/[0.03] border border-white/8 rounded-xl">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">All SDKs include</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-teal-400" /> Bearer token auth</span>
                <span className="flex items-center gap-1"><FileCode className="w-3 h-3 text-purple-400" /> Error handling</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-gold-400" /> All 28 endpoints</span>
                <span className="flex items-center gap-1"><Boxes className="w-3 h-3 text-coral-400" /> Auto-generated from spec</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Installation */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-coral-400" />
            <h2 className="text-sm font-semibold text-white">
              {currentLang.icon} Install {currentLang.label}
            </h2>
          </div>
          <Badge className="bg-white/10 text-slate-300 border-white/10 text-[10px]">
            {currentLang.installLabel}
          </Badge>
        </div>

        <CodeBlock code={currentLang.install} language="bash" />

        <div className="flex flex-wrap gap-2 mt-4">
          {currentLang.features.map((feature) => (
            <Badge
              key={feature}
              className="bg-white/5 text-slate-400 border-white/8 text-[10px]"
            >
              {feature}
            </Badge>
          ))}
        </div>
      </GlassCard>

      {/* Quick Start */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Quick Start</h2>
        </div>

        <CodeBlock code={currentLang.quickstart} language={currentLang.id} />
      </GlassCard>

      {/* Playground */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Try it Now</h2>
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
            Live
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test any API endpoint directly from your browser. Enter your API key, fill in parameters, and see real responses.
        </p>
        <ApiPlayground />
      </div>

      {/* Platform Guides */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Platform Guides</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {PLATFORM_GUIDES.map((guide) => (
            <div
              key={guide.title}
              className="p-4 bg-white/5 rounded-xl border border-white/8"
            >
              <div className="flex items-center gap-2 mb-3">
                <guide.icon className={`w-4 h-4 ${guide.color}`} />
                <h3 className="text-xs font-semibold text-white">{guide.title}</h3>
              </div>
              <CodeBlock code={guide.content} language="bash" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* API Key Setup */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Authentication</h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          All API requests require a valid API key. Create one in{" "}
          <a href="/settings/api-keys" className="text-coral-300 hover:text-coral-200 underline">
            Settings → API Keys
          </a>
          .
        </p>

        <div className="space-y-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/8">
            <p className="text-xs font-semibold text-white mb-2">Header Authentication</p>
            <CodeBlock
              code={`Authorization: Bearer cnch_your_api_key

# Example with fetch
const res = await fetch("https://conchportal.com/api/memory", {
  headers: {
    "Authorization": "Bearer cnch_your_api_key",
    "Content-Type": "application/json",
  },
});`}
              language="bash"
            />
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/8">
            <p className="text-xs font-semibold text-white mb-2">Environment Variable</p>
            <CodeBlock
              code={`# .env
CONCH_API_KEY=cnch_your_api_key

# Then in code
const apiKey = process.env.CONCH_API_KEY;
const conch = new ConchClient({ apiKey });`}
              language="bash"
            />
          </div>
        </div>
      </GlassCard>

      {/* Common Operations */}
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-coral-400" />
          <h2 className="text-sm font-semibold text-white">Common Operations</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              title: "Store Context",
              code: `# Store memories, decisions, constraints
POST /api/v1/context
{
  "type": "memory",
  "content": "User prefers dark roast coffee",
  "importance": 0.8,
  "tags": ["preference", "coffee"]
}`,
            },
            {
              title: "Search Context",
              code: `# Semantic search across context
POST /api/v1/context/search
{
  "query": "coffee preferences",
  "topK": 5
}`,
            },
            {
              title: "Recall for AI",
              code: `# Get context ready for AI injection
POST /api/memory/recall
{
  "query": "user preferences",
  "topK": 10
}`,
            },
            {
              title: "Create Agent",
              code: `# Create a custom AI agent
POST /api/v1/agents
{
  "name": "Support Bot",
  "systemPrompt": "You are a helpful support agent...",
  "modelId": "claude-haiku-4-5-20251001"
}`,
            },
          ].map((op) => (
            <div key={op.title} className="p-3 bg-white/5 rounded-xl border border-white/8">
              <p className="text-xs font-semibold text-white mb-2">{op.title}</p>
              <CodeBlock code={op.code} language="json" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Next Steps */}
      <GlassCard className="p-5 md:p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Next Steps</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href="/developers/api"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
          >
            <Code2 className="w-4 h-4 text-coral-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">API Reference</p>
              <p className="text-[10px] text-slate-400">Explore all endpoints</p>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
          </a>

          <a
            href="/settings/api-keys"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
          >
            <Terminal className="w-4 h-4 text-coral-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Get API Key</p>
              <p className="text-[10px] text-slate-400">Create your first key</p>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
          </a>

          <a
            href="/developers"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
          >
            <Globe className="w-4 h-4 text-coral-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Developer Dashboard</p>
              <p className="text-[10px] text-slate-400">View usage and manage keys</p>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
          </a>

          <a
            href="/settings/billing"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
          >
            <Package className="w-4 h-4 text-coral-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">View Plans</p>
              <p className="text-[10px] text-slate-400">Check limits and upgrade</p>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
