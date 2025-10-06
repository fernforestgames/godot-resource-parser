/**
 * Lexer for Godot resource files
 * Tokenizes .tscn and .tres file content
 */

import { Token, TokenType } from './types'
import { LexerError } from './errors'

export class Lexer {
  private source: string
  private pos: number = 0
  private line: number = 1
  private column: number = 1
  private currentToken: Token | null = null

  constructor(source: string) {
    this.source = source
  }

  /**
   * Peek at the current token without consuming it
   */
  peek(): Token {
    if (!this.currentToken) {
      this.currentToken = this.scanToken()
    }
    return this.currentToken
  }

  /**
   * Consume and return the current token
   */
  next(): Token {
    const token = this.peek()
    this.currentToken = null
    return token
  }

  /**
   * Expect a specific token type and consume it
   * @throws {LexerError} if the token type doesn't match
   */
  expect(type: TokenType, value?: string): Token {
    const token = this.next()
    if (token.type !== type) {
      throw LexerError.withContext(
        `Expected ${type} but got ${token.type}`,
        token.line,
        token.column,
        this.source
      )
    }
    if (value !== undefined && token.value !== value) {
      throw LexerError.withContext(
        `Expected '${value}' but got '${token.value}'`,
        token.line,
        token.column,
        this.source
      )
    }
    return token
  }

  /**
   * Check if we've reached the end of input
   */
  isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  /**
   * Skip whitespace and comments
   */
  private skipWhitespaceAndComments(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos]

      // Skip spaces and tabs
      if (ch === ' ' || ch === '\t') {
        this.advance()
        continue
      }

