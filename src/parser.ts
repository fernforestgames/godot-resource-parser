/**
 * Main parser for Godot resource files (.tscn and .tres)
 */

import { Lexer } from './lexer'
import { ValueParser } from './value-parser'
import {
  TokenType,
  GodotScene,
  GodotResource,
  FileHeader,
  GdSceneHeader,
  GdResourceHeader,
  ExtResource,
  SubResource,
  Node,
  Connection,
  Editable,
  ResourceSection,
  GodotValue,
  ParsedGodotFile,
} from './types'
import { SyntaxError as ParseSyntaxError, UnexpectedTokenError, UnsupportedFormatError } from './errors'

export class Parser {
  private lexer: Lexer
  private valueParser: ValueParser

  constructor(source: string) {
    this.lexer = new Lexer(source)
    this.valueParser = new ValueParser(this.lexer)
  }

  /**
   * Parse a Godot file (auto-detect scene vs resource)
   */
  parse(): ParsedGodotFile {
    const header = this.parseFileHeader()

    if (header.type === 'gd_scene') {
      return this.parseScene(header)
    } else {
      return this.parseResource(header)
    }
  }

  /**
   * Parse file header (first section)
   */
  private parseFileHeader(): FileHeader {
    this.lexer.expect(TokenType.SYMBOL, '[')

    const nameToken = this.lexer.expect(TokenType.IDENTIFIER)
    const headerType = nameToken.value as string

    if (headerType === 'gd_scene') {
      const attrs = this.parseSectionAttributes()
      this.lexer.expect(TokenType.SYMBOL, ']')
      this.skipNewlines()

      const format = attrs['format'] as number
      if (format !== 3) {
        throw UnsupportedFormatError.create(
          format,
          [3],
          nameToken.line,
          nameToken.column,
          this.lexer['source']
        )
      }

      const header: GdSceneHeader = {
        type: 'gd_scene',
        format,
      }
      if (attrs['load_steps'] !== undefined) {
        header.loadSteps = attrs['load_steps'] as number
      }
      if (attrs['uid'] !== undefined) {
        header.uid = attrs['uid'] as string
      }
      return header
    } else if (headerType === 'gd_resource') {
      const attrs = this.parseSectionAttributes()
      this.lexer.expect(TokenType.SYMBOL, ']')
      this.skipNewlines()

      const format = attrs['format'] as number
      if (format !== 3) {
        throw UnsupportedFormatError.create(
          format,
          [3],
          nameToken.line,
          nameToken.column,
          this.lexer['source']
        )
      }

      const header: GdResourceHeader = {
        type: 'gd_resource',
        resourceType: attrs['type'] as string,
        format,
      }
      if (attrs['load_steps'] !== undefined) {
        header.loadSteps = attrs['load_steps'] as number
      }
      if (attrs['uid'] !== undefined) {
        header.uid = attrs['uid'] as string
      }
      return header
    } else {
      throw ParseSyntaxError.withContext(
        `Expected 'gd_scene' or 'gd_resource', got '${headerType}'`,
        nameToken.line,
        nameToken.column,
        this.lexer['source']
      )
    }
  }

