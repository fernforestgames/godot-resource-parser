/**
 * Test for tileset.tres - a complex TileSet resource with many atlas sources
 * Source: godot-demo-projects/2d/hexagonal_map/tileset.tres
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseResource } from '../src/parser'

describe('tileset.tres fixture', () => {
  const content = readFileSync(
    join(__dirname, 'fixtures/godot-demo-projects/tileset.tres'),
    'utf-8'
  )
  const resource = parseResource(content)

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(resource.header.type).toBe('gd_resource')
      expect(resource.header.resourceType).toBe('TileSet')
      expect(resource.header.format).toBe(3)
      expect(resource.header.uid).toBe('uid://bgao55br0duys')
      expect(resource.header.loadSteps).toBe(53)
    })
  })

  describe('External Resources', () => {
    it('should have 26 external texture resources', () => {
      expect(resource.extResources).toHaveLength(26)
      expect(resource.extResources.every((r) => r.type === 'Texture2D')).toBe(true)
    })

    it('should have textures with correct UIDs and paths', () => {
      const firstTexture = resource.extResources[0]!
      expect(firstTexture.type).toBe('Texture2D')
      expect(firstTexture.uid).toBe('uid://c676gm02l437d')
      expect(firstTexture.path).toBe('res://tiles/WWT-01.png')
      expect(firstTexture.id).toBe('1')

      const secondTexture = resource.extResources[1]!
      expect(secondTexture.uid).toBe('uid://bm256vrrnad84')
      expect(secondTexture.path).toBe('res://tiles/WWT-02.png')
      expect(secondTexture.id).toBe('2')
    })
  })

  describe('Sub Resources', () => {
    it('should have 26 TileSetAtlasSource sub-resources', () => {
      expect(resource.subResources).toHaveLength(26)
      expect(
        resource.subResources.every((r) => r.type === 'TileSetAtlasSource')
      ).toBe(true)
    })

    it('should have atlas sources with texture_region_size', () => {
      const atlas = resource.subResources[0]!
      expect(atlas.type).toBe('TileSetAtlasSource')
      expect(atlas.id).toBe('TileSetAtlasSource_oh287')
      expect(atlas.properties['texture']).toEqual({
        type: 'ExtResource',
        id: '1',
      })
      expect(atlas.properties['texture_region_size']).toEqual({
        type: 'Vector2i',
        x: 128,
        y: 128,
      })
    })

    it('should have atlas sources with tile alternatives', () => {
      const atlas = resource.subResources[0]!
      expect(atlas.properties['0:0/next_alternative_id']).toBe(8)
      expect(atlas.properties['0:0/0']).toBe(0)
      expect(atlas.properties['0:0/1']).toBe(1)
      expect(atlas.properties['0:0/1/flip_h']).toBe(true)
      expect(atlas.properties['0:0/2']).toBe(2)
      expect(atlas.properties['0:0/2/flip_v']).toBe(true)
    })
  })

  describe('Main Resource', () => {
    it('should have a resource section', () => {
      expect(resource.resource).toBeDefined()
    })

    it('should have hexagonal tile configuration', () => {
      expect(resource.resource!.properties['tile_shape']).toBe(3)
      expect(resource.resource!.properties['tile_offset_axis']).toBe(1)
      expect(resource.resource!.properties['tile_size']).toEqual({
        type: 'Vector2i',
        x: 110,
        y: 94,
      })
    })

    it('should reference all atlas sources', () => {
      // Should have sources/0 through sources/25
      expect(resource.resource!.properties['sources/0']).toEqual({
        type: 'SubResource',
        id: 'TileSetAtlasSource_oh287',
      })
      expect(resource.resource!.properties['sources/25']).toEqual({
        type: 'SubResource',
        id: 'TileSetAtlasSource_jm5h0',
      })
    })
  })

  describe('Complex structure', () => {
    it('should correctly parse all sub-resource IDs', () => {
      const ids = resource.subResources.map((r) => r.id)
      expect(ids).toContain('TileSetAtlasSource_oh287')
      expect(ids).toContain('TileSetAtlasSource_bmxdu')
      expect(ids).toContain('TileSetAtlasSource_jm5h0')
      expect(ids).toHaveLength(26)
    })

    it('should have consistent ext_resource to sub_resource mapping', () => {
      // First atlas should reference first texture
      const firstAtlas = resource.subResources.find(
        (r) => r.id === 'TileSetAtlasSource_oh287'
      )
      expect(firstAtlas!.properties['texture']).toEqual({
        type: 'ExtResource',
        id: '1',
      })

      // Second atlas should reference second texture
      const secondAtlas = resource.subResources.find(
        (r) => r.id === 'TileSetAtlasSource_bmxdu'
      )
      expect(secondAtlas!.properties['texture']).toEqual({
        type: 'ExtResource',
        id: '2',
      })
    })
  })
})
