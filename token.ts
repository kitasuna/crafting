export type Token = {
  type: TokenType,
  lexeme: string,
  literal: Object,
  line: number,
}

export const NewToken = (
  type: TokenType, 
  lexeme: string,
  literal: Object,
  line: number,
): Token => {
  return {
    type: type,
    lexeme: lexeme,
    literal: literal,
    line: line,
  }
}

export const ToString = (t: Token): string => {
  return `${t.type} ${t.lexeme} ${t.literal}`
}

export enum TokenType {
  // Single-character tokens
  LEFT_PAREN="LEFT_PAREN", RIGHT_PAREN="RIGHT_PARENT", LEFT_BRACE="LEFT_BRACE", RIGHT_BRACE="RIGHT_BRACE",
  COMMA="COMMA", DOT="DOT", MINUS="MINUS", PLUS="PLUS", SEMICOLON="SEMICOLON", SLASH="SLASH", STAR="STAR",

  // One or two character tokens
  BANG="BANG", BANG_EQUAL="BANG_EQUAL",
  EQUAL="EQUAL", EQUAL_EQUAL="EQUAL_EQUAL",
  GREATER="GREATER", GREATER_EQUAL="GREATER_EQUAL",
  LESS="LESS", LESS_EQUAL="LESS_EQUAL",

  // Literals
  IDENTIFIER="IDENTIFIER", STRING="STRING", NUMBER="NUMBER",

  // Keywords
  AND="AND", CLASS="CLASS", ELSE="ELSE", FALSE="FALSE", FUN="FUN", FOR="FOR", IF="IF", NIL="NIL", OR="OR",
  PRINT="PRINT", RETURN="RETURN", SUPER="SUPER", THIS="THIS", TRUE="TRUE", VAR="VAR", WHILE="WHILE",

  EOF="EOF",
}

export const ReservedWords: Record<string, TokenType> = {
  "and": TokenType.AND,
  "class": TokenType.CLASS,
  "else": TokenType.ELSE,
  "false": TokenType.FALSE,
  "for": TokenType.FOR,
  "fun": TokenType.FUN,
  "if": TokenType.IF,
  "nil": TokenType.NIL,
  "or": TokenType.OR,
  "print": TokenType.PRINT,
  "return": TokenType.RETURN,
  "super": TokenType.SUPER,
  "this": TokenType.THIS,
  "true": TokenType.TRUE,
  "var": TokenType.VAR,
  "while": TokenType.WHILE,
}