  /**
   * Parse a scene file
   */
  private parseScene(header: GdSceneHeader): GodotScene {
    const extResources: ExtResource[] = []
    const subResources: SubResource[] = []
    const nodes: Node[] = []
    const connections: Connection[] = []
    const editables: Editable[] = []

    // Parse sections
    while (!this.lexer.isAtEnd()) {
      const token = this.lexer.peek()

      if (token.type === TokenType.SYMBOL && token.value === '[') {
        const sectionType = this.peekSectionType()

        switch (sectionType) {
          case 'ext_resource':
            extResources.push(this.parseExtResource())
            break
          case 'sub_resource':
            subResources.push(this.parseSubResource())
            break
          case 'node':
            nodes.push(this.parseNode())
            break
          case 'connection':
            connections.push(this.parseConnection())
            break
          case 'editable':
            editables.push(this.parseEditable())
            break
          default:
            throw ParseSyntaxError.withContext(
              `Unknown section type: ${sectionType}`,
              token.line,
              token.column,
              this.lexer['source']
            )
        }
      } else if (token.type === TokenType.NEWLINE) {
        this.lexer.next()
      } else if (token.type === TokenType.EOF) {
        break
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          'section or end of file',
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    return {
      header,
      extResources,
      subResources,
      nodes,
      connections,
      editables,
    }
  }

  /**
   * Parse a resource file
   */
  private parseResource(header: GdResourceHeader): GodotResource {
    const extResources: ExtResource[] = []
    const subResources: SubResource[] = []
    let resource: ResourceSection | undefined

    // Parse sections
    while (!this.lexer.isAtEnd()) {
      const token = this.lexer.peek()

      if (token.type === TokenType.SYMBOL && token.value === '[') {
        const sectionType = this.peekSectionType()

        switch (sectionType) {
          case 'ext_resource':
            extResources.push(this.parseExtResource())
            break
          case 'sub_resource':
            subResources.push(this.parseSubResource())
            break
          case 'resource':
            resource = this.parseResourceSection()
            break
          default:
            throw ParseSyntaxError.withContext(
              `Unknown section type: ${sectionType}`,
              token.line,
              token.column,
              this.lexer['source']
            )
        }
      } else if (token.type === TokenType.NEWLINE) {
        this.lexer.next()
      } else if (token.type === TokenType.EOF) {
        break
      } else {
        throw UnexpectedTokenError.create(
          String(token.value),
          'section or end of file',
          token.line,
          token.column,
          this.lexer['source']
        )
      }
    }

    const result: GodotResource = {
      header,
      extResources,
      subResources,
    }
    if (resource !== undefined) {
      result.resource = resource
    }
    return result
  }

  // ============================================================================
  // Section parsers
  // ============================================================================

  /**
   * Parse ext_resource section
   */
  private parseExtResource(): ExtResource {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'ext_resource')

    const attrs = this.parseSectionAttributes()
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    const extResource: ExtResource = {
      type: attrs['type'] as string,
      path: attrs['path'] as string,
      id: attrs['id'] as string | number,
    }
    if (attrs['uid'] !== undefined) {
      extResource.uid = attrs['uid'] as string
    }
    return extResource
  }

  /**
   * Parse sub_resource section
   */
  private parseSubResource(): SubResource {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'sub_resource')

    const attrs = this.parseSectionAttributes()
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    const properties = this.parseProperties()

    return {
      type: attrs['type'] as string,
      id: attrs['id'] as string | number,
      properties,
    }
  }

  /**
   * Parse node section
   */
  private parseNode(): Node {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'node')

    const attrs = this.parseSectionAttributes()
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    const properties = this.parseProperties()

    const node: Node = {
      name: attrs['name'] as string,
      type: attrs['type'] as string,
      properties,
    }

    if (attrs['parent'] !== undefined) {
      node.parent = attrs['parent'] as string
    }
    if (attrs['instance'] !== undefined) {
      node.instance = attrs['instance'] as any
    }
    if (attrs['instance_placeholder'] !== undefined) {
      node.instancePlaceholder = attrs['instance_placeholder'] as string
    }
    if (attrs['owner'] !== undefined) {
      node.owner = attrs['owner'] as string
    }
    if (attrs['index'] !== undefined) {
      node.index = attrs['index'] as number
    }
    if (attrs['groups'] !== undefined && Array.isArray(attrs['groups'])) {
      node.groups = attrs['groups'] as string[]
    }

