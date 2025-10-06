# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript library for parsing Godot 4's .tscn (scene) and .tres (resource) files using a custom lexer and recursive descent parser with zero external parsing dependencies.

## Commands

**Build:**
```bash
npm run build
```

**Lint:**
```bash
npm run lint
```

**Tests:**
```bash
npm test
```

To run a specific test file:
```bash
npm test -- tests/parser.test.ts
```

To run tests matching a pattern:
```bash
npm test -- -t "pattern"
```

## Architecture

The parser follows a three-stage architecture:

### 1. Lexer (`src/lexer.ts`)
- Tokenizes input into: NUMBER, STRING, IDENTIFIER, SYMBOL, NEWLINE, EOF
- Handles escape sequences in strings (`\"`, `\\`, `\n`, `\t`, `\r`, `\u0000`)
- Supports hex numbers (`0xFF`), scientific notation (`1.5e-10`), negative numbers
- Skips whitespace and comments (`;` to end of line)
- Tracks line/column for error reporting
- **API:** `peek()`, `next()`, `expect(type, value?)`, `isAtEnd()`

### 2. Value Parser (`src/value-parser.ts`)
- Parses Godot-specific types: Vector2/3/4, Color, Rect2, Transform2D/3D, Quaternion, Basis, Plane, AABB
- Parses packed arrays: PackedByteArray, PackedInt32Array, PackedFloat32Array, PackedStringArray, PackedVector2Array, etc.
- Parses collections: arrays `[1, 2, 3]`, dictionaries `{ "key": value }`
- Parses resource references: `ExtResource("id")`, `SubResource("id")`
- Handles primitives: numbers, strings, booleans (`true`/`false`), `null`
- **Main method:** `parseValue()` - recursive value parsing

### 3. Main Parser (`src/parser.ts`)
- Parses file sections in order: file header → ext_resource → sub_resource → node/connection/editable → resource
- Section types: `[gd_scene ...]`, `[gd_resource ...]`, `[ext_resource ...]`, `[sub_resource ...]`, `[node ...]`, `[connection ...]`, `[editable ...]`, `[resource]`
- Builds structured objects from sections and their properties
- **Public API:** `parse(content)`, `parseScene(content)`, `parseResource(content)`

### Type System (`src/types.ts`)
- Comprehensive TypeScript interfaces for all Godot structures
- Type guards: `isGodotScene()`, `isGodotResource()`, `isExtResourceRef()`, `isSubResourceRef()`, `isVector2()`, `isVector3()`, `isColor()`
- Token types and value types with strict typing
- All Godot value types are tagged unions with a `type` field for discrimination

### Error Handling (`src/errors.ts`)
- Custom error classes: `ParseError`, `LexerError`, `SyntaxError`, `ReferenceError`, `UnexpectedEOFError`, `UnexpectedTokenError`
- Errors include line/column numbers and source context
- Use `withContext()` static methods to create errors with code snippets

## Test Files

Tests use Jest and fixtures from https://github.com/godotengine/godot-demo-projects repository.

Test structure:
- `tests/parser.test.ts` - Main parser tests with inline test content
- `tests/ball.test.ts`, `tests/player.test.ts`, etc. - Tests for specific demo project files

When adding tests, prefer using real Godot files from the demo projects to ensure real-world compatibility.

## Implementation Notes

- The lexer uses a single-character lookahead via `peek1()` for efficient tokenization
- Parser uses manual state saving/restoration for lookahead (see `peekSectionType()`)
- Newlines are significant tokens (not skipped) to properly delimit sections and properties
- Properties are parsed until the next section (`[`) or EOF
- Section attributes (within `[...]`) and properties (after sections) use the same value parser but different parsing contexts
- Resource IDs can be strings or numbers - handle both
- Unknown Godot types fall back to a generic object representation: `{ type: typeName, values: [...] }`

## File Format Reference

Godot file format documentation: https://docs.godotengine.org/en/stable/contributing/development/file_formats/tscn.html

Official implementation: `ResourceFormatLoaderText` class in Godot engine source at `scene/resources/resource_format_text.cpp`
- Use `npm run build && ./dist/cli.js file_to_test.tres` to test parsing from the CLI