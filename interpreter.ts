import { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical } from "./parse/expr";
import { Stmt, Block, Expression, Visitor as StmtVisitor, Var, If,  While } from "./parse/stmt";
import { Token, TokenType } from "./token";
import { Environment } from "./environment";
import { RuntimeError } from "./error";

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void>  {
  environment: Environment

  constructor() {
    this.environment = new Environment(null)
  }

  interpret(stmts: Stmt[]) {
    try {
      for (let i = 0; i < stmts.length; i++) {
        this.execute(stmts[i])
      }
    } catch (e: unknown) {
      console.error(e)
    }
  }

  execute(stmt: Stmt) {
    stmt.accept(this)
  }

  evaluate = (expr: Expr): any => {
    return expr.accept(this)
  }

  visitLogicalExpr(expr: Logical): any {
    const left = this.evaluate(expr.left)

    if(expr.operator.type == TokenType.OR) {
      if(this.isTruthy(left)) {
        return left
      }
    } else {
      if(!this.isTruthy(left)) {
        return left
      }
    } 

    return this.evaluate(expr.right)
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression)
    return
  }

  visitIfStmt(stmt: If): void {
      if(this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.thenBranch)
      } else if (stmt.elseBranch != null) {
        this.execute(stmt.elseBranch)
      }
      return
  }

  visitWhileStmt(stmt: While): void {
    while(this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
    return
  }

  visitPrintStmt(stmt: Expression) {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
    return
  }

  visitVarStmt(stmt: Var): void {
      let value: any = null 
      if(stmt.initializer != null) {
        value = this.evaluate(stmt.initializer)
      }
      this.environment.define(stmt.name.lexeme, value)
  }

  visitAssignExpr(expr: Assign) {
      const value = this.evaluate(expr.value)
      this.environment.assign(expr.name, value)
      return value
  }

  visitVariableExpr(expr: Variable) {
     return this.environment.get(expr.name) 
  }

  visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment))
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment
    try {
      this.environment = environment

      for (let i = 0; i < statements.length; i++) {
        this.execute(statements[i])
      }
    } finally {
      this.environment = previous
    }
  }

  visitLiteralExpr(expr: Literal): any {
     return expr.value 
  }

  visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression)
  }

  visitUnaryExpr(expr: Unary): any {
      const right = this.evaluate(expr.right)
      switch (expr.operator.type) {
        case TokenType.MINUS:
          this.checkNumberOperand(expr.operator, right)
          return -parseFloat(right)
        case TokenType.BANG:
          return !this.isTruthy(right)
      }

      return null
  }

  visitBinaryExpr(expr: Binary) {
      const left = this.evaluate(expr.left)
      const right = this.evaluate(expr.right)

      switch (expr.operator.type) {
        case TokenType.MINUS:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) - parseFloat(right)
        case TokenType.SLASH:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) / parseFloat(right)
        case TokenType.STAR:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) * parseFloat(right)
        case TokenType.PLUS:
          if(typeof left === "number" && typeof right === "number") {
            return left + right
          }
          if(left instanceof String && right instanceof String) {
            return left.concat(right.valueOf())
          }

        throw new RuntimeError({token: expr.operator, message: `operands must be two numbers or two strings, you gave me: ${left.constructor.name} and ${right.constructor.name}`})

        case TokenType.GREATER:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) > parseFloat(right)
        case TokenType.GREATER_EQUAL:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) >= parseFloat(right)
        case TokenType.LESS:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) < parseFloat(right)
        case TokenType.LESS_EQUAL:
          this.checkNumberOperands(expr.operator, left, right)
          return parseFloat(left) <= parseFloat(right)

        case TokenType.BANG_EQUAL:
          return !this.isEqual(left, right)
        case TokenType.EQUAL:
          return this.isEqual(left, right)
      }
  }

  isTruthy(obj: any): boolean {
    if(obj == null) {
      return false
    }

    if(obj === false) {
      return false
    }

    if(obj instanceof Boolean) {
      return obj.valueOf()
    }

    return true
  }

  isEqual(obj1: any, obj2: any): boolean {
    if (obj1 == null && obj2 == null) {
      return true
    }

    if (obj1 == null) {
      return false
    }

    return obj1 == obj2
  }

  checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand !== "number") {
      throw new RuntimeError({token: operator, message: "operand must be a number"})
    }
  }

  checkNumberOperands(operator: Token, left: any, right: any): void {
    if (typeof left !== "number") {
      throw new RuntimeError({token: operator, message: `operand must be a number, actually its a ${left.constructor.name}`})
    }

    if (typeof right !== "number") {
      throw new RuntimeError({token: operator, message: "operand must be a number"})
    }
  }

  stringify(obj: any): string {
    if (obj == null) {
      return "nil"
    }

    if (obj instanceof Number) {
      let txt = obj.toString()
      if (txt.endsWith(".0")) {
        txt =  txt.substring(0, txt.length - 2)
      }

      return txt
    }

    return obj.toString()
  }

}
