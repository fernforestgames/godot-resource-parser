/**
 * Value parser for Godot-specific types and values
 */

import { Lexer } from './lexer.js'
import { TokenType, GodotValue, Vector2, Vector3, Vector4, Color, Rect2, Transform2D, ExtResourceRef, SubResourceRef, Vector2i, Vector3i, Vector4i, Rect2i } from './types.js'
import { SyntaxError, UnexpectedTokenError } from './errors.js'

export class ValueParser {
  constructor(private lexer: Lexer) {}

  /**
   * Parse any value
   */
  parseValue(): GodotValue {
    const token = this.lexer.peek()

    switch (token.type) {
      case TokenType.NUMBER:
        this.lexer.next()
        return token.value as number

      case TokenType.STRING:
        this.lexer.next()
        return token.value as string

      case TokenType.IDENTIFIER: {
        const identifier = token.value as string

        // Boolean literals
        if (identifier === 'true') {
          this.lexer.next()
          return true
        }
        if (identifier === 'false') {
          this.lexer.next()
          return false
        }
        if (identifier === 'null') {
          this.lexer.next()
          return null
        }

        // Godot type constructors
        this.lexer.next()

        // Check for typed arrays: Array[Type](values)
        if (identifier === 'Array' && this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === '[') {
          return this.parseTypedArray()
        }

        return this.parseGodotType(identifier)
      }

      case TokenType.SYMBOL: {
        const symbol = token.value as string

        if (symbol === '[') {
          return this.parseArray()
        }

        if (symbol === '{') {
          return this.parseDict()
        }

        throw UnexpectedTokenError.create(
          symbol,
          'a value',
          token.line,
          token.column,
          this.lexer['source']
        )
      }

      default:
        throw UnexpectedTokenError.create(
          String(token.value),
          'a value',
          token.line,
          token.column,
          this.lexer['source']
        )
    }
  }

  /**
   * Parse Godot-specific type constructors
   */
  private parseGodotType(typeName: string): GodotValue {
    // Expect opening parenthesis
    this.lexer.expect(TokenType.SYMBOL, '(')

    let result: GodotValue

    switch (typeName) {
      // Vectors
      case 'Vector2':
        result = this.parseVector2()
        break
      case 'Vector2i':
        result = this.parseVector2i()
        break
      case 'Vector3':
        result = this.parseVector3()
        break
      case 'Vector3i':
        result = this.parseVector3i()
        break
      case 'Vector4':
        result = this.parseVector4()
        break
      case 'Vector4i':
        result = this.parseVector4i()
        break

      // Color
      case 'Color':
        result = this.parseColor()
        break

      // Rectangles
      case 'Rect2':
        result = this.parseRect2()
        break
      case 'Rect2i':
        result = this.parseRect2i()
        break

      // Transforms
      case 'Transform2D':
        result = this.parseTransform2D()
        break
      case 'Transform3D':
        result = this.parseTransform3D()
        break

      // Geometry
      case 'Quaternion':
        result = this.parseQuaternion()
        break
      case 'Basis':
        result = this.parseBasis()
        break
      case 'Plane':
        result = this.parsePlane()
        break
      case 'AABB':
        result = this.parseAABB()
        break

      // Packed arrays
      case 'PackedByteArray':
        result = { type: 'PackedByteArray', values: this.parseNumberList() }
        break
      case 'PackedInt32Array':
        result = { type: 'PackedInt32Array', values: this.parseNumberList() }
        break
      case 'PackedInt64Array':
        result = { type: 'PackedInt64Array', values: this.parseNumberList() }
        break
      case 'PackedFloat32Array':
        result = { type: 'PackedFloat32Array', values: this.parseNumberList() }
        break
      case 'PackedFloat64Array':
        result = { type: 'PackedFloat64Array', values: this.parseNumberList() }
        break
      case 'PackedStringArray':
        result = { type: 'PackedStringArray', values: this.parseStringList() }
        break
      case 'PackedVector2Array':
        result = { type: 'PackedVector2Array', values: this.parseVector2List() }
        break
      case 'PackedVector3Array':
        result = { type: 'PackedVector3Array', values: this.parseVector3List() }
        break
      case 'PackedColorArray':
        result = { type: 'PackedColorArray', values: this.parseColorList() }
        break

      // Resource references
      case 'ExtResource':
        result = this.parseExtResource()
        break
      case 'SubResource':
        result = this.parseSubResource()
        break

      default: {
        // Unknown type - parse as generic function call and return as object
        const values = this.parseValueList()
        this.lexer.expect(TokenType.SYMBOL, ')')
        return { type: typeName, values }
      }
    }

    // Expect closing parenthesis
    this.lexer.expect(TokenType.SYMBOL, ')')

    return result
  }

