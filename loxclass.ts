import { Interpreter } from "./interpreter"
import { LoxCallable } from "./loxcallable"
import { LoxFunction } from "./loxfunction"
import { LoxInstance } from "./loxinstance"
import { Expr } from "./parse/expr"

export class LoxClass implements LoxCallable {
  name: string
  methods: Record<string, LoxFunction>

  constructor(name: string, methods: Record<string, LoxFunction>) {
    this.name = name
    this.methods = methods
  }


  toString(): string {
    return this.name + "!"
  }

  loxcall(interpreter: Interpreter, args: Expr[]): any {
    const instance = new LoxInstance(this)
    return instance
  }

  findMethod(name: string): LoxFunction|null {
    if(this.methods.hasOwnProperty(name)) {
      return this.methods[name]
    }

    return null
  }

  arity(): number {
    return 0
  }


}
