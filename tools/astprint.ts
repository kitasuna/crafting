import { Binary, Expr, Grouping, Literal, Unary } from "../parse/expr";
import { AstPrinter } from "../printer";
import { TokenType } from "../token"

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