  // ============================================================================
  // Vector parsers
  // ============================================================================

  private parseVector2(): Vector2 {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    return { type: 'Vector2', x, y }
  }

  private parseVector2i(): Vector2i {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    return { type: 'Vector2i', x, y }
  }

  private parseVector3(): Vector3 {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const z = this.expectNumber()
    return { type: 'Vector3', x, y, z }
  }

  private parseVector3i(): Vector3i {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const z = this.expectNumber()
    return { type: 'Vector3i', x, y, z }
  }

  private parseVector4(): Vector4 {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const z = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const w = this.expectNumber()
    return { type: 'Vector4', x, y, z, w }
  }

  private parseVector4i(): Vector4i {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const z = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const w = this.expectNumber()
    return { type: 'Vector4i', x, y, z, w }
  }

  // ============================================================================
  // Color parser
  // ============================================================================

  private parseColor(): Color {
    const r = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const g = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const b = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const a = this.expectNumber()
    return { type: 'Color', r, g, b, a }
  }

  // ============================================================================
  // Rectangle parsers
  // ============================================================================

  private parseRect2(): Rect2 {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const width = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const height = this.expectNumber()
    return { type: 'Rect2', x, y, width, height }
  }

  private parseRect2i(): Rect2i {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const width = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const height = this.expectNumber()
    return { type: 'Rect2i', x, y, width, height }
  }

  // ============================================================================
  // Transform parsers
  // ============================================================================

  private parseTransform2D(): Transform2D {
    const xx = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const xy = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const yx = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const yy = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const ox = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const oy = this.expectNumber()
    return { type: 'Transform2D', xx, xy, yx, yy, ox, oy }
  }

  private parseTransform3D() {
    const values = this.parseNumberList()
    if (values.length !== 12) {
      throw new SyntaxError(
        `Transform3D expects 12 values, got ${values.length}`,
        this.lexer.peek().line,
        this.lexer.peek().column
      )
    }
    return {
      type: 'Transform3D' as const,
      basis: values.slice(0, 9),
      origin: values.slice(9, 12),
    }
  }

  // ============================================================================
  // Geometry parsers
  // ============================================================================

  private parseQuaternion() {
    const x = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const y = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const z = this.expectNumber()
    this.lexer.expect(TokenType.SYMBOL, ',')
    const w = this.expectNumber()
    return { type: 'Quaternion' as const, x, y, z, w }
  }

  private parseBasis() {
    const values = this.parseNumberList()
    if (values.length !== 9) {
      throw new SyntaxError(
        `Basis expects 9 values, got ${values.length}`,
        this.lexer.peek().line,
        this.lexer.peek().column
      )
    }
    return { type: 'Basis' as const, values }
  }

  private parsePlane() {
    const values = this.parseNumberList()
    if (values.length !== 4) {
      throw new SyntaxError(
        `Plane expects 4 values, got ${values.length}`,
        this.lexer.peek().line,
        this.lexer.peek().column
      )
    }
    return { type: 'Plane' as const, normal: values.slice(0, 3), d: values[3]! }
  }

  private parseAABB() {
    const values = this.parseNumberList()
    if (values.length !== 6) {
      throw new SyntaxError(
        `AABB expects 6 values, got ${values.length}`,
        this.lexer.peek().line,
        this.lexer.peek().column
      )
    }
    return { type: 'AABB' as const, position: values.slice(0, 3), size: values.slice(3, 6) }
  }

  // ============================================================================
  // Resource reference parsers
  // ============================================================================

  private parseExtResource(): ExtResourceRef {
    const token = this.lexer.next()
    let id: string | number

    if (token.type === TokenType.STRING) {
      id = token.value as string
    } else if (token.type === TokenType.NUMBER) {
      id = token.value as number
    } else {
      throw UnexpectedTokenError.create(
        String(token.value),
        'resource ID (string or number)',
        token.line,
        token.column,
        this.lexer['source']
      )
    }

    return { type: 'ExtResource', id }
  }

