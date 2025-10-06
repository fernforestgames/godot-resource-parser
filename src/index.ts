/**
 * Godot Resource Parser
 * Parse Godot 4 .tscn and .tres files in TypeScript/JavaScript
 */

// Export main parsing functions
export { parse, parseScene, parseResource } from './parser'

// Export all types
export type {
  // Token types
  Token,
  // Godot value types
  Vector2,
  Vector2i,
  Vector3,
  Vector3i,
  Vector4,
  Vector4i,
  Color,
  Rect2,
  Rect2i,
  Transform2D,
  Transform3D,
  Quaternion,
  Basis,
  Plane,
  AABB,
  PackedByteArray,
  PackedInt32Array,
  PackedInt64Array,
  PackedFloat32Array,
  PackedFloat64Array,
  PackedStringArray,
  PackedVector2Array,
  PackedVector3Array,
  PackedColorArray,
  ExtResourceRef,
  SubResourceRef,
  GodotValue,
  // File structure types
  FileHeader,
  GdSceneHeader,
  GdResourceHeader,
  ExtResource,
  SubResource,
  Node,
  Connection,
  Editable,
  ResourceSection,
  GodotResource,
  GodotScene,
  ParsedGodotFile,
} from './types'

// Export type guards
export {
  isGodotScene,
  isGodotResource,
  isExtResourceRef,
  isSubResourceRef,
  isVector2,
  isVector3,
  isColor,
} from './types'

// Export enums
export { TokenType } from './types'

// Export error classes for advanced usage
export {
  ParseError,
  LexerError,
  SyntaxError,
  ReferenceError,
  UnexpectedEOFError,
  UnexpectedTokenError,
} from './errors'
