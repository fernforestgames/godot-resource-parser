/**
 * TypeScript type definitions for Godot resource files (.tscn and .tres)
 */

// ============================================================================
// Token Types (for Lexer)
// ============================================================================

export enum TokenType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  SYMBOL = 'SYMBOL',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType
  value: string | number
  line: number
  column: number
}

// ============================================================================
// Godot Value Types
// ============================================================================

export interface Vector2 {
  type: 'Vector2'
  x: number
  y: number
}

export interface Vector2i {
  type: 'Vector2i'
  x: number
  y: number
}

export interface Vector3 {
  type: 'Vector3'
  x: number
  y: number
  z: number
}

export interface Vector3i {
  type: 'Vector3i'
  x: number
  y: number
  z: number
}

export interface Vector4 {
  type: 'Vector4'
  x: number
  y: number
  z: number
  w: number
}

export interface Vector4i {
  type: 'Vector4i'
  x: number
  y: number
  z: number
  w: number
}

export interface Color {
  type: 'Color'
  r: number
  g: number
  b: number
  a: number
}

export interface Rect2 {
  type: 'Rect2'
  x: number
  y: number
  width: number
  height: number
}

export interface Rect2i {
  type: 'Rect2i'
  x: number
  y: number
  width: number
  height: number
}

export interface Transform2D {
  type: 'Transform2D'
  xx: number
  xy: number
  yx: number
  yy: number
  ox: number
  oy: number
}

export interface Transform3D {
  type: 'Transform3D'
  basis: number[] // 9 values (3x3 matrix)
  origin: number[] // 3 values
}

export interface Quaternion {
  type: 'Quaternion'
  x: number
  y: number
  z: number
  w: number
}

export interface Basis {
  type: 'Basis'
  values: number[] // 9 values (3x3 matrix)
}

export interface Plane {
  type: 'Plane'
  normal: number[] // [x, y, z]
  d: number
}

export interface AABB {
  type: 'AABB'
  position: number[] // [x, y, z]
  size: number[] // [width, height, depth]
}

// Packed Arrays
export interface PackedByteArray {
  type: 'PackedByteArray'
  values: number[]
}

export interface PackedInt32Array {
  type: 'PackedInt32Array'
  values: number[]
}

export interface PackedInt64Array {
  type: 'PackedInt64Array'
  values: number[]
}

export interface PackedFloat32Array {
  type: 'PackedFloat32Array'
  values: number[]
}

export interface PackedFloat64Array {
  type: 'PackedFloat64Array'
  values: number[]
}

export interface PackedStringArray {
  type: 'PackedStringArray'
  values: string[]
}

export interface PackedVector2Array {
  type: 'PackedVector2Array'
  values: Vector2[]
}

export interface PackedVector3Array {
  type: 'PackedVector3Array'
  values: Vector3[]
}

export interface PackedColorArray {
  type: 'PackedColorArray'
  values: Color[]
}

// Resource References
export interface ExtResourceRef {
  type: 'ExtResource'
  id: string | number
}

export interface SubResourceRef {
  type: 'SubResource'
  id: string | number
}

// Typed array (Godot 4 format: Array[Type](...))
export interface TypedArray {
  type: 'array'
  elementType: string | GodotValue
  values: GodotValue[]
}

// Union type for all possible parsed values
export type GodotValue =
  | string
  | number
  | boolean
  | null
  | Vector2
  | Vector2i
  | Vector3
  | Vector3i
  | Vector4
  | Vector4i
  | Color
  | Rect2
  | Rect2i
  | Transform2D
  | Transform3D
  | Quaternion
  | Basis
  | Plane
  | AABB
  | PackedByteArray
  | PackedInt32Array
  | PackedInt64Array
  | PackedFloat32Array
  | PackedFloat64Array
  | PackedStringArray
  | PackedVector2Array
  | PackedVector3Array
  | PackedColorArray
  | ExtResourceRef
  | SubResourceRef
  | TypedArray
  | GodotValue[]
  | { [key: string]: GodotValue }

// ============================================================================
// Godot File Structure Types
// ============================================================================

/**
 * File header for scenes: [gd_scene load_steps=X format=Y uid="..."]
 */
export interface GdSceneHeader {
  type: 'gd_scene'
  loadSteps?: number
  format: number
  uid?: string
}

/**
 * File header for resources: [gd_resource type="X" load_steps=Y format=Z uid="..." script_class="..."]
 */
export interface GdResourceHeader {
  type: 'gd_resource'
  resourceType: string
  loadSteps?: number
  format: number
  uid?: string
  scriptClass?: string
}

export type FileHeader = GdSceneHeader | GdResourceHeader

/**
 * External resource declaration
 * [ext_resource type="Texture2D" uid="..." path="res://sprite.png" id="1"]
 */
export interface ExtResource {
  type: string
  uid?: string
  path: string
  id: string | number
}

/**
 * Sub-resource definition
 * [sub_resource type="AtlasTexture" id="atlas_1"]
 * property = value
 */
export interface SubResource {
  type: string
  id: string | number
  properties: Record<string, GodotValue>
}

/**
 * Scene node
 * [node name="Player" type="CharacterBody2D" parent="." instance=...]
 */
export interface Node {
  name: string
  type: string
  parent?: string
  instance?: ExtResourceRef
  instancePlaceholder?: string
  owner?: string
  index?: number
  groups?: string[]
  properties: Record<string, GodotValue>
}

/**
 * Signal connection
 * [connection signal="pressed" from="Button" to="." callable="_on_button_pressed"]
 * [connection signal="pressed" from="Button" to="." method="_on_button_pressed"] (legacy)
 */
export interface Connection {
  signal: string
  from: string
  to: string
  callable?: string
  method?: string // Legacy format
  flags?: number
  binds?: GodotValue[]
  unbinds?: number
}

/**
 * Editable instances
 * [editable path="SomeNode"]
 */
export interface Editable {
  path: string
}

/**
 * Resource section (for .tres files)
 * [resource]
 * property = value
 */
export interface ResourceSection {
  properties: Record<string, GodotValue>
}

// ============================================================================
// Main Parsed Resource Types
// ============================================================================

/**
 * Base interface for all parsed Godot resources
 */
export interface GodotResource {
  header: GdResourceHeader
  extResources: ExtResource[]
  subResources: SubResource[]
  resource?: ResourceSection
}

/**
 * Parsed scene file (.tscn)
 */
export interface GodotScene {
  header: GdSceneHeader
  extResources: ExtResource[]
  subResources: SubResource[]
  nodes: Node[]
  connections: Connection[]
  editables: Editable[]
}

/**
 * Union type for any parsed Godot file
 */
export type ParsedGodotFile = GodotResource | GodotScene

// ============================================================================
// Type Guards
// ============================================================================

export function isGodotScene(file: ParsedGodotFile): file is GodotScene {
  return file.header.type === 'gd_scene'
}

export function isGodotResource(file: ParsedGodotFile): file is GodotResource {
  return file.header.type === 'gd_resource'
}

export function isExtResourceRef(value: GodotValue): value is ExtResourceRef {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'ExtResource'
}

export function isSubResourceRef(value: GodotValue): value is SubResourceRef {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'SubResource'
}

export function isVector2(value: GodotValue): value is Vector2 {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Vector2'
}

export function isVector3(value: GodotValue): value is Vector3 {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Vector3'
}

export function isColor(value: GodotValue): value is Color {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Color'
}
