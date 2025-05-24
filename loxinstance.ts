import { RuntimeError } from "./error";
import { LoxClass } from "./loxclass";
import { LoxFunction } from "./loxfunction";
import { Token } from "./token";

export class LoxInstance {
  klass: LoxClass   
  fields: Record<string, any>

  constructor(klass: LoxClass) {
    this.klass = klass
    this.fields = {}
  }

  get(name: Token): any {
    if(this.fields.hasOwnProperty(name.lexeme)) {
      return this.fields[name.lexeme] 
    }

    const method: LoxFunction|null = this.klass.findMethod(name.lexeme)
    if(method != null) {
      return method.bind(this)
    }

    throw new RuntimeError({
      token: name,
      message: `Undefined property '${name.lexeme}'`
    })
  }

  set(name: Token, val: any) {
    this.fields[name.lexeme] = val
  }

  toString(): string {
    return this.klass.name + " instance..."
  }
}
