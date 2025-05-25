import { Expr, Variable } from "./expr"
import { Token } from "../token"

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T
}

export interface Visitor<T> {
  visitBlockStmt(stmt: Block): T
  visitClassStmt(stmt: Class): T
  visitExpressionStmt(stmt: Expression): T
  visitFunctionStmt(stmt: Function): T
  visitIfStmt(stmt: If): T
  visitPrintStmt(stmt: Print): T
  visitReturnStmt(stmt: Return): T
  visitVarStmt(stmt: Var): T
  visitWhileStmt(stmt: While): T
}

export class Block extends Stmt {
  statements: Stmt[]

  constructor(statements: Stmt[]) {
    super()
    this.statements = statements
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitBlockStmt(this)
  }

}

export class Class extends Stmt {
  name: Token
  superclass: Variable|null
  methods: Function[]

  constructor(name: Token, superclass: Variable|null, methods: Function[]) {
    super()
    this.name = name
    this.superclass = superclass
    this.methods = methods
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitClassStmt(this)
  }

}

export class Expression extends Stmt {
  expression: Expr

  constructor(expression: Expr) {
    super()
    this.expression = expression
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitExpressionStmt(this)
  }

}

export class Function extends Stmt {
  name: Token
  params: Token[]
  body: Stmt[]

  constructor(name: Token, params: Token[], body: Stmt[]) {
    super()
    this.name = name
    this.params = params
    this.body = body
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitFunctionStmt(this)
  }

}

export class If extends Stmt {
  condition: Expr
  thenBranch: Stmt
  elseBranch: Stmt|null

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt|null) {
    super()
    this.condition = condition
    this.thenBranch = thenBranch
    this.elseBranch = elseBranch
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitIfStmt(this)
  }

}

export class Print extends Stmt {
  expression:  Expr

  constructor(expression:  Expr) {
    super()
    this.expression = expression
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitPrintStmt(this)
  }

}

export class Return extends Stmt {
  keyword: Token
  value: Expr|null

  constructor(keyword: Token, value: Expr|null) {
    super()
    this.keyword = keyword
    this.value = value
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitReturnStmt(this)
  }

}

export class Var extends Stmt {
  name: Token
  initializer: Expr|null

  constructor(name: Token, initializer: Expr|null) {
    super()
    this.name = name
    this.initializer = initializer
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitVarStmt(this)
  }

}

export class While extends Stmt {
  condition: Expr
  body: Stmt

  constructor(condition: Expr, body: Stmt) {
    super()
    this.condition = condition
    this.body = body
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitWhileStmt(this)
  }

}

