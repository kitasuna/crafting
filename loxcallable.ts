import { Expr } from "./parse/expr";
import { Interpreter } from "./interpreter";

export interface LoxCallable {
  arity(): number
  loxcall(i: Interpreter, args: Expr[]): Expr
}
