import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "../parse/expr";
import { TokenType } from "../token";

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

const main = (args: string[]): void => {
  if(args.length > 1) {
    console.log("Usage: astprint")
    process.exit(1)
  }

  const expr: Expr = new Binary(
    new Unary(
      { type: TokenType.MINUS, lexeme: "-", literal: {}, line: 1 },
      new Literal(123),
    ),
    { type: TokenType.STAR, lexeme: "*", literal: {}, line: 1 },
    new Grouping(
      new Literal(45.67),
    ),
  )

  const ap = new AstPrinter()
  const result = ap.print(expr)
  console.log(result)
}

const args = process.argv.slice(2)

main(args)
