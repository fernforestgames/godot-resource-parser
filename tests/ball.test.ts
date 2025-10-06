/**
 * Test for ball.tscn - a simple physics scene with RigidBody2D
 * Source: godot-demo-projects/2d/instancing/ball.tscn
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseScene } from '../src/parser'

describe('ball.tscn fixture', () => {
  const content = readFileSync(
    join(__dirname, 'fixtures/godot-demo-projects/ball.tscn'),
    'utf-8'
  )
  const scene = parseScene(content)

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(scene.header.type).toBe('gd_scene')
      expect(scene.header.format).toBe(3)
      expect(scene.header.uid).toBe('uid://c4y4kia1qlvfw')
      expect(scene.header.loadSteps).toBe(4)
    })
  })

  describe('External Resources', () => {
    it('should have 1 external resource (texture)', () => {
      expect(scene.extResources).toHaveLength(1)
    })

    it('should have correct texture resource properties', () => {
      const texture = scene.extResources[0]!
      expect(texture.type).toBe('Texture2D')
      expect(texture.uid).toBe('uid://dfuiyhr2ww3i8')
      expect(texture.path).toBe('res://bowling_ball.png')
      expect(texture.id).toBe('1')
    })
  })

  describe('Sub Resources', () => {
    it('should have 2 sub-resources', () => {
      expect(scene.subResources).toHaveLength(2)
    })

    it('should have PhysicsMaterial with bounce property', () => {
      const physicsMaterial = scene.subResources[0]!
      expect(physicsMaterial.type).toBe('PhysicsMaterial')
      expect(physicsMaterial.id).toBe('1')
      expect(physicsMaterial.properties['bounce']).toBe(0.4)
    })

    it('should have CircleShape2D with radius', () => {
      const circleShape = scene.subResources[1]!
      expect(circleShape.type).toBe('CircleShape2D')
      expect(circleShape.id).toBe('2')
      expect(circleShape.properties['radius']).toBe(30.0)
    })
  })

  describe('Nodes', () => {
    it('should have 3 nodes', () => {
      expect(scene.nodes).toHaveLength(3)
    })

    it('should have root Ball node as RigidBody2D', () => {
      const ball = scene.nodes[0]!
      expect(ball.name).toBe('Ball')
      expect(ball.type).toBe('RigidBody2D')
      expect(ball.properties['physics_material_override']).toEqual({
        type: 'SubResource',
        id: '1',
      })
    })

    it('should have Sprite2D child node', () => {
      const sprite = scene.nodes[1]!
      expect(sprite.name).toBe('Sprite2D')
      expect(sprite.type).toBe('Sprite2D')
      expect(sprite.parent).toBe('.')
      expect(sprite.properties['texture']).toEqual({
        type: 'ExtResource',
        id: '1',
      })
    })

    it('should have Collision child node with shape', () => {
      const collision = scene.nodes[2]!
      expect(collision.name).toBe('Collision')
      expect(collision.type).toBe('CollisionShape2D')
      expect(collision.parent).toBe('.')
      expect(collision.properties['shape']).toEqual({
        type: 'SubResource',
        id: '2',
      })
    })
  })

  describe('Node hierarchy', () => {
    it('should have Ball as root with 2 children', () => {
      const children = scene.nodes.filter((n) => n.parent === '.')
      expect(children).toHaveLength(2)
      expect(children.map((n) => n.name)).toEqual(['Sprite2D', 'Collision'])
    })
  })
})
