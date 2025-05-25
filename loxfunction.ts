import { LoxCallable } from "./loxcallable";
import { Function } from "./parse/stmt";
import { Expr } from "./parse/expr";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";
import { ReturnException } from "./error";
import { LoxInstance } from "./loxinstance";

export class LoxFunction implements LoxCallable {
  declaration: Function
  closure: Environment
  isInitializer: boolean

  constructor(declaration: Function, closure: Environment, isInitializer: boolean) {
    this.declaration = declaration
    this.closure = closure
    this.isInitializer = isInitializer
  }

  arity() {
    return this.declaration.params.length
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  bind(instance: LoxInstance) {
    const environment = new Environment(this.closure)
    environment.define("this", instance)
    return new LoxFunction(this.declaration, environment, this.isInitializer)
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
      if (this.isInitializer) {
        return this.closure.getAt(0, "this")
      }
      // Returns, in our implementation, are always exceptions, so this is normal behavior
      if (isReturnException(re)) {
        return re.value
      }

      if(this.isInitializer) {
        return this.closure.getAt(0, "this")
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
