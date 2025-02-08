import { Expr } from "./expr"
import { Token } from "../token"

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T
}

export interface Visitor<T> {
  visitExpressionStmt(stmt: Expression): T
  visitPrintStmt(stmt: Print): T
  visitVarStmt(stmt: Var): T
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