  private parseSubResource(): SubResourceRef {
    const token = this.lexer.next()
    let id: string | number

    if (token.type === TokenType.STRING) {
      id = token.value as string
    } else if (token.type === TokenType.NUMBER) {
      id = token.value as number
    } else {
      throw UnexpectedTokenError.create(
        String(token.value),
        'resource ID (string or number)',
        token.line,
        token.column,
        this.lexer['source']
      )
    }

    return { type: 'SubResource', id }
  }

  // ============================================================================
  // Array and dictionary parsers
  // ============================================================================

  /**
   * Parse array: [item1, item2, ...]
   */
  parseArray(): GodotValue[] {
    this.lexer.expect(TokenType.SYMBOL, '[')

    const items: GodotValue[] = []

    // Check for empty array
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ']') {
      this.lexer.next()
      return items
    }

    // Parse items
    while (true) {
      // Skip newlines (for multi-line arrays)
      while (this.lexer.peek().type === TokenType.NEWLINE) {
        this.lexer.next()
      }

      // Check for closing bracket after skipping newlines
      if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ']') {
        this.lexer.next()
        break
      }

      items.push(this.parseValue())

      // Skip newlines after value
      while (this.lexer.peek().type === TokenType.NEWLINE) {
        this.lexer.next()
      }

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ']') {
        this.lexer.next()
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
        // Skip newlines after comma
        while (this.lexer.peek().type === TokenType.NEWLINE) {
          this.lexer.next()
        }
        // Allow trailing comma
        if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ']') {
          this.lexer.next()
          break
        }
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ']'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return items
  }

  /**
   * Parse typed array: Array[Type](values)
   * Godot 4 typed arrays like Array[StringName]([...]) or Array[ExtResource("id")]([...])
   */
  parseTypedArray(): { type: 'array', elementType: string | GodotValue, values: GodotValue[] } {
    // Expect opening bracket for type
    this.lexer.expect(TokenType.SYMBOL, '[')

    // Parse element type - can be either a simple identifier or a complex value
    let elementType: string | GodotValue
    const typeToken = this.lexer.peek()

    if (typeToken.type === TokenType.IDENTIFIER) {
      this.lexer.next()
      const typeName = typeToken.value as string

      // Check if next token is '(' (complex type like ExtResource)
      if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === '(') {
        // Parse as Godot type (e.g., ExtResource("id"))
        elementType = this.parseGodotType(typeName)
      } else {
        // Simple type like StringName
        elementType = typeName
      }
    } else {
      // Other types - parse as value
      elementType = this.parseValue()
    }

    // Expect closing bracket
    this.lexer.expect(TokenType.SYMBOL, ']')

    // Expect opening parenthesis for values
    this.lexer.expect(TokenType.SYMBOL, '(')

    // Parse the array values using parseArray
    const values = this.parseArray()

    // Expect closing parenthesis
    this.lexer.expect(TokenType.SYMBOL, ')')

    return {
      type: 'array',
      elementType,
      values
    }
  }

  /**
   * Parse dictionary: { "key": value, ... }
   */
  parseDict(): Record<string, GodotValue> {
    this.lexer.expect(TokenType.SYMBOL, '{')

    const dict: Record<string, GodotValue> = {}

    // Check for empty dict
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === '}') {
      this.lexer.next()
      return dict
    }

    // Parse key-value pairs
    while (true) {
      // Skip newlines (for multi-line dictionaries)
      while (this.lexer.peek().type === TokenType.NEWLINE) {
        this.lexer.next()
      }

      // Parse key (can be a string, ExtResource, or SubResource)
      const keyToken = this.lexer.peek()
      let key: string

      if (keyToken.type === TokenType.STRING) {
        // String key
        this.lexer.next()
        key = keyToken.value as string
      } else if (keyToken.type === TokenType.IDENTIFIER) {
        // ExtResource or SubResource key
        const keyValue = this.parseValue()
        // Convert the value to a string representation for the key
        if (typeof keyValue === 'object' && keyValue !== null && 'type' in keyValue) {
          if (keyValue.type === 'ExtResource' || keyValue.type === 'SubResource') {
            key = `${keyValue.type}("${keyValue.id}")`
          } else {
            // For other types, use JSON representation
            key = JSON.stringify(keyValue)
          }
        } else {
          key = String(keyValue)
        }
      } else {
        throw UnexpectedTokenError.create(
          String(keyToken.value),
          'string key or resource reference',
          keyToken.line,
          keyToken.column,
          this.lexer['source']
        )
      }

      // Expect colon
      this.lexer.expect(TokenType.SYMBOL, ':')

      // Parse value
      const value = this.parseValue()
      dict[key] = value

      // Skip newlines after value
      while (this.lexer.peek().type === TokenType.NEWLINE) {
        this.lexer.next()
      }

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === '}') {
        this.lexer.next()
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
        // Skip newlines after comma
        while (this.lexer.peek().type === TokenType.NEWLINE) {
          this.lexer.next()
        }
        // Allow trailing comma
        if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === '}') {
          this.lexer.next()
          break
        }
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or '}'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return dict
  }

  // ============================================================================
  // Helper methods for parsing lists
  // ============================================================================

  private parseValueList(): GodotValue[] {
    const values: GodotValue[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return values
    }

    while (true) {
      values.push(this.parseValue())

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ')') {
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ')'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return values
  }

  private parseNumberList(): number[] {
    const numbers: number[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return numbers
    }

    while (true) {
      numbers.push(this.expectNumber())

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ')') {
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ')'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return numbers
  }

  private parseStringList(): string[] {
    const strings: string[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return strings
    }

    while (true) {
      const token = this.lexer.next()
      if (token.type !== TokenType.STRING) {
        throw UnexpectedTokenError.create(
          String(token.value),
          'string',
          token.line,
          token.column,
          this.lexer['source']
        )
      }
      strings.push(token.value as string)

      const nextToken = this.lexer.peek()
      if (nextToken.type === TokenType.SYMBOL && nextToken.value === ')') {
        break
      }

      if (nextToken.type === TokenType.SYMBOL && nextToken.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(nextToken.value),
          "',' or ')'",
          nextToken.line,
          nextToken.column,
          this.lexer['source']
        )
      }
    }

    return strings
  }

  private parseVector2List(): Vector2[] {
    const vectors: Vector2[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return vectors
    }

    while (true) {
      const value = this.parseValue()
      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'Vector2') {
        vectors.push(value as Vector2)
      } else {
        throw new SyntaxError(
          'Expected Vector2',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ')') {
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ')'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return vectors
  }

  private parseVector3List(): Vector3[] {
    const vectors: Vector3[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return vectors
    }

    while (true) {
      const value = this.parseValue()
      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'Vector3') {
        vectors.push(value as Vector3)
      } else {
        throw new SyntaxError(
          'Expected Vector3',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ')') {
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ')'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return vectors
  }

  private parseColorList(): Color[] {
    const colors: Color[] = []

    // Check for empty list
    if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ')') {
      return colors
    }

    // Parse as individual r, g, b, a components
    // Format: PackedColorArray(r, g, b, a, r, g, b, a, ...)
    while (true) {
      // Parse 4 numbers: r, g, b, a
      const r = this.parseValue()
      if (typeof r !== 'number') {
        throw new SyntaxError(
          'Expected number for red component',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      // Expect comma
      if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(this.lexer.peek().value),
          "','",
          this.lexer.peek().line,
          this.lexer.peek().column,
          this.lexer['source']
        )
      }

      const g = this.parseValue()
      if (typeof g !== 'number') {
        throw new SyntaxError(
          'Expected number for green component',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      // Expect comma
      if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(this.lexer.peek().value),
          "','",
          this.lexer.peek().line,
          this.lexer.peek().column,
          this.lexer['source']
        )
      }

      const b = this.parseValue()
      if (typeof b !== 'number') {
        throw new SyntaxError(
          'Expected number for blue component',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      // Expect comma
      if (this.lexer.peek().type === TokenType.SYMBOL && this.lexer.peek().value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(this.lexer.peek().value),
          "','",
          this.lexer.peek().line,
          this.lexer.peek().column,
          this.lexer['source']
        )
      }

      const a = this.parseValue()
      if (typeof a !== 'number') {
        throw new SyntaxError(
          'Expected number for alpha component',
          this.lexer.peek().line,
          this.lexer.peek().column
        )
      }

      colors.push({ type: 'Color', r, g, b, a })

      const token = this.lexer.peek()
      if (token.type === TokenType.SYMBOL && token.value === ')') {
        break
      }

      if (token.type === TokenType.SYMBOL && token.value === ',') {
        this.lexer.next()
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          "',' or ')'",
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return colors
  }

  // ============================================================================
  // Helper methods
  // ============================================================================

  private expectNumber(): number {
    const token = this.lexer.next()
    if (token.type !== TokenType.NUMBER) {
      throw UnexpectedTokenError.create(
        String(token.value),
        'number',
        token.line,
        token.column,
        this.lexer['source']
      )
    }
    return token.value as number
  }
}
