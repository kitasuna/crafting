import { ParseError } from "./error"
import { TokenType, Token} from "./token"
import { Assign, Binary, Expr, Grouping, Literal, Logical, Unary, Variable } from "./parse/expr";
import { Stmt, Block, Print, Expression, Var, If, While } from "./parse/stmt";
import { isNullOrUndefined } from "util";

export class Parser {
  tokens: Token[]
  current: number
  errors: any[]
  hadError: boolean

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.errors = []
    this.current = 0
    this.hadError =  false
  }
  
  parse(): Stmt[] {
    let statements: Stmt[] = []
    while (!this.isAtEnd()) {
      const result = this.declaration()
      if (result != null) {
        statements = statements.concat([result])
      }
    }

    return statements
  }

  or(): Expr {
    let expr = this.and() 

    while(this.match(TokenType.OR)) {
      const operator = this.previous()
      const right = this.and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  and(): Expr {
    let expr = this.equality()

    while(this.match(TokenType.AND)) {
      const operator = this.previous()
      const right = this.equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  expression(): Expr {
    return this.assignment()
  }

  assignment(): Expr {
    const expr = this.or()

    if(this.match(TokenType.EQUAL)) {
      const equals = this.previous()
      const value = this.assignment()

      if (expr instanceof Variable) {
        const name = expr.name
        return new Assign(name, value)
      }

      this.error(equals, "Invalid assignment target")
    }

    return expr
  }

  error(token: Token, message: string) {
    this.hadError = true
    this.errors.push(new ParseError({token, message}))
  }

  declaration(): Stmt|null {
    try {
      if(this.match(TokenType.VAR)) {
        return this.varDeclaration()
      }
      return this.statement()
    } catch (e: unknown) {
      this.synchronize()
      return null
    }
  }

  statement(): Stmt {
    if(this.match(TokenType.FOR)) {
      return this.forStatement()
    }
    if(this.match(TokenType.IF)) {
      return this.ifStatement()
    }
    if(this.match(TokenType.WHILE)) {
      return this.whileStatement()
    }
    if(this.match(TokenType.PRINT)) {
      return this.printStatement()
    }

    if(this.match(TokenType.LEFT_BRACE)) {
      return new Block(this.block())
    }

    return this.expressionStatement()
  }

  block(): Stmt[] {
    let statements: Stmt[] = []
    while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const decl = this.declaration()
      if (decl != null) {
        statements = statements.concat([decl])
      }
    }
    this.consume(TokenType.RIGHT_BRACE, `Expect '}' after block.`)

    return statements
  }

  forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.")
    let initializer: Stmt|null = null
    if(this.match(TokenType.SEMICOLON)) {
      initializer = null
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition: Expr|null = null
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression()
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition")

    let increment: Expr|null = null
    if(!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression()
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.")

    let body =  this.statement()

    if (increment != null) {
      body = new Block(
        [body, new Expression(increment)]
      )
    }

    if(condition == null) {
      condition = new Literal(true)
    }
    body = new While(condition,  body)

    if(initializer != null) {
      body = new Block([initializer, body])
    }

    return body
  }

  ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.")
    const condition = this.expression()

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.")
    const thenBranch = this.statement()
    let elseBranch = null
    if(this.match(TokenType.ELSE)) {
      elseBranch = this.statement()
    }
    return new If(condition, thenBranch, elseBranch)
  }

  whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
    const condition = this.expression()

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after while condition.")

    const body = this.statement()
    return new While(condition, body)
  }

  printStatement(): Stmt {
    const value: Expr = this.expression()
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
    return new Print(value)
  }

  varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.")
    let initializer: Expr|null = null;
    if(this.match(TokenType.EQUAL)) {
      initializer = this.expression()
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration")
    return new Var(name, initializer)
  }

  expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.")
    return new Expression(expr)
  }

  equality(): Expr {
    let expr = this.comparison()

    while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  comparison(): Expr {
    let expr = this.term()

    while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous()
      const right = this.term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  term(): Expr {
    let expr = this.factor()

    while(this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous()
      const right =  this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  factor(): Expr {
    let expr = this.unary()

    while(this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  unary(): Expr {
    if(this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous()
      const right = this.unary()
      return new Unary(operator, right)
    }

    return this.primary()
  }

  primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return new Literal(false)
    }

    if (this.match(TokenType.TRUE)) {
      return new Literal(true)
    }

    if (this.match(TokenType.NIL)) {
      return new Literal({})
    }

    if (this.match(TokenType.NUMBER)) {
      return new Literal(this.previous().literal)
    }

    if (this.match(TokenType.STRING)) {
      return new Literal(new String(this.previous().literal))
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous())
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression()
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
      return new Grouping(expr)
    }

    console.log(`About to throw because : ${this.peek().type}`)
    throw new ParseError({token: this.peek(), message: "Invalid token."})
  }

  match(...types: TokenType[]): boolean {
    for (let i = 0; i < types.length; i++) {
      if (this.check(types[i])) {
        this.advance()
        return true
      }
    }
    return false
  }

  consume(t: TokenType, msg: string): Token {
    if (this.check(t)) {
      return this.advance()
    }

    throw new ParseError({token: this.peek(), message: msg})
  }

  check(t: TokenType): boolean {
    if (this.isAtEnd()) {
      return false
    }
    return this.peek().type == t
  }

  advance(): Token {
    if (!this.isAtEnd()) {
      this.current++
    }
      return this.previous()
  }

  isAtEnd(): boolean {
    return this.peek().type == TokenType.EOF;
  }

  peek(): Token {
    return this.tokens[this.current]
  }

  previous(): Token {
    return this.tokens[this.current-1]
  }

  synchronize(): void {
    this.advance()

    while(!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) {
        return
      }

      switch(this.peek().type) {
        case TokenType.CLASS:
          case TokenType.FUN:
          case TokenType.VAR:
          case TokenType.FOR:
          case TokenType.IF:
          case TokenType.WHILE:
          case TokenType.PRINT:
          case TokenType.RETURN:
          return
      }

      this.advance()
    }
  }
}
