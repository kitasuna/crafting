import { Scanner } from "./scanner"
import { LoxError } from "./error"

export class Lox {
  hadError: boolean

  constructor() {
    this.hadError = false
  }

  error = (e: LoxError): string => {
    return this.report(e.line, e.where, e.message)
  }

  report = (line: number, where: string, message: string): string => {
    this.hadError = true
    return `[line ${line}] Error${where}: ${message}`
  }

  run = (source: string): void => {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()

    if (scanner.errors.length > 0) {
      console.log("==Errors==\n")
      scanner.errors.forEach((e) => {
        console.log(this.error(e))
      })
    }

    console.log("==Tokens==\n")
    tokens.forEach((t) => {
      console.log(t)
    })
  }
}
