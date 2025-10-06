import { parseResource } from '../src/parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('sol.tres fixture', () => {
  const content = readFileSync(join(__dirname, 'fixtures', 'sol.tres'), 'utf-8');
  const result = parseResource(content);

  describe('Header', () => {
    it('should have correct header properties', () => {
      expect(result.header.type).toBe('gd_resource');
      expect(result.header.scriptClass).toBe('StarSystem');
      expect(result.header.loadSteps).toBe(21);
      expect(result.header.format).toBe(3);
      expect(result.header.uid).toBe('uid://cew4x137v08q');
    });
  });

  describe('External Resources', () => {
    it('should have 17 external resources', () => {
      expect(result.extResources).toHaveLength(17);
    });

    it('should parse first ext_resource correctly', () => {
      expect(result.extResources[0].type).toBe('Script');
      expect(result.extResources[0].uid).toBe('uid://caa3h7n2ybl2u');
      expect(result.extResources[0].path).toBe('res://galaxy/star_system/star_system.gd');
      expect(result.extResources[0].id).toBe('1_ewhsc');
    });
  });

  describe('Sub Resources', () => {
    it('should have 1 sub resource', () => {
      expect(result.subResources).toHaveLength(1);
    });

    it('should parse sub_resource correctly', () => {
      expect(result.subResources[0].id).toBe('Resource_tj2o3');
      expect(result.subResources[0].type).toBe('Resource');
    });
  });

  describe('Resource Properties', () => {
    it('should have resource section', () => {
      expect(result.resource).toBeDefined();
    });

    it('should parse basic properties', () => {
      expect(result.resource!.properties.name).toBe('Sol');
      expect(result.resource!.properties.scene_path).toBe('res://galaxy/star_system/scenes/sol.tscn');
    });

    it('should parse connections array with StringName type', () => {
      const connections = result.resource!.properties.connections;
      expect(connections).toBeDefined();
      expect(connections.type).toBe('array');
      expect(connections.elementType).toBe('StringName');
      expect(Array.isArray(connections.values)).toBe(true);
      expect(connections.values).toHaveLength(5);
      expect(connections.values[0]).toBe('Alpha Centauri');
      expect(connections.values[1]).toBe("Barnard's Star");
    });

    it('should parse ports array with typed ExtResource', () => {
      const ports = result.resource!.properties.ports;
      expect(ports).toBeDefined();
      expect(ports.type).toBe('array');
      expect(ports.elementType?.type).toBe('ext_resource_ref');
      expect(Array.isArray(ports.values)).toBe(true);
      expect(ports.values).toHaveLength(2);
    });
  });
});
