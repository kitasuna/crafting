import { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical, Call, Get, Setter, This, Super } from "./parse/expr";
import { Stmt, Block, Expression, Return, Visitor as StmtVisitor, Var, If,  While, Function, Print, Class } from "./parse/stmt";
import { Interpreter } from "./interpreter";
import { ResolutionError, RuntimeError } from "./error";
import { Token } from "./token";

enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD,
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void>  {

  interpreter: Interpreter
  scopes: Record<string, boolean>[] // should be used like a Stack
  errors: any[]
  hadError: boolean
  currentFunction: FunctionType
  currentClass: ClassType

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.scopes = []
    this.errors = []
    this.hadError = false
    this.currentFunction = FunctionType.NONE
    this.currentClass = ClassType.NONE
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
      this.resolveExpr(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitGetExpr(expr: Get) {
    this.resolveExpr(expr.obj)
  }

  visitSetterExpr(expr: Setter) {
    this.resolveExpr(expr.value)
    this.resolveExpr(expr.obj)
  }

  visitVariableExpr(expr: Variable) {
    if(this.scopes.length > 0 && this.scopes[this.scopes.length -1][expr.name.lexeme] == false) {
      throw new RuntimeError({token: expr.name, message: "Can't read local variable in its own initializer."})
    }

    this.resolveLocal(expr, expr.name)
  }

  visitThisExpr(expr: This) {
    if (this.currentClass == ClassType.NONE) {
      this.hadError = true
      this.errors.push(new ResolutionError({token: expr.keyword, message: "Can't use `this` outside a class."}))
    }
    this.resolveLocal(expr, expr.keyword)
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
      if(this.currentFunction == FunctionType.INITIALIZER) {
        this.hadError = true
        this.errors.push(new ResolutionError({token: stmt.keyword, message: "Can't return a value from an initializer."}))
      }
      this.resolveExpr(stmt.value)
    }
  }

  visitWhileStmt(stmt: While): void {
    this.resolveExpr(stmt.condition)
    this.resolveStmtOne(stmt.body)
  }

  visitClassStmt(stmt: Class): void {
    const enclosingClass = this.currentClass
    this.currentClass = ClassType.CLASS

    this.declare(stmt.name)
    this.define(stmt.name)

    if (stmt.superclass != null &&
        stmt.name.lexeme == stmt.superclass.name.lexeme) {
        this.hadError = true
        this.errors.push(new ResolutionError({token: stmt.superclass.name, message: "A class can't inherit from itself."}))
    }

    if(stmt.superclass != null) {
      this.currentClass = ClassType.SUBCLASS
      this.resolveExpr(stmt.superclass)
    }

    if(stmt.superclass != null) {
      this.beginScope();
      this.scopes[this.scopes.length - 1]["super"] = true
    }

    this.beginScope()
    this.scopes[this.scopes.length - 1]["this"] = true

    stmt.methods.forEach(method => {
      let declaration = FunctionType.METHOD
      if(method.name.lexeme == "init") {
        declaration = FunctionType.INITIALIZER
      }
      this.resolveFunction(method, declaration)
    })

    this.endScope()

    if(stmt.superclass != null) {
      this.endScope()
    }

    this.currentClass = enclosingClass
  }

  visitSuperExpr(expr: Super) {
    if(this.currentClass == ClassType.NONE) {
        this.hadError = true
        this.errors.push(new ResolutionError({token: expr.keyword, message: "Can't use 'super' outside of a class."}))
    } else if (this.currentClass != ClassType.SUBCLASS) {
        this.hadError = true
        this.errors.push(new ResolutionError({token: expr.keyword, message: "Can't use 'super' in a class with no superclass."}))
    }

    this.resolveLocal(expr, expr.keyword)
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

  resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1;  i >= 0; i--) {
      if (name.lexeme in this.scopes[i]) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
      }
    }
  }

  resolveStmtOne(stmt: Stmt) {
    stmt.accept(this)
  }

  beginScope() {
    this.scopes.push({})
  }

  endScope() {
    this.scopes.pop()
  }
}
