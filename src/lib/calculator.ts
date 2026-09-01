// A recursive-descent math expression parser — deliberately not eval()/Function(),
// since this evaluates user- and model-supplied expression strings. The grammar only
// knows numbers, a fixed whitelist of named functions/constants, and +-*/%^()!,
// so there's no way to reach arbitrary code execution or property access.

type TokenType = "num" | "op" | "lparen" | "rparen" | "comma" | "ident" | "bang" | "end";
interface Token { type: TokenType; value: string }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let num = c;
      i++;
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++; }
      tokens.push({ type: "num", value: num });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let ident = c;
      i++;
      while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) { ident += expr[i]; i++; }
      tokens.push({ type: "ident", value: ident.toLowerCase() });
      continue;
    }
    if ("+-*/%^".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
    if (c === "(") { tokens.push({ type: "lparen", value: c }); i++; continue; }
    if (c === ")") { tokens.push({ type: "rparen", value: c }); i++; continue; }
    if (c === ",") { tokens.push({ type: "comma", value: c }); i++; continue; }
    if (c === "!") { tokens.push({ type: "bang", value: c }); i++; continue; }
    if (c === "[" || c === "]") {
      throw new Error("Square brackets aren't supported. Use plain parentheses with comma-separated arguments, e.g. mean(1, 2, 3) not mean([1, 2, 3])");
    }
    throw new Error(`Unexpected character: "${c}"`);
  }
  tokens.push({ type: "end", value: "" });
  return tokens;
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const UNARY_FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
};

function mean(xs: number[]) { return xs.reduce((a, b) => a + b, 0) / xs.length; }
function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}
function stddev(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

const VARIADIC_FUNCS: Record<string, (xs: number[]) => number> = {
  min: (xs) => Math.min(...xs),
  max: (xs) => Math.max(...xs),
  sum: (xs) => xs.reduce((a, b) => a + b, 0),
  mean: mean,
  average: mean,
  median: median,
  stddev: stddev,
  std: stddev,
};

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error("Factorial requires a non-negative integer");
  if (n > 170) throw new Error("Factorial argument too large");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek() { return this.tokens[this.pos]; }
  private next() { return this.tokens[this.pos++]; }

  parse(): number {
    const result = this.parseExpr();
    if (this.peek().type !== "end") throw new Error(`Unexpected token: "${this.peek().value}"`);
    return result;
  }

  // expr := term (('+' | '-') term)*
  private parseExpr(): number {
    let value = this.parseTerm();
    while (this.peek().type === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.next().value;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  // term := factor (('*' | '/' | '%') factor)*
  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.peek().type === "op" && ["*", "/", "%"].includes(this.peek().value)) {
      const op = this.next().value;
      const rhs = this.parseFactor();
      if ((op === "/" || op === "%") && rhs === 0) throw new Error("Division by zero");
      value = op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs;
    }
    return value;
  }

  // factor := unary ('^' factor)?  (right-associative)
  private parseFactor(): number {
    const base = this.parseUnary();
    if (this.peek().type === "op" && this.peek().value === "^") {
      this.next();
      const exp = this.parseFactor();
      return Math.pow(base, exp);
    }
    return base;
  }

  // unary := '-' unary | postfix
  private parseUnary(): number {
    if (this.peek().type === "op" && this.peek().value === "-") {
      this.next();
      return -this.parseUnary();
    }
    return this.parsePostfix();
  }

  // postfix := primary ('!')*
  private parsePostfix(): number {
    let value = this.parsePrimary();
    while (this.peek().type === "bang") {
      this.next();
      value = factorial(value);
    }
    return value;
  }

  // primary := number | ident | ident '(' args ')' | '(' expr ')'
  private parsePrimary(): number {
    const tok = this.peek();
    if (tok.type === "num") { this.next(); return parseFloat(tok.value); }

    if (tok.type === "ident") {
      this.next();
      if (this.peek().type === "lparen") {
        this.next();
        const args = this.parseArgs();
        if (this.peek().type !== "rparen") throw new Error("Missing closing parenthesis");
        this.next();
        if (tok.value in UNARY_FUNCS) {
          if (args.length !== 1) throw new Error(`${tok.value}() takes exactly 1 argument`);
          return UNARY_FUNCS[tok.value](args[0]);
        }
        if (tok.value in VARIADIC_FUNCS) {
          if (args.length === 0) throw new Error(`${tok.value}() needs at least 1 argument`);
          return VARIADIC_FUNCS[tok.value](args);
        }
        throw new Error(`Unknown function: "${tok.value}"`);
      }
      if (tok.value in CONSTANTS) return CONSTANTS[tok.value];
      throw new Error(`Unknown identifier: "${tok.value}"`);
    }

    if (tok.type === "lparen") {
      this.next();
      const value = this.parseExpr();
      if (this.peek().type !== "rparen") throw new Error("Missing closing parenthesis");
      this.next();
      return value;
    }
    throw new Error(`Unexpected token: "${tok.value}"`);
  }

  private parseArgs(): number[] {
    const args = [this.parseExpr()];
    while (this.peek().type === "comma") {
      this.next();
      args.push(this.parseExpr());
    }
    return args;
  }
}

export function calculate(expression: string): number {
  if (expression.length > 300) throw new Error("Expression too long");
  const result = new Parser(tokenize(expression)).parse();
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number");
  return result;
}
