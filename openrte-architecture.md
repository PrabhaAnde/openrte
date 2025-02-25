# OpenRTE Architecture and Implementation Plan

## Executive Summary

This document outlines the architecture and implementation plan for OpenRTE, a framework-agnostic rich text editor built with TypeScript. The plan focuses on restructuring the codebase to improve modularity, maintainability, and extensibility while simplifying the implementation by replacing virtual DOM with direct DOM manipulation.

## Current State Analysis

### Issues with Current Approach

1. **Large, Category-Based Plugins:**
   - Current plugins (TextFormatting, ParagraphFormatting, TextSize) handle multiple unrelated features
   - Files are growing large and complex
   - Changes to one feature risk affecting others
   - Code maintenance becomes increasingly difficult

2. **Virtual DOM Complexity:**
   - Adds unnecessary abstraction for a text editor
   - Increases development complexity
   - Makes debugging more difficult
   - Adds performance overhead without significant benefits

3. **Feature Implementation Gaps:**
   - Many features from the plain JS implementation are missing
   - Rigid structure makes adding features cumbersome

## Architecture Goals

1. **Feature-Based Modularity:** Each button/feature should be self-contained
2. **Simplified DOM Handling:** Direct DOM manipulation instead of virtual DOM
3. **Easy Extension:** Adding new features should require minimal changes to existing code
4. **Framework Agnostic:** Core functionality independent of any UI framework
5. **Complete Feature Set:** Support all features from the original plain JS implementation

## Core Architecture

### Component Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         Editor Core                            │
├────────────────────────────────────────────────────────────────┤
│                        Plugin Registry                         │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│   Bold   │  Italic  │ Underline│  Lists   │  Tables  │   ...   │
│  Plugin  │  Plugin  │  Plugin  │  Plugin  │  Plugin  │         │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```

### Key Components

1. **Editor Core:** Manages the editor container, content area, and toolbar
2. **Plugin Registry:** Maintains a registry of all active plugins
3. **Selection Manager:** Handles text selection and ranges
4. **Individual Feature Plugins:** Each implements a specific editor feature

## Plugin System Design

### Plugin Interface

```typescript
interface Plugin {
  // Get the name of the plugin
  getName(): string;
  
  // Initialize the plugin with the editor instance
  init(editor: Editor): void;
  
  // Create and return a toolbar button/control
  createToolbarControl(): HTMLElement;
  
  // Execute the main action of this plugin
  execute(): void;
  
  // Clean up resources used by the plugin
  destroy(): void;
}
```

### Plugin Registry

The Plugin Registry will manage the collection of plugins and their lifecycle:

```typescript
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  
  // Register a plugin
  register(plugin: Plugin): void {
    this.plugins.set(plugin.getName(), plugin);
  }
  
  // Get a plugin by name
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  // Get all plugins
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  // Get all toolbar controls from plugins
  getToolbarControls(): HTMLElement[] {
    return this.getAllPlugins().map(plugin => plugin.createToolbarControl());
  }
  
  // Initialize all plugins
  initAll(editor: Editor): void {
    this.getAllPlugins().forEach(plugin => plugin.init(editor));
  }
  
  // Destroy all plugins
  destroyAll(): void {
    this.getAllPlugins().forEach(plugin => plugin.destroy());
  }
}
```

### Feature Plugin Pattern

Each feature will follow this basic implementation pattern:

```typescript
class FeaturePlugin implements Plugin {
  private editor: Editor;
  private button: HTMLElement;
  
  constructor() {
    this.button = document.createElement('button');
    this.button.textContent = 'Feature';
    this.button.className = 'openrte-button openrte-feature-button';
    this.button.addEventListener('click', this.execute.bind(this));
  }
  
  getName(): string {
    return 'feature';
  }
  
  init(editor: Editor): void {
    this.editor = editor;
  }
  
  createToolbarControl(): HTMLElement {
    return this.button;
  }
  
  execute(): void {
    // Implementation of the feature
  }
  
