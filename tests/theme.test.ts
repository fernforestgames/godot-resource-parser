/**
 * Test for theme.tres - a UI theme resource with fonts and styles
 * Source: godot-demo-projects/2d/platformer/gui/theme.tres
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseResource } from '../src/parser'

describe('theme.tres fixture', () => {
  const content = readFileSync(
    join(__dirname, 'fixtures/godot-demo-projects/theme.tres'),
    'utf-8'
  )
  const resource = parseResource(content)

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(resource.header.type).toBe('gd_resource')
      expect(resource.header.resourceType).toBe('Theme')
      expect(resource.header.format).toBe(3)
      expect(resource.header.uid).toBe('uid://bc4kpaija14nv')
      expect(resource.header.loadSteps).toBe(7)
    })
  })

  describe('External Resources', () => {
    it('should have 1 font resource', () => {
      expect(resource.extResources).toHaveLength(1)
    })

    it('should have FontFile with correct properties', () => {
      const font = resource.extResources[0]!
      expect(font.type).toBe('FontFile')
      expect(font.uid).toBe('uid://b38i6uom437i1')
      expect(font.path).toBe('res://gui/kenney_mini_square.ttf')
      expect(font.id).toBe('1_f0sjs')
    })
  })

  describe('Sub Resources', () => {
    it('should have 5 StyleBoxFlat sub-resources', () => {
      expect(resource.subResources).toHaveLength(5)
      expect(resource.subResources.every((r) => r.type === 'StyleBoxFlat')).toBe(
        true
      )
    })

    it('should have StyleBoxFlat with content margins', () => {
      const styleBox = resource.subResources[0]!
      expect(styleBox.id).toBe('1')
      expect(styleBox.properties['content_margin_left']).toBe(6.0)
      expect(styleBox.properties['content_margin_top']).toBe(4.0)
      expect(styleBox.properties['content_margin_right']).toBe(6.0)
      expect(styleBox.properties['content_margin_bottom']).toBe(4.0)
    })

    it('should have StyleBoxFlat with bg_color', () => {
      const styleBox = resource.subResources[0]!
      expect(styleBox.properties['bg_color']).toEqual({
        type: 'Color',
        r: 0.18,
        g: 0.207,
        b: 0.279,
        a: 1,
      })
    })

    it('should have StyleBoxFlat with border properties', () => {
      const styleBox = resource.subResources[0]!
      expect(styleBox.properties['border_width_left']).toBe(1)
      expect(styleBox.properties['border_width_top']).toBe(1)
      expect(styleBox.properties['border_width_right']).toBe(1)
      expect(styleBox.properties['border_width_bottom']).toBe(1)
      expect(styleBox.properties['border_color']).toEqual({
        type: 'Color',
        r: 0.14,
        g: 0.161,
        b: 0.217,
        a: 1,
      })
    })
  })

  describe('Main Resource', () => {
    it('should have a resource section', () => {
      expect(resource.resource).toBeDefined()
    })

    it('should have default_font property', () => {
      expect(resource.resource!.properties['default_font']).toEqual({
        type: 'ExtResource',
        id: '1_f0sjs',
      })
    })

    it('should have Button theme customizations', () => {
      const props = resource.resource!.properties

      // Check color properties
      expect(props['Button/colors/font_color']).toEqual({
        type: 'Color',
        r: 0.8,
        g: 0.8075,
        b: 0.8275,
        a: 1,
      })
      expect(props['Button/colors/font_color_disabled']).toEqual({
        type: 'Color',
        r: 1,
        g: 1,
        b: 1,
        a: 0.3,
      })
      expect(props['Button/colors/font_color_hover']).toEqual({
        type: 'Color',
        r: 0.88,
        g: 0.8845,
        b: 0.8965,
        a: 1,
      })
    })

    it('should have Button style references', () => {
      const props = resource.resource!.properties

      expect(props['Button/styles/disabled']).toEqual({
        type: 'SubResource',
        id: '1',
      })
      expect(props['Button/styles/focus']).toEqual({
        type: 'SubResource',
        id: '2',
      })
      expect(props['Button/styles/hover']).toEqual({
        type: 'SubResource',
        id: '3',
      })
      expect(props['Button/styles/normal']).toEqual({
        type: 'SubResource',
        id: '4',
      })
      expect(props['Button/styles/pressed']).toEqual({
        type: 'SubResource',
        id: '5',
      })
    })

    it('should have Button constants', () => {
      expect(resource.resource!.properties['Button/constants/h_separation']).toBe(2)
    })

    it('should have Button font reference', () => {
      expect(resource.resource!.properties['Button/fonts/font']).toEqual({
        type: 'ExtResource',
        id: '1_f0sjs',
      })
    })
  })

  describe('Theme structure', () => {
    it('should use hierarchical property names for theme customization', () => {
      const props = resource.resource!.properties
      const themeProps = Object.keys(props).filter((k) => k.startsWith('Button/'))

      expect(themeProps.length).toBeGreaterThan(10)
      expect(themeProps).toContain('Button/colors/font_color')
      expect(themeProps).toContain('Button/colors/icon_color_hover')
      expect(themeProps).toContain('Button/styles/normal')
      expect(themeProps).toContain('Button/fonts/font')
    })
  })
})
