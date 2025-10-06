/**
 * Tests for the main parser
 */

import { UnsupportedFormatError } from '../src/errors'
import { parseResource, parseScene } from '../src/parser'

describe('Parser', () => {
  describe('Simple scene parsing', () => {
    it('should parse a minimal scene', () => {
      const content = `[gd_scene format=3]

[node name="Root" type="Node2D"]
`
      const scene = parseScene(content)

      expect(scene.header.type).toBe('gd_scene')
      expect(scene.header.format).toBe(3)
      expect(scene.nodes).toHaveLength(1)
      expect(scene.nodes[0]!.name).toBe('Root')
      expect(scene.nodes[0]!.type).toBe('Node2D')
    })

    it('should parse scene with properties', () => {
      const content = `[gd_scene format=3]

[node name="Player" type="CharacterBody2D"]
position = Vector2(10, 20)
`
      const scene = parseScene(content)

      expect(scene.nodes).toHaveLength(1)
      expect(scene.nodes[0]!.properties['position']).toEqual({
        type: 'Vector2',
        x: 10,
        y: 20,
      })
    })

    it('should parse scene with external resources', () => {
      const content = `[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://sprite.png" id="1"]

[node name="Sprite" type="Sprite2D"]
texture = ExtResource("1")
`
      const scene = parseScene(content)

      expect(scene.extResources).toHaveLength(1)
      expect(scene.extResources[0]!.type).toBe('Texture2D')
      expect(scene.extResources[0]!.path).toBe('res://sprite.png')
      expect(scene.extResources[0]!.id).toBe('1')

      expect(scene.nodes[0]!.properties['texture']).toEqual({
        type: 'ExtResource',
        id: '1',
      })
    })

    it('should parse scene with sub resources', () => {
      const content = `[gd_scene load_steps=2 format=3]

[sub_resource type="RectangleShape2D" id="1"]
size = Vector2(32, 32)

[node name="Area" type="Area2D"]
shape = SubResource("1")
`
      const scene = parseScene(content)

      expect(scene.subResources).toHaveLength(1)
      expect(scene.subResources[0]!.type).toBe('RectangleShape2D')
      expect(scene.subResources[0]!.id).toBe('1')
      expect(scene.subResources[0]!.properties['size']).toEqual({
        type: 'Vector2',
        x: 32,
        y: 32,
      })
    })

    it('should parse connections', () => {
      const content = `[gd_scene format=3]

[node name="Button" type="Button"]

[connection signal="pressed" from="Button" to="." callable="_on_button_pressed"]
`
      const scene = parseScene(content)

      expect(scene.connections).toHaveLength(1)
      expect(scene.connections[0]!.signal).toBe('pressed')
      expect(scene.connections[0]!.from).toBe('Button')
      expect(scene.connections[0]!.to).toBe('.')
      expect(scene.connections[0]!.callable).toBe('_on_button_pressed')
    })
  })

  describe('Value types', () => {
    it('should parse Color values', () => {
      const content = `[gd_scene format=3]

[node name="ColorRect" type="ColorRect"]
color = Color(1, 0, 0, 1)
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['color']).toEqual({
        type: 'Color',
        r: 1,
        g: 0,
        b: 0,
        a: 1,
      })
    })

    it('should parse arrays', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
my_array = [1, 2, 3]
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['my_array']).toEqual([1, 2, 3])
    })

    it('should parse dictionaries', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
my_dict = { "key1": "value1", "key2": 42 }
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['my_dict']).toEqual({
        key1: 'value1',
        key2: 42,
      })
    })

    it('should parse boolean values', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
enabled = true
disabled = false
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['enabled']).toBe(true)
      expect(scene.nodes[0]!.properties['disabled']).toBe(false)
    })

    it('should parse Transform2D', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node2D"]
transform = Transform2D(1, 0, 0, 1, 10, 20)
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['transform']).toEqual({
        type: 'Transform2D',
        xx: 1,
        xy: 0,
        yx: 0,
        yy: 1,
        ox: 10,
        oy: 20,
      })
    })

    it('should parse Rect2', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
rect = Rect2(0, 0, 100, 50)
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['rect']).toEqual({
        type: 'Rect2',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      })
    })
  })

  describe('Resource parsing', () => {
    it('should parse a basic resource file', () => {
      const content = `[gd_resource type="Shader" format=3]

[resource]
code = "shader_type canvas_item;"
`
      const resource = parseResource(content)

      expect(resource.header.type).toBe('gd_resource')
      expect(resource.header.resourceType).toBe('Shader')
      expect(resource.header.format).toBe(3)
      expect(resource.resource?.properties['code']).toBe('shader_type canvas_item;')
    })
  })

  describe('Comments', () => {
    it('should skip line comments', () => {
      const content = `[gd_scene format=3]

; This is a comment
[node name="Root" type="Node2D"]
; Another comment
position = Vector2(0, 0) ; inline comment
`
      const scene = parseScene(content)

      expect(scene.nodes).toHaveLength(1)
      expect(scene.nodes[0]!.name).toBe('Root')
    })
  })

  describe('Format validation', () => {
    it('should reject format=2 for scenes', () => {
      const content = `[gd_scene format=2]

[node name="Root" type="Node2D"]
`
      expect(() => parseScene(content)).toThrow(UnsupportedFormatError)
      expect(() => parseScene(content)).toThrow('Unsupported format version 2')
    })

    it('should reject format=2 for resources', () => {
      const content = `[gd_resource type="Shader" format=2]

[resource]
code = "shader_type canvas_item;"
`
      expect(() => parseResource(content)).toThrow(UnsupportedFormatError)
      expect(() => parseResource(content)).toThrow('Unsupported format version 2')
    })

    it('should reject format=1 for scenes', () => {
      const content = `[gd_scene format=1]

[node name="Root" type="Node2D"]
`
      expect(() => parseScene(content)).toThrow(UnsupportedFormatError)
      expect(() => parseScene(content)).toThrow('Unsupported format version 1')
    })

    it('should accept format=3 for scenes', () => {
      const content = `[gd_scene format=3]

[node name="Root" type="Node2D"]
`
      expect(() => parseScene(content)).not.toThrow()
    })

    it('should accept format=3 for resources', () => {
      const content = `[gd_resource type="Shader" format=3]

[resource]
code = "shader_type canvas_item;"
`
      expect(() => parseResource(content)).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty arrays', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
empty = []
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['empty']).toEqual([])
    })

    it('should handle empty dictionaries', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
empty = {}
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['empty']).toEqual({})
    })

    it('should handle negative numbers', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
negative = -42
position = Vector2(-10, -20)
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['negative']).toBe(-42)
      expect(scene.nodes[0]!.properties['position']).toEqual({
        type: 'Vector2',
        x: -10,
        y: -20,
      })
    })

    it('should handle scientific notation', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
small = 1.5e-10
large = 3e8
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['small']).toBe(1.5e-10)
      expect(scene.nodes[0]!.properties['large']).toBe(3e8)
    })

    it('should handle hex numbers', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
hex = 0xFF
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['hex']).toBe(255)
    })

    it('should handle string escapes', () => {
      const content = `[gd_scene format=3]

[node name="Node" type="Node"]
escaped = "line1\\nline2\\ttab\\"quote\\\\"
`
      const scene = parseScene(content)

      expect(scene.nodes[0]!.properties['escaped']).toBe('line1\nline2\ttab"quote\\')
    })
  })
})
