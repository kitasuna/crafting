import { LoxCallable } from "./loxcallable";
import { Function } from "./parse/stmt";
import { Expr } from "./parse/expr";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";
import { ReturnException } from "./error";

export class LoxFunction implements LoxCallable {
  declaration: Function
  closure: Environment

  constructor(declaration: Function, closure: Environment) {
    this.declaration = declaration
    this.closure = closure
  }

  arity() {
    return this.declaration.params.length
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  loxcall(interpreter: Interpreter, args: Expr[]): any {
    const environment = new Environment(this.closure)
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(
        this.declaration.params[i].lexeme,
        args[i]
      )
    }

    try {
    interpreter.executeBlock(this.declaration.body, environment)
    } catch (re: unknown) {
      if (isReturnException(re)) {
        return re.value
      }
      // Re-throw if it's anything else
      throw re
    }
    return null
  }
}

const isReturnException = (err: unknown): err is ReturnException => {
  return err instanceof ReturnException
}
