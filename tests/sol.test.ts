import { parseResource } from '../src/parser';
import { TypedArray } from '../src/types';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('sol.tres fixture', () => {
  const content = readFileSync(join(__dirname, 'fixtures', 'sol.tres'), 'utf-8');
  const result = parseResource(content);

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(result.header.type).toBe('gd_resource');
      expect(result.header.resourceType).toBe('Resource');
      expect(result.header.loadSteps).toBe(21);
      expect(result.header.format).toBe(3);
      expect(result.header.uid).toBe('uid://cew4x137v08q');
    });
  });

  describe('External Resources', () => {
    it('should have 19 external resources', () => {
      expect(result.extResources).toHaveLength(19);
    });

    it('should parse first ext_resource correctly', () => {
      const first = result.extResources[0];
      expect(first).toBeDefined();
      expect(first!.type).toBe('Script');
      expect(first!.uid).toBe('uid://caa3h7n2ybl2u');
      expect(first!.path).toBe('res://galaxy/star_system/star_system.gd');
      expect(first!.id).toBe('1_ewhsc');
    });
  });

  describe('Sub Resources', () => {
    it('should have 1 sub resource', () => {
      expect(result.subResources).toHaveLength(1);
    });

    it('should parse sub_resource correctly', () => {
      const first = result.subResources[0];
      expect(first).toBeDefined();
      expect(first!.id).toBe('Resource_tj2o3');
      expect(first!.type).toBe('Resource');
    });
  });

  describe('Resource Properties', () => {
    it('should have resource section', () => {
      expect(result.resource).toBeDefined();
    });

    it('should parse basic properties', () => {
      expect(result.resource!.properties['name']).toBe('Sol');
      expect(result.resource!.properties['scene_path']).toBe('res://galaxy/star_system/scenes/sol.tscn');
    });

    it('should parse connections array with StringName type', () => {
      const connections = result.resource!.properties['connections'] as TypedArray;
      expect(connections).toBeDefined();
      expect(connections.type).toBe('array');
      expect(connections.elementType).toBe('StringName');
      expect(Array.isArray(connections.values)).toBe(true);
      expect(connections.values).toHaveLength(5);
      expect(connections.values[0]).toBe('Alpha Centauri');
      expect(connections.values[1]).toBe("Barnard's Star");
    });

    it('should parse ports array with typed ExtResource', () => {
      const ports = result.resource!.properties['ports'] as TypedArray;
      expect(ports).toBeDefined();
      expect(ports.type).toBe('array');
      expect(typeof ports.elementType).toBe('object');
      if (typeof ports.elementType === 'object' && ports.elementType !== null && 'type' in ports.elementType && 'id' in ports.elementType) {
        expect(ports.elementType.type).toBe('ExtResource');
        expect(ports.elementType.id).toBe('16_elnv2');
      }
      expect(Array.isArray(ports.values)).toBe(true);
      expect(ports.values).toHaveLength(2);
    });
  });
});