  destroy(): void {
    // Clean up resources
    this.button.removeEventListener('click', this.execute);
  }
}
```

## Directory Structure

```
src/
├── core/
│   ├── editor.ts                // Main editor class
│   ├── plugin-registry.ts       // Plugin management
│   ├── selection-manager.ts     // Selection utilities
│   └── serializer.ts            // HTML serialization
├── plugins/
│   ├── bold/
│   │   └── index.ts             // Bold feature
│   ├── italic/
│   │   └── index.ts             // Italic feature
│   ├── underline/
│   │   └── index.ts             // Underline feature
│   ├── text-color/
│   │   └── index.ts             // Text color feature
│   ├── highlight/
│   │   └── index.ts             // Highlight feature
│   ├── alignment/
│   │   └── index.ts             // Text alignment feature
│   ├── lists/
│   │   └── index.ts             // List feature
│   ├── font-family/
│   │   └── index.ts             // Font family feature
│   ├── font-size/
│   │   └── index.ts             // Font size feature
│   ├── link/
│   │   └── index.ts             // Link feature
│   ├── image/
│   │   └── index.ts             // Image feature
│   ├── table/
│   │   └── index.ts             // Table feature
│   ├── horizontal-rule/
│   │   └── index.ts             // Horizontal rule feature
│   ├── block-format/
│   │   └── index.ts             // Heading/paragraph feature
│   ├── line-spacing/
│   │   └── index.ts             // Line spacing feature
│   ├── page-break/
│   │   └── index.ts             // Page break feature
│   └── more plugins...
├── ui/
│   ├── button.ts                // Button creation utility
│   ├── dropdown.ts              // Dropdown creation utility
│   └── color-picker.ts          // Color picker utility
├── types/
│   ├── plugin.ts                // Plugin interface
│   └── content-model.ts         // Content data model
├── styles/
│   └── editor.css               // Core editor styles
├── adapters/
│   ├── react/
│   │   └── index.tsx            // React integration
│   └── vanilla/
│       └── index.ts             // Vanilla JS integration
└── index.ts                     // Main entry point
```

## Implementation Roadmap

### Phase 1: Core Architecture

1. Create the base Editor class with direct DOM manipulation
2. Implement the Plugin Registry
3. Create the Selection Manager
4. Set up the plugin interface and base plugin pattern
5. Implement basic editor styling

### Phase 2: Basic Text Formatting

1. Bold plugin
2. Italic plugin
3. Underline plugin
4. Strikethrough plugin
5. Text color plugin
6. Highlight plugin

### Phase 3: Paragraph Formatting

1. Alignment plugin (left, center, right, justify)
2. Lists plugin (ordered, unordered)
3. Indentation plugin
4. Block format plugin (headings, paragraphs)
5. Line spacing plugin

### Phase 4: Insert Features

1. Link plugin
2. Image plugin
3. Table plugin
4. Horizontal rule plugin
5. Page break plugin

### Phase 5: Advanced Features

1. Font family plugin
2. Font size plugin
3. Undo/Redo functionality
4. Clipboard handling (copy, cut, paste)
5. Special characters insertion

### Phase 6: Framework Adapters

1. React adapter component
2. Vanilla JS wrapper

## Implementation Details

### Editor Core Implementation

The Editor class will be the central component handling editor initialization, DOM management, and plugin coordination:

```typescript
class Editor {
  private container: HTMLElement;
  private contentArea: HTMLElement;
  private toolbar: HTMLElement;
  private pluginRegistry: PluginRegistry;
  private selectionManager: SelectionManager;
  
  constructor(element: HTMLElement) {
    this.container = element;
    this.pluginRegistry = new PluginRegistry();
    
    // Create editor DOM structure
    this.createEditorDOM();
    
    // Initialize selection manager
    this.selectionManager = new SelectionManager(this.contentArea);
    
    // Register built-in plugins
    this.registerBuiltInPlugins();
    
    // Initialize plugins
    this.pluginRegistry.initAll(this);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private createEditorDOM(): void {
    // Create toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'openrte-toolbar';
    
    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'openrte-content';
    this.contentArea.contentEditable = 'true';
    
    // Append to container
    this.container.appendChild(this.toolbar);
    this.container.appendChild(this.contentArea);
  }
  
  private registerBuiltInPlugins(): void {
    // Register default plugins
    this.registerPlugin(new BoldPlugin());
    this.registerPlugin(new ItalicPlugin());
    // Register more plugins...
  }
  
  // Plugin registration
  registerPlugin(plugin: Plugin): void {
    this.pluginRegistry.register(plugin);
    this.toolbar.appendChild(plugin.createToolbarControl());
  }
  
  // Selection management
  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }
  
  // Content management
  getContent(): string {
    return this.contentArea.innerHTML;
  }
  
  setContent(html: string): void {
    this.contentArea.innerHTML = html;
  }
  
