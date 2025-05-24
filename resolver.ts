import { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical, Call } from "./parse/expr";
import { Stmt, Block, Expression, Return, Visitor as StmtVisitor, Var, If,  While, Function, Print, Class } from "./parse/stmt";
import { Interpreter } from "./interpreter";
import { ResolutionError, RuntimeError } from "./error";
import { Token } from "./token";

enum FunctionType {
  NONE,
  FUNCTION,
}
export class Resolver implements ExprVisitor<void>, StmtVisitor<void>  {

  interpreter: Interpreter
  scopes: Record<string, boolean>[] // should be used like a Stack
  errors: any[]
  hadError: boolean
  currentFunction: FunctionType

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.scopes = []
    this.errors = []
    this.hadError = false
    this.currentFunction = FunctionType.NONE
  }

  visitBlockStmt(stmt: Block) {
    this.beginScope()
    this.resolveStmtList(stmt.statements)
    this.endScope()
  }

  resolveStmtList(stmts: Stmt[]) {
    for (let i = 0; i < stmts.length; i++) {
      this.resolveStmtOne(stmts[i])
    } 
  }

  resolveExpr(expr: Expr) {
    expr.accept(this)
  }

  declare(name: Token) {
    if (this.scopes.length == 0) {
      return
    }

    const scope = this.scopes[this.scopes.length - 1]

    if(scope[name.lexeme] != undefined) {
      this.hadError = true 
      this.errors.push(new ResolutionError({token: name, message: "Name collision during variable resolution"}))
    }

    scope[name.lexeme] = false
  }

  define(name: Token) {
    if(this.scopes.length == 0) {
      return
    }

    this.scopes[this.scopes.length -1][name.lexeme] = true
  }

  visitVarStmt(stmt: Var): void {
    this.declare(stmt.name)
    if (stmt.initializer != null) {
      this.resolveExprOne(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitVariableExpr(expr: Variable) {
    if(this.scopes.length > 0 && this.scopes[this.scopes.length -1][expr.name.lexeme] == false) {
      throw new RuntimeError({token: expr.name, message: "Can't read local variable in its own initializer."})
    }

    this.resolveLocal(expr, expr.name)
  }


  visitAssignExpr(expr: Assign): void {
      this.resolveExpr(expr.value)
      this.resolveLocal(expr, expr.name)
  }

  visitFunctionStmt(stmt: Function): void {
    this.declare(stmt.name) 
    this.define(stmt.name)

    this.resolveFunction(stmt, FunctionType.FUNCTION)
  }

  resolveFunction(stmt: Function, t: FunctionType): void {
    this.beginScope()
    const enclosingFunction = this.currentFunction
    this.currentFunction = t
    stmt.params.forEach(param => {
      this.declare(param)    
      this.define(param)
    });

    this.resolveStmtList(stmt.body)

    this.endScope()
    this.currentFunction = enclosingFunction
  }

  visitExpressionStmt(stmt: Expression): void {
      this.resolveExpr(stmt.expression)
  }

  visitIfStmt(stmt: If) {
    this.resolveExpr(stmt.condition)
    this.resolveStmtOne(stmt.thenBranch)

    if(stmt.elseBranch != null) {
      this.resolveStmtOne(stmt.elseBranch)
    }
  }

  visitPrintStmt(stmt: Print): void {
    this.resolveExpr(stmt.expression)
  }

  visitReturnStmt(stmt: Return): void {
    if (this.currentFunction == FunctionType.NONE) {
      this.hadError = true
      this.errors.push(new ResolutionError({token: stmt.keyword, message: "Can't return from top-level code"}))
    }
    if (stmt.value != null) {
      this.resolveExpr(stmt.value)
    }
  }

  visitWhileStmt(stmt: While): void {
    this.resolveExpr(stmt.condition)
    this.resolveStmtOne(stmt.body)
  }

  visitClassStmt(stmt: Class): void {
    this.declare(stmt.name)
    this.define(stmt.name)
  }

  visitBinaryExpr(expr: Binary) {
    this.resolveExpr(expr.left)
    this.resolveExpr(expr.right)
  }

  visitCallExpr(expr: Call): void {
    this.resolveExpr(expr.callee) 

    expr.args.forEach(arg => {
      this.resolveExpr(arg) 
    });
  }

  visitGroupingExpr(expr: Grouping): void {
     this.resolveExpr(expr.expression) 
  }

  visitLiteralExpr(_: Literal): void {}

  visitLogicalExpr(expr: Logical): void {
     this.resolveExpr(expr.left)
     this.resolveExpr(expr.right)
  }

  visitUnaryExpr(expr: Unary): void {
      this.resolveExpr(expr.right)
  }

  resolveLocal(expr: Variable, name: Token) {
    for (let i = this.scopes.length - 1;  i >= 0; i--) {
      if (name.lexeme in this.scopes[i]) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
      }
    }
  }

  resolveStmtOne(stmt: Stmt) {
    stmt.accept(this)
  }

  resolveExprOne(expr: Expr) {
    expr.accept(this)
  }

  beginScope() {
    this.scopes.push({})
  }

  endScope() {
    this.scopes.pop()
  }
}
