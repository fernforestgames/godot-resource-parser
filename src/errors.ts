/**
 * Custom error types for Godot resource parser
 */

/**
 * Base error class for all parsing errors
 */
export class ParseError extends Error {
  public readonly line: number
  public readonly column: number
  public readonly context?: string

  constructor(message: string, line: number, column: number, context?: string) {
    const fullMessage = context
      ? `${message} at line ${line}, column ${column}\n${context}`
      : `${message} at line ${line}, column ${column}`

    super(fullMessage)
    this.name = 'ParseError'
    this.line = line
    this.column = column
    if (context !== undefined) {
      this.context = context
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParseError)
    }
  }

  /**
   * Create error with context snippet from source
   */
  static withContext(
    message: string,
    line: number,
    column: number,
    source: string,
    contextLines: number = 2
  ): ParseError {
    const context = this.extractContext(source, line, column, contextLines)
    return new ParseError(message, line, column, context)
  }

  /**
   * Extract context snippet from source code
   */
  private static extractContext(
    source: string,
    line: number,
    column: number,
    contextLines: number
  ): string {
    const lines = source.split('\n')
    const startLine = Math.max(0, line - contextLines - 1)
    const endLine = Math.min(lines.length, line + contextLines)

    const contextSnippet = []
    const lineNumberWidth = String(endLine).length

    for (let i = startLine; i < endLine; i++) {
      const lineNum = i + 1
      const lineNumStr = String(lineNum).padStart(lineNumberWidth, ' ')
      const prefix = lineNum === line ? '>' : ' '
      contextSnippet.push(`${prefix} ${lineNumStr} | ${lines[i]}`)

      // Add caret pointing to error column on the error line
      if (lineNum === line) {
        const indent = ' '.repeat(lineNumberWidth + 4 + column - 1)
        contextSnippet.push(`${indent}^`)
      }
    }

    return '\n' + contextSnippet.join('\n')
  }
}

/**
 * Error during lexical analysis (tokenization)
 */
export class LexerError extends ParseError {
  constructor(message: string, line: number, column: number, context?: string) {
    super(message, line, column, context)
    this.name = 'LexerError'
  }

  static override withContext(
    message: string,
    line: number,
    column: number,
    source: string,
    contextLines: number = 2
  ): LexerError {
    const context = ParseError['extractContext'](source, line, column, contextLines)
    return new LexerError(message, line, column, context)
  }
}

/**
 * Error during syntax parsing
 */
export class SyntaxError extends ParseError {
  constructor(message: string, line: number, column: number, context?: string) {
    super(message, line, column, context)
    this.name = 'SyntaxError'
  }

  static override withContext(
    message: string,
    line: number,
    column: number,
    source: string,
    contextLines: number = 2
  ): SyntaxError {
    const context = ParseError['extractContext'](source, line, column, contextLines)
    return new SyntaxError(message, line, column, context)
  }
}

/**
 * Error for invalid resource references
 */
export class ReferenceError extends ParseError {
  public readonly referenceId: string | number
  public readonly referenceType: 'ExtResource' | 'SubResource'

  constructor(
    message: string,
    line: number,
    column: number,
    referenceType: 'ExtResource' | 'SubResource',
    referenceId: string | number,
    context?: string
  ) {
    super(message, line, column, context)
    this.name = 'ReferenceError'
    this.referenceType = referenceType
    this.referenceId = referenceId
  }
}

/**
 * Error for unexpected end of file
 */
export class UnexpectedEOFError extends ParseError {
  constructor(expected: string, line: number, column: number, context?: string) {
    super(`Unexpected end of file, expected ${expected}`, line, column, context)
    this.name = 'UnexpectedEOFError'
  }
}

/**
 * Error for unexpected token
 */
export class UnexpectedTokenError extends ParseError {
  public readonly found: string
  public readonly expected?: string

  constructor(
    found: string,
    expected: string | undefined,
    line: number,
    column: number,
    context?: string
  ) {
    const message = expected
      ? `Unexpected token '${found}', expected ${expected}`
      : `Unexpected token '${found}'`

    super(message, line, column, context)
    this.name = 'UnexpectedTokenError'
    this.found = found
    if (expected !== undefined) {
      this.expected = expected
    }
  }

  static create(
    found: string,
    expected: string,
    line: number,
    column: number,
    source: string,
    contextLines: number = 2
  ): UnexpectedTokenError {
    const context = ParseError['extractContext'](source, line, column, contextLines)
    return new UnexpectedTokenError(found, expected, line, column, context)
  }
}
