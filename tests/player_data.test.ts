import { describe, expect, test } from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseResource } from '../src/parser.js'
import { isGodotResource } from '../src/types.js'

describe('Player data resource parsing', () => {
  test('parses player_data.tres with script_class attribute', () => {
    const content = readFileSync(join(__dirname, 'fixtures', 'player_data.tres'), 'utf-8')
    const result = parseResource(content)

    expect(isGodotResource(result)).toBe(true)

    // Check header with script_class
    expect(result.header.type).toBe('gd_resource')
    expect(result.header.resourceType).toBe('Resource')
    expect(result.header.scriptClass).toBe('CustomData')
    expect(result.header.format).toBe(3)
    expect(result.header.loadSteps).toBe(2)

    // Check ext_resource
    expect(result.extResources).toHaveLength(1)
    expect(result.extResources[0]).toEqual({
      type: 'Script',
      path: 'res://custom_data.gd',
      id: '1_a2b3c',
    })

    // Check resource properties
    expect(result.resource).toBeDefined()
    expect(result.resource?.properties['player_name']).toBe('Hero')
    expect(result.resource?.properties['score']).toBe(1500)
    expect(result.resource?.properties['level']).toBe(5)

    // Check typed array
    expect(result.resource?.properties['inventory']).toEqual({
      type: 'array',
      elementType: 'String',
      values: ['sword', 'shield', 'potion'],
    })

    // Check dictionary
    expect(result.resource?.properties['stats']).toEqual({
      health: 100,
      mana: 50,
      strength: 15,
    })

    // Check script reference
    expect(result.resource?.properties['script']).toEqual({
      type: 'ExtResource',
      id: '1_a2b3c',
    })
  })
})
