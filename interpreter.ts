import { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical, Call, Get, Setter, This, Super } from "./parse/expr";
import { Stmt, Block, Expression, Return, Visitor as StmtVisitor, Var, If,  While, Function, Class } from "./parse/stmt";
import { Token, TokenType } from "./token";
import { Environment } from "./environment";
import { RuntimeError, ReturnException } from "./error";
import { LoxFunction } from "./loxfunction";
import { LoxClass } from "./loxclass";
import { LoxInstance } from "./loxinstance";
import { LoxCallable } from "./loxcallable";

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void>  {
  environment: Environment
  globals: Environment
  locals: Map<Expr, number>

  constructor() {
    this.globals = new Environment(null)
    this.environment = this.globals
    this.locals = new Map<Expr, number>

    this.globals.define("clock", {
      arity: () => 0,
      loxcall: (_i: Interpreter,
                _as: any[]) => Date.now() / 1000,

      toString: () => "<native fn>",
    })
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

  resolve = (expr: Expr, depth: number) => {
    this.locals.set(expr, depth)
  }

  visitGetExpr(expr: Get) {
    const obj = this.evaluate(expr.obj)
    if (obj instanceof LoxInstance) {
      return obj.get(expr.name)
    }

    throw new RuntimeError({ token: expr.name, message: "Only instances have properties."})
  }

  visitSetterExpr(expr: Setter) {
    const obj = this.evaluate(expr.obj)
    if (!(obj instanceof LoxInstance)) {
      throw new RuntimeError({token: expr.name, message: "Only instances have fields."})
    }

    const val = this.evaluate(expr.value)
    obj.set(expr.name, val) 
    return val
  }

  visitCallExpr(expr: Call) {
      let callee = this.evaluate(expr.callee)

      if(!instanceOfLoxCallable(callee)) {
        throw new RuntimeError({token: callee, message: "Can only call functions and classes."})
      }

      const args: Expr[] = []

      expr.args.forEach((a: Expr) => {
        args.push(this.evaluate(a)) 
      });

      let myFunction = callee as LoxCallable

      if(args.length != myFunction.arity()) {
        throw new RuntimeError({token: expr.paren, message: `Expected ${myFunction.arity()} arguments` +
                               `but got ${arguments.length}.`})
      }

      return myFunction.loxcall(this, args)
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

  visitFunctionStmt(stmt: Function): void {
      const f = new LoxFunction(stmt, this.environment, false) 
      this.environment.define(stmt.name.lexeme, f)
  }

  visitClassStmt(stmt: Class): void {
    let superclass: Object|null = null

    if(stmt.superclass != null) {
      superclass = this.evaluate(stmt.superclass)
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError({token: stmt.superclass.name, message: "Superclass must be a class."})
      }
    }
    this.environment.define(stmt.name.lexeme, null)

    if(stmt.superclass != null) {
      this.environment = new Environment(this.environment)
      this.environment.define("super", superclass)
    }

    const methods: Record<string, LoxFunction> = {}
    stmt.methods.forEach(method => {
      const f = new LoxFunction(method, this.environment, method.name.lexeme == "init")
      methods[method.name.lexeme] = f
    })
    const klass = new LoxClass(stmt.name.lexeme, superclass, methods)

    if (superclass != null) {
      this.environment = this.environment.enclosing!
    }

    this.environment.assign(stmt.name, klass)
  }

  visitSuperExpr(expr: Super) {
    const distance = this.locals.get(expr)
    const superclass: LoxClass = this.environment.getAt(distance!, "super")
    const obj: LoxInstance = this.environment.getAt(distance! - 1, "this")
    const method = superclass.findMethod(expr.method.lexeme)
    if (method == null) {
      throw new RuntimeError({token: expr.method, message: `Undefined property '${expr.method.lexeme}'`})
    }
    return method.bind(obj)
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

  visitThisExpr(expr: This) {
    return this.lookupVariable(expr.keyword, expr)
  }

  visitReturnStmt(stmt: Return) {
    let value = null
    if (stmt.value != null) {
      value = this.evaluate(stmt.value)
    }

    throw new ReturnException(value)
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
    const distance = this.locals.get(expr)
    if (distance != undefined) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }
  }

  visitVariableExpr(expr: Variable) {
    return this.lookupVariable(expr.name, expr)
  }

  lookupVariable(name: Token, expr: Expr) {
    const distance = this.locals.get(expr)
    if (distance != undefined) {
      return this.environment.getAt(distance, name.lexeme)
    } else {
      return this.globals.get(name)
    }
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
          if(left.constructor.name === "String" && right.constructor.name === "String") {
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

function instanceOfLoxCallable(obj: any): obj is LoxCallable {
  return 'loxcall' in obj
}
