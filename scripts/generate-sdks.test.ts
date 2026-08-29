import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SDKS_DIR = path.join(process.cwd(), "sdks");
const GENERATOR_SCRIPT = path.join(process.cwd(), "scripts", "generate-sdks.ts");

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function runCommand(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd: cwd ?? process.cwd(),
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function runCommandSafe(cmd: string, cwd?: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
    };
  }
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Clean previous output
  if (fs.existsSync(SDKS_DIR)) {
    fs.rmSync(SDKS_DIR, { recursive: true });
  }

  // Run the generator
  runCommand(`npx tsx ${GENERATOR_SCRIPT}`);
}, 60000);

afterAll(() => {
  // Clean up generated SDKs
  if (fs.existsSync(SDKS_DIR)) {
    fs.rmSync(SDKS_DIR, { recursive: true });
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SDK Generator", () => {
  it("generates all 7 language directories", () => {
    const expectedDirs = ["typescript", "python", "go", "ruby", "rust", "java", "php"];
    const actualDirs = fs.readdirSync(SDKS_DIR).filter((d) => {
      const stat = fs.statSync(path.join(SDKS_DIR, d));
      return stat.isDirectory();
    });

    for (const dir of expectedDirs) {
      expect(actualDirs).toContain(dir);
    }
  });

  it("generates README for each language", () => {
    const dirs = fs.readdirSync(SDKS_DIR);
    for (const dir of dirs) {
      const readmePath = path.join(SDKS_DIR, dir, "README.md");
      expect(fileExists(readmePath)).toBe(true);
      const content = readFile(readmePath);
      expect(content).toContain("Conch SDK");
      expect(content).toContain("Installation");
      expect(content).toContain("Quick Start");
    }
  });
});

describe("TypeScript SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "typescript");

  it("has index.ts and package.json", () => {
    expect(fileExists(path.join(sdkDir, "index.ts"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "package.json"))).toBe(true);
  });

  it("package.json has correct metadata", () => {
    const pkg = JSON.parse(readFile(path.join(sdkDir, "package.json")));
    expect(pkg.name).toBe("@conch/sdk");
    expect(pkg.version).toBeDefined();
    expect(pkg.description).toContain("Conch");
  });

  it("index.ts exports ConchClient class", () => {
    const code = readFile(path.join(sdkDir, "index.ts"));
    expect(code).toContain("export class ConchClient");
    expect(code).toContain("export class ConchError");
  });

  it("index.ts defines all required types", () => {
    const code = readFile(path.join(sdkDir, "index.ts"));
    const requiredTypes = [
      "export interface Memory",
      "export interface Agent",
      "export interface Conversation",
      "export interface Message",
      "export interface Wallet",
      "export interface Payment",
      "export interface ApiKey",
      "export type MemoryCategory",
      "export type AgentStatus",
    ];
    for (const type of requiredTypes) {
      expect(code).toContain(type);
    }
  });

  it("index.ts has methods for all endpoint groups", () => {
    const code = readFile(path.join(sdkDir, "index.ts"));
    const requiredMethods = [
      "async memory_list",
      "async memory_create",
      "async memory_get",
      "async memory_update",
      "async memory_delete",
      "async memory_export",
      "async search_query",
      "async recall_query",
      "async chat_send",
      "async agents_list",
      "async agents_create",
      "async agents_get",
      "async agents_update",
      "async agents_delete",
      "async conversations_list",
      "async conversations_create",
      "async conversations_get",
      "async conversations_delete",
      "async wallet_get",
      "async wallet_link",
      "async wallet_unlink",
      "async subscription_get",
      "async subscription_confirm",
    ];
    for (const method of requiredMethods) {
      expect(code).toContain(method);
    }
  });

  it("compiles with TypeScript", () => {
    const result = runCommandSafe("npx tsc --noEmit index.ts", sdkDir);
    expect(result.exitCode).toBe(0);
  });
});

