import { Token } from "./token"

export class LoxError extends Error {
  line: number;
  where: string;
  message: string;

  constructor({line, where, message}: {line: number, where: string, message: string}) {
    super()
    this.line = line
    this.where = where
    this.message = message
  }
}

export class ParseError extends Error {
  token: Token;
  message: string;

  constructor({token, message}: {token: Token, message: string}) {
    super()
    this.token = token
    this.message = message
  }
}

export class ResolutionError extends Error {
  token: Token;
  message: string;

  constructor({token, message}: {token: Token, message: string}) {
    super()
    this.token = token
    this.message = message
  }
}

export class RuntimeError extends Error {
  token: Token|null;
  message: string

  constructor({token, message}: {token: Token|null, message: string}) {
    super()
    this.token = token
    this.message = message
  }
}

export class ReturnException extends RuntimeError {
  value: any;

  constructor(value: any) {
    super({token: null, message: "return statement"})
    this.value = value
  }
}
