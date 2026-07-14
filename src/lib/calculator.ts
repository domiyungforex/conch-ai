// A small recursive-descent arithmetic parser — deliberately not eval()/Function(),
// since this evaluates user- and model-supplied expression strings. The grammar only
// knows numbers and +-*/%^(), so there's no way to reach arbitrary code execution.

type TokenType = "num" | "op" | "lparen" | "rparen" | "end";
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
    if ("+-*/%^".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
    if (c === "(") { tokens.push({ type: "lparen", value: c }); i++; continue; }
    if (c === ")") { tokens.push({ type: "rparen", value: c }); i++; continue; }
    throw new Error(`Unexpected character: "${c}"`);
  }
  tokens.push({ type: "end", value: "" });
  return tokens;
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

  // factor := power ('^' factor)?  (right-associative)
  private parseFactor(): number {
    const base = this.parseUnary();
    if (this.peek().type === "op" && this.peek().value === "^") {
      this.next();
      const exp = this.parseFactor();
      return Math.pow(base, exp);
    }
    return base;
  }

  // unary := '-' unary | primary
  private parseUnary(): number {
    if (this.peek().type === "op" && this.peek().value === "-") {
      this.next();
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  // primary := number | '(' expr ')'
  private parsePrimary(): number {
    const tok = this.peek();
    if (tok.type === "num") { this.next(); return parseFloat(tok.value); }
    if (tok.type === "lparen") {
      this.next();
      const value = this.parseExpr();
      if (this.peek().type !== "rparen") throw new Error("Missing closing parenthesis");
      this.next();
      return value;
    }
    throw new Error(`Unexpected token: "${tok.value}"`);
  }
}

export function calculate(expression: string): number {
  if (expression.length > 200) throw new Error("Expression too long");
  const result = new Parser(tokenize(expression)).parse();
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number");
  return result;
}
