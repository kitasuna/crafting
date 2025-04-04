import { LoxCallable } from "./loxcallable";
import { Function } from "./parse/stmt";
import { Expr } from "./parse/expr";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";

export class LoxFunction implements LoxCallable {
  declaration: Function

  constructor(declaration: Function) {
    this.declaration = declaration
  }

  arity() {
    return this.declaration.params.length
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  loxcall(interpreter: Interpreter, args: Expr[]): any {
    const environment = new Environment(interpreter.globals)
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(
        this.declaration.params[i].lexeme,
        args[i]
      )
    }

    interpreter.executeBlock(this.declaration.body, environment)
    return null
  }
}
