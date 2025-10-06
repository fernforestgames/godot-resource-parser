# Godot Resource Parser ![NPM Version](https://img.shields.io/npm/v/%40fernforestgames%2Fgodot-resource-parser)

A TypeScript/JavaScript library for parsing Godot 4's `.tscn` (scene) and `.tres` (resource) files.

## Features

- ✨ **Zero dependencies**: custom lexer and recursive descent parser implementation
- 🎯 **Fully typed**: comprehensive type definitions for all Godot structures
- 🔧 **Complete Godot 4 support**: parses all Godot value types (Vector2/3/4, Color, Transform2D/3D, etc.)
- 🚀 **CLI tool included**: parses stdin or a file into a JSON AST
- 📦 **Type guards**: runtime type checking utilities

## Installation

```bash
npm install @fernforestgames/godot-resource-parser
```

## Quick Start

### Parsing Files

```typescript
import { parse, parseScene, parseResource } from '@fernforestgames/godot-resource-parser';
import * as fs from 'fs';

// Auto-detect file type (scene or resource)
const content = fs.readFileSync('scene.tscn', 'utf8');
const parsed = parse(content);

// Parse scene file (.tscn)
const scene = parseScene(content);
console.log(scene.nodes); // Access scene nodes
console.log(scene.connections); // Access signal connections

// Parse resource file (.tres)
const resourceContent = fs.readFileSync('material.tres', 'utf8');
const resource = parseResource(resourceContent);
console.log(resource.resource?.properties); // Access resource properties
```

### Type Guards

```typescript
import { isGodotScene, isVector3, isColor } from '@fernforestgames/godot-resource-parser';

const result = parse(content);

if (isGodotScene(result)) {
  // TypeScript knows this is a GodotScene
  result.nodes.forEach(node => {
    console.log(node.name, node.type);
  });
}

// Check value types
const position = node.properties.position;
if (isVector3(position)) {
  console.log(`Position: ${position.x}, ${position.y}, ${position.z}`);
}
```

## CLI Usage

The package includes a command-line tool for parsing Godot files into an AST. You can run it using `npx` or install it globally:

```bash
# Parse a file
npx @fernforestgames/godot-resource-parser scene.tscn > output.json

# Parse from stdin
cat scene.tscn | godot-resource-parser > output.json
```

## API Reference

```typescript
// Auto-detects and parses either a scene or resource file.
parse(content: string): ParsedGodotFile;

// Parses a Godot scene file (`.tscn`). Throws error if file is not a scene.
parseScene(content: string): GodotScene;

// Parses a Godot resource file (`.tres`). Throws error if file is not a resource.
parseResource(content: string): GodotResource;
```

### Type Definitions

```typescript
interface GodotScene {
  header: GdSceneHeader
  extResources: ExtResource[]
  subResources: SubResource[]
  nodes: Node[]
  connections: Connection[]
  editables: Editable[]
}

interface Node {
  name: string
  type: string
  parent?: string
  instance?: ExtResourceRef
  owner?: string
  index?: number
  groups?: string[]
  properties: Record<string, GodotValue>
}

interface Connection {
  signal: string
  from: string
  to: string
  callable?: string
  method?: string  // Legacy support
  flags?: number
  binds?: GodotValue[]
  unbinds?: number
}

interface GodotResource {
  header: GdResourceHeader
  extResources: ExtResource[]
  subResources: SubResource[]
  resource?: ResourceSection
}

interface ResourceSection {
  properties: Record<string, GodotValue>
}
```

### Type Guards

```typescript
// File type guards
isGodotScene(value): value is GodotScene
isGodotResource(value): value is GodotResource

// Value type guards
isVector2(value): value is Vector2
isVector3(value): value is Vector3
isColor(value): value is Color
isExtResourceRef(value): value is ExtResourceRef
isSubResourceRef(value): value is SubResourceRef
```

## License

Released under the MIT License. See the [LICENSE](LICENSE) file for details.