      // Skip comments (semicolon to end of line)
      if (ch === ';') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance()
        }
        continue
      }

      // Don't skip newlines - they're significant
      break
    }
  }

  /**
   * Scan and return the next token
   */
  private scanToken(): Token {
    this.skipWhitespaceAndComments()

    if (this.pos >= this.source.length) {
      return this.makeToken(TokenType.EOF, '')
    }

    const ch = this.source[this.pos]!
    const tokenLine = this.line
    const tokenColumn = this.column

    // Newlines
    if (ch === '\n' || ch === '\r') {
      this.advance()
      if (ch === '\r' && this.pos < this.source.length && this.source[this.pos] === '\n') {
        this.advance()
      }
      // Return newline token instead of skipping
      const token: Token = {
        type: TokenType.NEWLINE,
        value: '\n',
        line: tokenLine,
        column: tokenColumn,
      }
      this.line++
      this.column = 1
      return token
    }

    // Symbols
    if ('[](){}=,/:'.includes(ch)) {
      this.advance()
      return {
        type: TokenType.SYMBOL,
        value: ch,
        line: tokenLine,
        column: tokenColumn,
      }
    }

    // StringName (Godot 4 feature: &"name")
    if (ch === '&' && this.peek1() === '"') {
      this.advance() // skip '&'
      return this.scanString()
    }

    // Strings
    if (ch === '"') {
      return this.scanString()
    }

    // Hex numbers (check before regular numbers)
    if (ch === '0' && (this.peek1() === 'x' || this.peek1() === 'X')) {
      return this.scanHexNumber()
    }

    // Numbers (including negative)
    if (this.isDigit(ch) || (ch === '-' && this.isDigit(this.peek1()))) {
      return this.scanNumber()
    }

    // Identifiers and keywords
    if (this.isAlpha(ch) || ch === '_') {
      return this.scanIdentifier()
    }

    // Unknown character
    throw LexerError.withContext(
      `Unexpected character '${ch}'`,
      tokenLine,
      tokenColumn,
      this.source
    )
  }

  /**
   * Scan a quoted string with escape sequences
   */
  private scanString(): Token {
    const tokenLine = this.line
    const tokenColumn = this.column
    let value = ''

    this.advance() // Skip opening quote

    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance()
        if (this.pos >= this.source.length) {
          throw LexerError.withContext(
            'Unterminated string escape',
            this.line,
            this.column,
            this.source
          )
        }

        // Handle escape sequences
        const escapeChar = this.source[this.pos]
        switch (escapeChar) {
          case 'n':
            value += '\n'
            break
          case 't':
            value += '\t'
            break
          case 'r':
            value += '\r'
            break
          case '\\':
            value += '\\'
            break
          case '"':
            value += '"'
            break
          case 'u': {
            // Unicode escape: \uXXXX
            this.advance()
            const hex = this.source.slice(this.pos, this.pos + 4)
            if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw LexerError.withContext(
                'Invalid unicode escape sequence',
                this.line,
                this.column,
                this.source
              )
            }
            value += String.fromCharCode(parseInt(hex, 16))
            this.pos += 3 // advance will add 1 more
            this.column += 3
            break
          }
          default:
            // Unknown escape, just include the character
            value += escapeChar
        }
        this.advance()
      } else {
        if (this.source[this.pos] === '\n') {
          this.line++
          this.column = 0
        }
        value += this.source[this.pos]
        this.advance()
      }
    }

    if (this.pos >= this.source.length) {
      throw LexerError.withContext(
        'Unterminated string',
        tokenLine,
        tokenColumn,
        this.source
      )
    }

    this.advance() // Skip closing quote

    return {
      type: TokenType.STRING,
      value,
      line: tokenLine,
      column: tokenColumn,
    }
  }

  /**
   * Scan a number (integer, float, or scientific notation)
   */
  private scanNumber(): Token {
    const tokenLine = this.line
    const tokenColumn = this.column
    let value = ''

    // Handle negative sign
    if (this.source[this.pos] === '-') {
      value += this.source[this.pos]
      this.advance()
    }

    // Scan integer part
    while (this.pos < this.source.length && this.isDigit(this.source[this.pos]!)) {
      value += this.source[this.pos]!
      this.advance()
    }

    // Scan decimal part
    if (this.pos < this.source.length && this.source[this.pos] === '.') {
      value += this.source[this.pos]!
      this.advance()

      while (this.pos < this.source.length && this.isDigit(this.source[this.pos]!)) {
        value += this.source[this.pos]!
        this.advance()
      }
    }

    // Scan exponent part
    if (this.pos < this.source.length && (this.source[this.pos] === 'e' || this.source[this.pos] === 'E')) {
      value += this.source[this.pos]!
      this.advance()

      if (this.pos < this.source.length && (this.source[this.pos] === '+' || this.source[this.pos] === '-')) {
        value += this.source[this.pos]!
        this.advance()
      }

      while (this.pos < this.source.length && this.isDigit(this.source[this.pos]!)) {
        value += this.source[this.pos]!
        this.advance()
      }
    }

    return {
      type: TokenType.NUMBER,
      value: parseFloat(value),
      line: tokenLine,
      column: tokenColumn,
    }
  }

  /**
   * Scan a hexadecimal number
   */
  private scanHexNumber(): Token {
    const tokenLine = this.line
    const tokenColumn = this.column

    this.advance() // Skip '0'
    this.advance() // Skip 'x'

    let value = ''
    while (this.pos < this.source.length && this.isHexDigit(this.source[this.pos]!)) {
      value += this.source[this.pos]!
      this.advance()
    }

    if (value.length === 0) {
      throw LexerError.withContext(
        'Invalid hexadecimal number',
        tokenLine,
        tokenColumn,
        this.source
      )
    }

    return {
      type: TokenType.NUMBER,
      value: parseInt(value, 16),
      line: tokenLine,
      column: tokenColumn,
    }
  }

  /**
   * Scan an identifier or keyword
   */
  private scanIdentifier(): Token {
    const tokenLine = this.line
    const tokenColumn = this.column
    let value = ''

    while (
      this.pos < this.source.length &&
      (this.isAlphaNumeric(this.source[this.pos]!) || this.source[this.pos] === '_')
    ) {
      value += this.source[this.pos]!
      this.advance()
    }

    return {
      type: TokenType.IDENTIFIER,
      value,
      line: tokenLine,
      column: tokenColumn,
    }
  }

  /**
   * Advance position and column
   */
  private advance(): void {
    this.pos++
    this.column++
  }

  /**
   * Peek at the next character without consuming it
   */
  private peek1(): string {
    if (this.pos + 1 >= this.source.length) {
      return '\0'
    }
    return this.source[this.pos + 1]!
  }

  /**
   * Check if character is a digit
   */
  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9'
  }

  /**
   * Check if character is a hex digit
   */
  private isHexDigit(ch: string): boolean {
    return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
  }

  /**
   * Check if character is alphabetic
   */
  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
  }

  /**
   * Check if character is alphanumeric
   */
  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch)
  }

  /**
   * Helper to create a token
   */
  private makeToken(type: TokenType, value: string | number): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    }
  }
}
