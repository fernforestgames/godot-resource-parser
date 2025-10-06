/**
 * Test for player.tscn - a scene with animations, particles, and connections
 * Source: godot-demo-projects/2d/dodge_the_creeps/player.tscn
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseScene } from '../src/parser'

describe('player.tscn fixture', () => {
  const content = readFileSync(
    join(__dirname, 'fixtures/godot-demo-projects/player.tscn'),
    'utf-8'
  )
  const scene = parseScene(content)

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(scene.header.type).toBe('gd_scene')
      expect(scene.header.format).toBe(3)
      expect(scene.header.uid).toBe('uid://bwhlkliwp13p4')
      expect(scene.header.loadSteps).toBe(13)
    })
  })

  describe('External Resources', () => {
    it('should have 5 external resources', () => {
      expect(scene.extResources).toHaveLength(5)
    })

    it('should have a script resource', () => {
      const script = scene.extResources.find((r) => r.type === 'Script')
      expect(script).toBeDefined()
      expect(script!.uid).toBe('uid://6s0lxctks3qn')
      expect(script!.path).toBe('res://player.gd')
      expect(script!.id).toBe('1')
    })

    it('should have 4 texture resources', () => {
      const textures = scene.extResources.filter((r) => r.type === 'Texture2D')
      expect(textures).toHaveLength(4)
      expect(textures.map((t) => t.id)).toEqual(['2', '3', '4', '5'])
    })
  })

  describe('Sub Resources', () => {
    it('should have 7 sub-resources', () => {
      expect(scene.subResources).toHaveLength(7)
    })

    it('should have SpriteFrames with animations array', () => {
      const spriteFrames = scene.subResources.find((r) => r.type === 'SpriteFrames')
      expect(spriteFrames).toBeDefined()
      expect(spriteFrames!.id).toBe('1')
      expect(spriteFrames!.properties['animations']).toBeDefined()
      expect(Array.isArray(spriteFrames!.properties['animations'])).toBe(true)

      const animations = spriteFrames!.properties['animations'] as any[]
      expect(animations).toHaveLength(2)

      // Check animation names
      const animNames = animations.map((anim) => anim.name)
      expect(animNames).toContain('right')
      expect(animNames).toContain('up')
    })

    it('should have CapsuleShape2D with dimensions', () => {
      const capsule = scene.subResources.find((r) => r.type === 'CapsuleShape2D')
      expect(capsule).toBeDefined()
      expect(capsule!.id).toBe('2')
      expect(capsule!.properties['radius']).toBe(27.0)
      expect(capsule!.properties['height']).toBe(68.0)
    })

    it('should have ParticleProcessMaterial', () => {
      const material = scene.subResources.find(
        (r) => r.type === 'ParticleProcessMaterial'
      )
      expect(material).toBeDefined()
      expect(material!.id).toBe('7')
    })
  })

  describe('Nodes', () => {
    it('should have 4 nodes', () => {
      expect(scene.nodes).toHaveLength(4)
    })

    it('should have Player root node as Area2D', () => {
      const player = scene.nodes[0]!
      expect(player.name).toBe('Player')
      expect(player.type).toBe('Area2D')
      expect(player.properties['z_index']).toBe(10)
      expect(player.properties['script']).toEqual({
        type: 'ExtResource',
        id: '1',
      })
    })

    it('should have AnimatedSprite2D with sprite frames', () => {
      const sprite = scene.nodes.find((n) => n.type === 'AnimatedSprite2D')
      expect(sprite).toBeDefined()
      expect(sprite!.name).toBe('AnimatedSprite2D')
      expect(sprite!.parent).toBe('.')
      expect(sprite!.properties['scale']).toEqual({
        type: 'Vector2',
        x: 0.5,
        y: 0.5,
      })
      expect(sprite!.properties['sprite_frames']).toEqual({
        type: 'SubResource',
        id: '1',
      })
      expect(sprite!.properties['animation']).toBe('right')
    })

    it('should have CollisionShape2D', () => {
      const collision = scene.nodes.find((n) => n.type === 'CollisionShape2D')
      expect(collision).toBeDefined()
      expect(collision!.name).toBe('CollisionShape2D')
      expect(collision!.parent).toBe('.')
      expect(collision!.properties['shape']).toEqual({
        type: 'SubResource',
        id: '2',
      })
    })

    it('should have GPUParticles2D for trail effect', () => {
      const trail = scene.nodes.find((n) => n.name === 'Trail')
      expect(trail).toBeDefined()
      expect(trail!.type).toBe('GPUParticles2D')
      expect(trail!.parent).toBe('.')
      expect(trail!.properties['z_index']).toBe(-1)
      expect(trail!.properties['amount']).toBe(10)
      expect(trail!.properties['speed_scale']).toBe(2.0)
    })
  })

  describe('Connections', () => {
    it('should have 1 connection', () => {
      expect(scene.connections).toHaveLength(1)
    })

    it('should connect body_entered signal', () => {
      const connection = scene.connections[0]!
      expect(connection.signal).toBe('body_entered')
      expect(connection.from).toBe('.')
      expect(connection.to).toBe('.')
      expect(connection.method).toBe('_on_body_entered')
    })
  })
})
