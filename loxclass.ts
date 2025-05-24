import { Interpreter } from "./interpreter"
import { LoxCallable } from "./loxcallable"
import { LoxInstance } from "./loxinstance"
import { Expr } from "./parse/expr"

export class LoxClass implements LoxCallable {
  name: string

  constructor(name: string) {
    this.name = name
  }


  toString(): string {
    return this.name + "!"
  }

  loxcall(interpreter: Interpreter, args: Expr[]): any {
    const instance = new LoxInstance(this)
    return instance
  }

  arity(): number {
    return 0
  }


}
