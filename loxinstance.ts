import { LoxClass } from "./loxclass";

export class LoxInstance {
  klass: LoxClass   

  constructor(klass: LoxClass) {
    this.klass = klass
  }

  toString(): string {
    return this.klass.name + " instance"
  }
}
