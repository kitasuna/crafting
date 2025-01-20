import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./parse/expr";

export class AstPrinter implements Visitor<String> {
  print = (expr: Expr) => {
    return expr.accept(this)
  }

  visitBinaryExpr(expr: Binary): string {
      return parenthesize(this, expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr(expr: Grouping): string {
      return parenthesize(this, "group", expr.expression)
  }

  visitLiteralExpr(expr: Literal): string {
    if (expr.value == null) {
      return "nil"
    }

    return expr.value.toString()
  }

  visitUnaryExpr(expr: Unary): string {
      return parenthesize(this, expr.operator.lexeme, expr.right)
  }
}

const parenthesize = (ap: AstPrinter, name: string, ...exprs: Expr[]): string => {
  let str = ""
  str = str.concat("(")
  str = str.concat(name)
  for (let i = 0; i < exprs.length; ++i) {
    str = str.concat(" ")
    str = str.concat(exprs[i].accept(ap))
  }

  str = str.concat(")")

  return str
}

