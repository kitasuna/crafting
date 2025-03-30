export interface LoxCallable {
  (Interpreter interpreter, args []Expr): any
}
