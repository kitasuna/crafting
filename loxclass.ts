import { Interpreter } from "./interpreter"
import { LoxCallable } from "./loxcallable"
import { LoxFunction } from "./loxfunction"
import { LoxInstance } from "./loxinstance"
import { Expr } from "./parse/expr"

export class LoxClass implements LoxCallable {
  name: string
  methods: Record<string, LoxFunction>
  superclass: LoxClass|null

  constructor(name: string, superclass: LoxClass|null, methods: Record<string, LoxFunction>) {
    this.name = name
    this.methods = methods
    this.superclass = superclass
  }


  toString(): string {
    return this.name + "!"
  }

  loxcall(interpreter: Interpreter, args: Expr[]): any {
    const instance = new LoxInstance(this)
    const initializer: LoxFunction|null = this.findMethod("init")
    if (initializer != null) {
      initializer.bind(instance).loxcall(interpreter, args)
    }
    return instance
  }

  findMethod(name: string): LoxFunction|null {
    if(this.methods.hasOwnProperty(name)) {
      return this.methods[name]
    }

    if(this.superclass != null) {
      return this.superclass.findMethod(name)
    }

    return null
  }

  arity(): number {
    const initializer = this.findMethod("init")
    if (initializer == null) {
      return 0
    }
    return initializer.arity()
  }


}