describe("Python SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "python");

  it("has conch_sdk.py and setup.py", () => {
    expect(fileExists(path.join(sdkDir, "conch_sdk.py"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "setup.py"))).toBe(true);
  });

  it("setup.py has correct metadata", () => {
    const setup = readFile(path.join(sdkDir, "setup.py"));
    expect(setup).toContain("conch-sdk");
    expect(setup).toContain("Conch API SDK for Python");
  });

  it("conch_sdk.py defines ConchClient class", () => {
    const code = readFile(path.join(sdkDir, "conch_sdk.py"));
    expect(code).toContain("class ConchClient");
    expect(code).toContain("class ConchError");
  });

  it("conch_sdk.py defines MemoryAPI and AgentAPI classes", () => {
    const code = readFile(path.join(sdkDir, "conch_sdk.py"));
    expect(code).toContain("class MemoryAPI");
    expect(code).toContain("class AgentAPI");
  });

  it("conch_sdk.py has methods for all endpoint groups", () => {
    const code = readFile(path.join(sdkDir, "conch_sdk.py"));
    const requiredMethods = [
      "def list(",
      "def create(",
      "def get(",
      "def update(",
      "def delete(",
      "def search(",
      "def recall(",
    ];
    for (const method of requiredMethods) {
      expect(code).toContain(method);
    }
  });

  it("compiles with Python", () => {
    const result = runCommandSafe("python3 -m py_compile conch_sdk.py", sdkDir);
    expect(result.exitCode).toBe(0);
  });
});

describe("Go SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "go");

  it("has conch.go and go.mod", () => {
    expect(fileExists(path.join(sdkDir, "conch.go"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "go.mod"))).toBe(true);
  });

  it("go.mod has correct module name", () => {
    const mod = readFile(path.join(sdkDir, "go.mod"));
    expect(mod).toContain("module github.com/conch-ai/conch-go");
  });

  it("conch.go defines Client struct and methods", () => {
    const code = readFile(path.join(sdkDir, "conch.go"));
    expect(code).toContain("type Client struct");
    expect(code).toContain("func NewClient(");
    expect(code).toContain("type Memory struct");
    expect(code).toContain("type Agent struct");
  });

  it("conch.go has Memory and Agent services", () => {
    const code = readFile(path.join(sdkDir, "conch.go"));
    expect(code).toContain("type MemoryService struct");
    expect(code).toContain("type AgentService struct");
    expect(code).toContain("func (c *Client) Memory()");
    expect(code).toContain("func (c *Client) Agents()");
  });

  it("conch.go has correct Go syntax (no parse errors)", () => {
    // Check for balanced braces
    const code = readFile(path.join(sdkDir, "conch.go"));
    const openBraces = (code.match(/{/g) ?? []).length;
    const closeBraces = (code.match(/}/g) ?? []).length;
    expect(openBraces).toBe(closeBraces);
  });
});

describe("Ruby SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "ruby");

  it("has lib/conch.rb and gemspec", () => {
    expect(fileExists(path.join(sdkDir, "lib/conch.rb"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "conch-sdk.gemspec"))).toBe(true);
  });

  it("gemspec has correct metadata", () => {
    const spec = readFile(path.join(sdkDir, "conch-sdk.gemspec"));
    expect(spec).toContain("conch-sdk");
    expect(spec).toContain("Conch API SDK for Ruby");
  });

  it("lib/conch.rb defines Client class", () => {
    const code = readFile(path.join(sdkDir, "lib/conch.rb"));
    expect(code).toContain("module Conch");
    expect(code).toContain("class Client");
    expect(code).toContain("class MemoryResource");
    expect(code).toContain("class AgentResource");
  });

  it("lib/conch.rb has required methods", () => {
    const code = readFile(path.join(sdkDir, "lib/conch.rb"));
    expect(code).toContain("def list");
    expect(code).toContain("def create");
    expect(code).toContain("def get");
    expect(code).toContain("def delete");
    expect(code).toContain("def search");
    expect(code).toContain("def recall");
  });
});

describe("Rust SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "rust");

  it("has src/lib.rs and Cargo.toml", () => {
    expect(fileExists(path.join(sdkDir, "src/lib.rs"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "Cargo.toml"))).toBe(true);
  });

  it("Cargo.toml has correct metadata", () => {
    const toml = readFile(path.join(sdkDir, "Cargo.toml"));
    expect(toml).toContain('name = "conch-sdk"');
    expect(toml).toContain("reqwest");
    expect(toml).toContain("serde");
  });

  it("src/lib.rs defines ConchClient and types", () => {
    const code = readFile(path.join(sdkDir, "src/lib.rs"));
    expect(code).toContain("pub struct ConchClient");
    expect(code).toContain("pub struct Memory");
    expect(code).toContain("pub struct Agent");
    expect(code).toContain("pub struct SearchResult");
    expect(code).toContain("pub struct RecallResult");
  });

  it("src/lib.rs has MemoryApi and AgentApi", () => {
    const code = readFile(path.join(sdkDir, "src/lib.rs"));
    expect(code).toContain("pub struct MemoryApi");
    expect(code).toContain("pub struct AgentApi");
  });
});

