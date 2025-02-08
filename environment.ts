import { RuntimeError } from "./error"
import { Token} from "./token"

export class Environment {
  values: Record<string, any>

  constructor() {
    this.values = {}
  }

  define(name: string, value: any) {
    this.values[name] = value
  }

  get(name: Token): any {
    if(this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme] 
    }

    throw new RuntimeError({token: name, message: `Undefined variable '${name.lexeme}'.`})
  }

  assign(name: Token, value: any): void {
    if (this.values.hasOwnProperty(name.lexeme)) {
      this.values[name.lexeme] = value
      return
    }

    throw new RuntimeError({token: name, message: `Undefined variable '${name.lexeme}'.`})
  }
}
