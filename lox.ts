import { Scanner } from "./scanner"
import { Parser } from "./parser"
import { AstPrinter } from "./printer"
import { Interpreter } from "./interpreter"
import { LoxError, ParseError, RuntimeError } from "./error"
import { Resolver } from "./resolver"

export class Lox {
  hadError: boolean
  hadRuntimeError: boolean
  interpreter: Interpreter

  constructor() {
    this.hadError = false
    this.hadRuntimeError = false
    this.interpreter = new Interpreter()
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

  runtimeError(e: RuntimeError) {
    if (e.token != null) {
      console.error(`${e.message}\n[line ${e.token.line}]`)
    } else {
      console.error(`${e.message}\n[unknown line]`)
    }
    this.hadRuntimeError = true
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
    const stmts = parser.parse()

    if (stmts.length == 0) {
      console.error("No statements parsed")
      return
    }

    console.log("#Start resolver!")

    const resolver = new Resolver(this.interpreter)
    resolver.resolveStmtList(stmts)

    console.log("#Done resolver!")
    if(resolver.hadError) {
      console.log("==Resolver errors found==\n")
      return
    }

    // print resolver's scopes
    // for (let i = 0; i < resolver.scopes.length; i++) {
    //   console.log(resolver.scopes[i])
    // }

    // console.log("==Parse Result==\n")
    // console.log(new AstPrinter().print(expr))

    console.log("==Interpreter Result==\n")
    this.interpreter.interpret(stmts)
  }
}