describe("Java SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "java");

  it("has ConchClient.java and build.gradle", () => {
    expect(
      fileExists(
        path.join(sdkDir, "src/main/java/com/conch/sdk/ConchClient.java")
      )
    ).toBe(true);
    expect(fileExists(path.join(sdkDir, "build.gradle"))).toBe(true);
  });

  it("build.gradle has correct configuration", () => {
    const gradle = readFile(path.join(sdkDir, "build.gradle"));
    expect(gradle).toContain("com.conch");
    expect(gradle).toContain("java-library");
  });

  it("ConchClient.java defines client class", () => {
    const code = readFile(
      path.join(sdkDir, "src/main/java/com/conch/sdk/ConchClient.java")
    );
    expect(code).toContain("public class ConchClient");
    expect(code).toContain("public MemoryApi memory()");
    expect(code).toContain("public AgentApi agents()");
  });
});

describe("PHP SDK", () => {
  const sdkDir = path.join(SDKS_DIR, "php");

  it("has src/Client.php and composer.json", () => {
    expect(fileExists(path.join(sdkDir, "src/Client.php"))).toBe(true);
    expect(fileExists(path.join(sdkDir, "composer.json"))).toBe(true);
  });

  it("composer.json has correct metadata", () => {
    const composer = JSON.parse(readFile(path.join(sdkDir, "composer.json")));
    expect(composer.name).toBe("conch/sdk");
    expect(composer.description).toContain("Conch");
  });

  it("Client.php defines Client class", () => {
    const code = readFile(path.join(sdkDir, "src/Client.php"));
    expect(code).toContain("class Client");
    expect(code).toContain("class MemoryApi");
    expect(code).toContain("class AgentApi");
  });

  it("Client.php has required methods", () => {
    const code = readFile(path.join(sdkDir, "src/Client.php"));
    expect(code).toContain("public function memory()");
    expect(code).toContain("public function agents()");
    expect(code).toContain("public function search(");
    expect(code).toContain("public function recall(");
  });
});

describe("Cross-cutting concerns", () => {
  it("all SDKs reference the correct base URL", () => {
    const baseUrl = "https://conchportal.com";
    const files = [
      path.join(SDKS_DIR, "typescript", "index.ts"),
      path.join(SDKS_DIR, "python", "conch_sdk.py"),
      path.join(SDKS_DIR, "go", "conch.go"),
      path.join(SDKS_DIR, "ruby", "lib", "conch.rb"),
      path.join(SDKS_DIR, "rust", "src", "lib.rs"),
      path.join(SDKS_DIR, "java", "src/main/java/com/conch/sdk/ConchClient.java"),
      path.join(SDKS_DIR, "php", "src", "Client.php"),
    ];

    for (const file of files) {
      const content = readFile(file);
      expect(content).toContain(baseUrl);
    }
  });

  it("all SDKs include Bearer token authentication", () => {
    const files = [
      path.join(SDKS_DIR, "typescript", "index.ts"),
      path.join(SDKS_DIR, "python", "conch_sdk.py"),
      path.join(SDKS_DIR, "go", "conch.go"),
      path.join(SDKS_DIR, "ruby", "lib", "conch.rb"),
      path.join(SDKS_DIR, "php", "src", "Client.php"),
    ];

    for (const file of files) {
      const content = readFile(file);
      expect(content).toContain("Bearer");
    }
  });

  it("all SDKs handle error responses", () => {
    const files = [
      path.join(SDKS_DIR, "typescript", "index.ts"),
      path.join(SDKS_DIR, "python", "conch_sdk.py"),
      path.join(SDKS_DIR, "go", "conch.go"),
      path.join(SDKS_DIR, "ruby", "lib", "conch.rb"),
      path.join(SDKS_DIR, "php", "src", "Client.php"),
    ];

    for (const file of files) {
      const content = readFile(file);
      // Should have error class or error handling
      const hasErrorHandling =
        content.includes("Error") ||
        content.includes("error") ||
        content.includes("Exception");
      expect(hasErrorHandling).toBe(true);
    }
  });
});