  // Editor destruction
  destroy(): void {
    this.pluginRegistry.destroyAll();
    // Remove event listeners and clean up
  }
}
```

### Selection Manager

The Selection Manager will handle all selection-related operations:

```typescript
class SelectionManager {
  private contentArea: HTMLElement;
  
  constructor(contentArea: HTMLElement) {
    this.contentArea = contentArea;
  }
  
  // Get current selection
  getSelection(): Selection | null {
    const selection = window.getSelection();
    if (!selection) return null;
    
    // Check if selection is within the editor
    let node = selection.anchorNode;
    while (node && node !== this.contentArea) {
      node = node.parentNode;
    }
    
    return node ? selection : null;
  }
  
  // Get current range
  getRange(): Range | null {
    const selection = this.getSelection();
    return selection?.rangeCount ? selection.getRangeAt(0) : null;
  }
  
  // Save current selection
  saveSelection(): Range | null {
    const range = this.getRange();
    return range ? range.cloneRange() : null;
  }
  
  // Restore a saved selection
  restoreSelection(range: Range): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  // Apply formatting to selection
  applyToSelection(callback: (range: Range) => void): void {
    const range = this.getRange();
    if (range) {
      callback(range);
    }
  }
}
```

### Example Plugin Implementation

Here's an example of a complete Bold plugin implementation:

```typescript
class BoldPlugin implements Plugin {
  private editor: Editor;
  private button: HTMLElement;
  
  constructor() {
    // Create button
    this.button = document.createElement('button');
    this.button.textContent = 'B';
    this.button.className = 'openrte-button openrte-bold-button';
    this.button.title = 'Bold';
    this.button.addEventListener('click', this.execute.bind(this));
  }
  
  getName(): string {
    return 'bold';
  }
  
  init(editor: Editor): void {
    this.editor = editor;
    
    // Add keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  createToolbarControl(): HTMLElement {
    return this.button;
  }
  
  execute(): void {
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(this.applyBold.bind(this));
    
    // Focus back to editor
    this.editor.focus();
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    // Check for Ctrl+B / Cmd+B
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      this.execute();
    }
  }
  
  private applyBold(range: Range): void {
    // Check if already bold
    if (this.isSelectionBold(range)) {
      this.removeBold(range);
    } else {
      this.addBold(range);
    }
  }
  
  private isSelectionBold(range: Range): boolean {
    let node = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for bold tags
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'B' || node.nodeName === 'STRONG') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }
  
  private addBold(range: Range): void {
    const strong = document.createElement('strong');
    
    try {
      range.surroundContents(strong);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      strong.appendChild(fragment);
      range.insertNode(strong);
    }
  }
  
  private removeBold(range: Range): void {
    // Find the bold element
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let boldNode = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'B' || node.nodeName === 'STRONG') {
        boldNode = node;
        break;
      }
      node = node.parentNode;
    }
    
    if (boldNode) {
      // Unwrap the bold element
      const parent = boldNode.parentNode;
      while (boldNode.firstChild) {
        parent.insertBefore(boldNode.firstChild, boldNode);
      }
      parent.removeChild(boldNode);
    }
  }
  
  destroy(): void {
    this.button.removeEventListener('click', this.execute);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

## Feature Implementation Guidelines

### Text Formatting Features

Each text formatting feature (bold, italic, underline, etc.) should:
1. Create a toolbar button
2. Handle click events and keyboard shortcuts
3. Toggle formatting on/off based on current selection state
4. Support undo/redo operations
5. Update the button state based on current selection

### Paragraph Formatting Features

Paragraph formatting features should:
1. Apply to entire paragraphs or blocks
2. Handle mixed selections appropriately
3. Provide visual feedback of current state
4. Toggle between states (e.g., different list types)

### Insert Features

Insert features (tables, images, links) should:
1. Provide appropriate UI for gathering necessary information
2. Handle placement within the document correctly
3. Support editing of inserted elements
4. Manage focus appropriately after insertion

## Conclusion

This architecture plan provides a clear path to restructure the OpenRTE codebase into a more modular, maintainable system. By focusing on feature-specific plugins and direct DOM manipulation, the codebase will be easier to extend and maintain. The implementation can be done incrementally, allowing for continuous testing and refinement throughout the development process.

The resulting editor will maintain framework agnosticism while providing a complete feature set that matches or exceeds the original plain JavaScript implementation.
