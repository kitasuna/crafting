import { TokenType, NewToken, Token, ReservedWords } from "./token"
import { LoxError } from "./error"

export class Scanner {
  source: string
  start: number
  current: number
  line: number
  tokens: Token[]
  errors: LoxError[]


  constructor(source: string) {
    this.source = source
    this.start = 0
    this.current = 0
    this.line = 1
    this.tokens = []
    this.errors = []
  }

  scanTokens = (): Token[] => {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(NewToken(TokenType.EOF, "", {}, this.line))

    return this.tokens
  }

  isAtEnd = (): boolean => {
    return this.current >= this.source.length
  }


  match = (expected: string) => {
    if (this.isAtEnd()) {
      return false
    }

    if (this.source.charAt(this.current) != expected) {
      return false
    }

    this.current += 1
    return true
  }

  // Return one character and advance this.current
  advance = (): string => {
    return this.source.charAt(this.current++)
  }

  // Return one character without advancing this.current
  peek = (): string => {
    if (this.isAtEnd()) {
      return '\0'
    }
    return this.source.charAt(this.current)
  }

  peekNext = (): string => {
    if (this.current + 1 >= this.source.length) {
      return '\0'
    }
    return this.source.charAt(this.current + 1)
  }

  addToken = (type: TokenType, literal: Object): void => {
    const lexeme = this.source.substring(this.start, this.current)
    this.tokens.push(NewToken(type, lexeme, literal, this.line))
  }

  matchString = (): void => {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if(this.peek() == '\n') {
        this.line += 1
      }
      this.advance()
    }

    if (this.isAtEnd()) {
      this.errors.push({name: "LoxError", line: this.line, where: "", message: `Unterminated string.`})
      return
    }

    // the closing "
    this.advance()

    const str = this.source.substring(this.start + 1, this.current - 1)
    this.addToken(TokenType.STRING, str)
  }

  isDigit = (c: string): boolean => {
    return c >= '0' && c <= '9'
  }

  isAlpha = (c: string): boolean => {
    return (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c == '_'
  }

  isAlphaNumeric = (c: string): boolean => {
    return this.isAlpha(c) || this.isDigit(c)
  }

  matchNumber = (): void => {
    while (this.isDigit(this.peek())) {
      this.advance()
    }

    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()

      while (this.isDigit(this.peek())) {
        this.advance()
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)))
  }

  matchIdentifier = (): void => {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const str = this.source.substring(this.start, this.current)
    let tokenType = ReservedWords[str]
    if (tokenType == null) {
      tokenType = TokenType.IDENTIFIER
    }
    this.addToken(tokenType, {})
  }

  scanToken = (): void => {
    const c = this.source.charAt(this.current++)

    switch(c) {
      case '(': this.addToken(TokenType.LEFT_PAREN, {}); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN, {}); break;
      case '{': this.addToken(TokenType.LEFT_BRACE, {}); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE, {}); break;
      case ',': this.addToken(TokenType.COMMA, {}); break;
      case '.': this.addToken(TokenType.DOT, {}); break;
      case '-': this.addToken(TokenType.MINUS, {}); break;
      case '+': this.addToken(TokenType.PLUS, {}); break;
      case ';': this.addToken(TokenType.SEMICOLON, {}); break;
      case '*': this.addToken(TokenType.STAR, {}); break;
      case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG, {}); break;
      case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL, {}); break;
      case '<': this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS, {}); break;
      case '>': this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER, {}); break;
      case '/':
        if (this.match('/')) {
        while (this.peek() != '\n' && !this.isAtEnd()) {
          this.advance()
        }
      } else  {
        this.addToken(TokenType.SLASH, {})
      }
      break
      case ' ':
      case '\r':
      case '\t':
        break
      case '\n':
        this.line += 1
        break
      case '"': this.matchString(); break;
      default:
        if (this.isDigit(c)) {
          this.matchNumber()
        } else if (this.isAlpha(c)){
          this.matchIdentifier()
        } else {
          this.errors.push({name: "LoxError", line: this.line, where: "", message: `Unexpected character: ${c}`})
        }
    }
  }
}
