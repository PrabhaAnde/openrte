import { PluginRegistry } from './plugin-registry';
import { SelectionManager } from './selection-manager';
import { Plugin } from '../types/plugin';

export class Editor {
  private container: HTMLElement;
  private contentArea!: HTMLElement;
  private toolbar!: HTMLElement;
  private pluginRegistry: PluginRegistry;
  private selectionManager: SelectionManager;
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];
  
  constructor(element: HTMLElement) {
    this.container = element;
    this.pluginRegistry = new PluginRegistry();
    
    // Create editor DOM structure
    this.createEditorDOM();
    
    // Initialize selection manager
    this.selectionManager = new SelectionManager(this.contentArea);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private createEditorDOM(): void {
    // Clear container first
    this.container.innerHTML = '';
    
    // Create main editor container
    const editorElement = document.createElement('div');
    editorElement.className = 'openrte-editor';
    
    // Create toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'openrte-toolbar';
    
    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'openrte-content';
    this.contentArea.contentEditable = 'true';
    
    // Append elements to DOM
    editorElement.appendChild(this.toolbar);
    editorElement.appendChild(this.contentArea);
    this.container.appendChild(editorElement);
    
    // Insert initial paragraph if empty
    this.ensureContent();
  }
  
  private ensureContent(): void {
    if (!this.contentArea.innerHTML.trim()) {
      const p = document.createElement('p');
      p.innerHTML = '&nbsp;'; // Non-breaking space to ensure the paragraph has content
      this.contentArea.appendChild(p);
      
      // Place cursor in the paragraph
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  
  private setupEventListeners(): void {
    // Add event listeners to the content area
    this.addEventHandler(this.contentArea, 'keydown', this.handleKeyDown);
    this.addEventHandler(this.contentArea, 'input', this.handleInput);
    
    // Add focus and blur handlers
    this.addEventHandler(this.contentArea, 'focus', this.handleFocus);
    this.addEventHandler(this.contentArea, 'blur', this.handleBlur);
  }
  
  private addEventHandler<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ): void {
    const listener = handler.bind(this) as EventListener;
    element.addEventListener(type, listener);
    this.eventListeners.push({ element, type, listener });
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Will handle keyboard shortcuts later with plugins
    // console.log('Key down:', event.key);
  };
  
  private handleInput = (): void => {
    // Handle content changes
    // console.log('Content changed');
  };
  
  private handleFocus = (): void => {
    // console.log('Editor focused');
  };
  
  private handleBlur = (): void => {
    // console.log('Editor blurred');
  };
  
  // Plugin management
  registerPlugin(plugin: Plugin): void {
    this.pluginRegistry.register(plugin);
    // Ensure plugin is properly initialized with editor instance
    plugin.init(this); // Make sure this line exists
    this.toolbar.appendChild(plugin.createToolbarControl());
  }
  
  // Selection management
  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }
  
  // Content area access
  getContentArea(): HTMLElement {
    return this.contentArea;
  }
  
  // Content management
  getContent(): string {
    return this.contentArea.innerHTML;
  }
  
  setContent(html: string): void {
    this.contentArea.innerHTML = html;
    this.ensureContent();
  }
  
  // Focus the editor
  focus(): void {
    this.contentArea.focus();
  }
  
  // Editor destruction
  destroy(): void {
    // Clean up all plugins
    this.pluginRegistry.destroyAll();
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
    
    // Clear DOM
    this.container.innerHTML = '';
  }
}