import { Scanner } from "./scanner"
import { Parser } from "./parser"
import { AstPrinter } from "./printer"
import { LoxError, ParseError } from "./error"

export class Lox {
  hadError: boolean

  constructor() {
    this.hadError = false
  }

  report = (e: Error): string => {
    this.hadError = true
    if (e instanceof LoxError) {
    return `[line ${e.line}] Error${e.where}: ${e.message}`
    } else if (e instanceof ParseError) {
      return `[line ${e.token.line}] at '${e.token.lexeme}': ${e.message}`
    }

    return "Unknown error!"
  }

  run = (source: string): void => {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()

    if (scanner.errors.length > 0) {
      console.log("==Errors==\n")
      scanner.errors.forEach((e) => {
        console.log(this.report(e))
      })
    }

    console.log("==Tokens==\n")
    tokens.forEach((t) => {
      console.log(t)
    })

    const parser = new Parser(tokens)
    const expr = parser.parse()

    if (expr == null) {
      console.error("Returned expr was null")
      return
    }

    console.log("==Parse Result==\n")
    console.log(new AstPrinter().print(expr))
  }
}