    return node
  }

  /**
   * Parse connection section
   */
  private parseConnection(): Connection {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'connection')

    const attrs = this.parseSectionAttributes()
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    const connection: Connection = {
      signal: attrs['signal'] as string,
      from: attrs['from'] as string,
      to: attrs['to'] as string,
    }

    // Support both 'callable' (Godot 4) and 'method' (legacy)
    if (attrs['callable'] !== undefined) {
      connection.callable = attrs['callable'] as string
    }
    if (attrs['method'] !== undefined) {
      connection.method = attrs['method'] as string
    }

    if (attrs['flags'] !== undefined) {
      connection.flags = attrs['flags'] as number
    }
    if (attrs['binds'] !== undefined) {
      connection.binds = attrs['binds'] as GodotValue[]
    }
    if (attrs['unbinds'] !== undefined) {
      connection.unbinds = attrs['unbinds'] as number
    }

    return connection
  }

  /**
   * Parse editable section
   */
  private parseEditable(): Editable {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'editable')

    const attrs = this.parseSectionAttributes()
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    return {
      path: attrs['path'] as string,
    }
  }

  /**
   * Parse resource section (for .tres files)
   */
  private parseResourceSection(): ResourceSection {
    this.lexer.expect(TokenType.SYMBOL, '[')
    this.lexer.expect(TokenType.IDENTIFIER, 'resource')
    this.lexer.expect(TokenType.SYMBOL, ']')
    this.skipNewlines()

    const properties = this.parseProperties()

    return { properties }
  }

  // ============================================================================
  // Helper methods
  // ============================================================================

  /**
   * Peek at the section type without consuming tokens
   */
  private peekSectionType(): string {
    // We're currently at '['
    // Save current lexer state
    const savedPos = this.lexer['pos']
    const savedLine = this.lexer['line']
    const savedColumn = this.lexer['column']
    const savedToken = this.lexer['currentToken']

    this.lexer.next() // Skip '['
    const typeToken = this.lexer.next()
    const sectionType = typeToken.value as string

    // Restore lexer state
    this.lexer['pos'] = savedPos
    this.lexer['line'] = savedLine
    this.lexer['column'] = savedColumn
    this.lexer['currentToken'] = savedToken

    return sectionType
  }

  /**
   * Parse section attributes (key=value pairs within [])
   */
  private parseSectionAttributes(): Record<string, GodotValue> {
    const attrs: Record<string, GodotValue> = {}

    while (true) {
      const token = this.lexer.peek()

      // End of section attributes
      if (token.type === TokenType.SYMBOL && token.value === ']') {
        break
      }

      // Parse key
      if (token.type !== TokenType.IDENTIFIER) {
        throw UnexpectedTokenError.create(
          String(token.value),
          'attribute name',
          token.line,
          token.column,
          this.lexer['source']
        )
      }
      const key = this.lexer.next().value as string

      // Expect '='
      this.lexer.expect(TokenType.SYMBOL, '=')

      // Parse value
      const value = this.valueParser.parseValue()
      attrs[key] = value
    }

    return attrs
  }

  /**
   * Parse property lines (key = value)
   */
  private parseProperties(): Record<string, GodotValue> {
    const properties: Record<string, GodotValue> = {}

    while (true) {
      const token = this.lexer.peek()

      // Stop at next section or EOF
      if (token.type === TokenType.SYMBOL && token.value === '[') {
        break
      }
      if (token.type === TokenType.EOF) {
        break
      }

      // Skip empty lines
      if (token.type === TokenType.NEWLINE) {
        this.lexer.next()
        continue
      }

      // Parse property name (can be IDENTIFIER or NUMBER for properties like "0:0/next_alternative_id")
      if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.NUMBER) {
        throw UnexpectedTokenError.create(
          String(token.value),
          'property name',
          token.line,
          token.column,
          this.lexer['source']
        )
      }

      // Build property key - may contain numbers, colons, slashes
      let key = String(this.lexer.next().value)

      // Handle complex property names like "0:0/next_alternative_id" or "Button/colors/font_color"
      // Continue parsing tokens that are part of the property name until we hit '='
      while (true) {
        const nextToken = this.lexer.peek()
        if (nextToken.type === TokenType.SYMBOL && nextToken.value === '=') {
          break
        }
        if (nextToken.type === TokenType.SYMBOL && (nextToken.value === ':' || nextToken.value === '/')) {
          key += String(this.lexer.next().value)
        } else if (nextToken.type === TokenType.NUMBER || nextToken.type === TokenType.IDENTIFIER) {
          key += String(this.lexer.next().value)
        } else {
          break
        }
      }

      // Expect '='
      this.lexer.expect(TokenType.SYMBOL, '=')

      // Parse value
      const value = this.valueParser.parseValue()
      properties[key] = value

      // Skip to next line
      this.skipNewlines()
    }

    return properties
  }

  /**
   * Skip newline tokens
   */
  private skipNewlines(): void {
    while (this.lexer.peek().type === TokenType.NEWLINE) {
      this.lexer.next()
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a Godot file (auto-detect scene vs resource)
 */
export function parse(content: string): ParsedGodotFile {
  const parser = new Parser(content)
  return parser.parse()
}

/**
 * Parse a Godot scene file (.tscn)
 */
export function parseScene(content: string): GodotScene {
  const result = parse(content)
  if (result.header.type !== 'gd_scene') {
    throw new Error('File is not a scene (gd_scene)')
  }
  return result as GodotScene
}

/**
 * Parse a Godot resource file (.tres)
 */
export function parseResource(content: string): GodotResource {
  const result = parse(content)
  if (result.header.type !== 'gd_resource') {
    throw new Error('File is not a resource (gd_resource)')
  }
  return result as GodotResource
}
