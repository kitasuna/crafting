import { ParseError, RuntimeError } from "./error"
import { TokenType, Token} from "./token"
import { Binary, Expr, Grouping, Literal, Unary, Variable } from "./parse/expr";
import { Stmt, Print, Expression, Var } from "./parse/stmt";

export class Environment {
  values: Record<string, string>

  constructor() {
    this.values = {}
  }

  define(name: string, value: any) {
    this.values[name] = value
  }

  get(name: Token) {
    if(this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme] 
    }

    throw new RuntimeError({token: name, message: `Undefined variable '${name.lexeme}'.`})
  }
}
