import { RuntimeError } from "./error"
import { Token} from "./token"

export class Environment {
  values: Record<string, any>
  enclosing: Environment|null // null for the global scope

  constructor(enclosing: Environment|null) {
    this.values = {}
    this.enclosing = enclosing
  }

  define(name: string, value: any) {
    this.values[name] = value
  }

  get(name: Token): any {
    if(this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme] 
    }

    if(this.enclosing != null) {
      return this.enclosing.get(name)
    }

    throw new RuntimeError({token: name, message: `Undefined variable '${name.lexeme}'.`})
  }

  getAt = (distance: number, name: string) => {
    const env = this.ancestor(distance)
    return env.values[name]
  }

  assignAt = (distance: number, name: Token, value: any) => {
    this.ancestor(distance).values[name.lexeme] = value
  }

  ancestor(distance: number): Environment {
    let env: Environment = this
    for (let j = 0; j < distance; j++) {
        env = env.enclosing!

    }
    return env
  }

  assign(name: Token, value: any): void {
    if(this.values.hasOwnProperty(name.lexeme)) {
      this.values[name.lexeme] = value
      return
    }

    if(this.enclosing != null) {
      this.enclosing.assign(name, value)
      return
    }

    throw new RuntimeError({token: name, message: `Undefined variable '${name.lexeme}'.`})
  }
}
