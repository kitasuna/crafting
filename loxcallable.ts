import { Expr } from "./parse/expr";
import { Interpreter } from "./interpreter";

export interface LoxCallable {
  loxcall(interpreter: Interpreter, args: Expr[]): any
}
