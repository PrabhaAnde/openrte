import { PluginRegistry } from './plugin-registry';
import { SelectionManager } from './selection-manager';
import { Plugin } from '../types/plugin';
import { setupContentEditable, focusElement } from '../utils/browser-utils';
import { sanitizeHtml, normalizeHtml } from '../utils/html-utils';
import { DocumentModel } from '../model/document-model';
import { HTMLParser } from '../model/html-parser';
import { SelectionModel } from '../model/selection-model';
import { SelectionObserver } from '../model/selection-observer';
import { DocumentPosition, DocumentRange } from '../model/selection-interfaces';
import { RenderingManager, RenderStats } from '../model/rendering-manager';

/**
 * Main editor class for OpenRTE
 */
export class Editor {
  /**
   * The container element
   */
  private container: HTMLElement;
  
  /**
   * The content editable area
   */
  private contentArea!: HTMLElement;
  
  /**
   * The toolbar element
   */
  private toolbar!: HTMLElement;
  
  /**
   * Plugin registry
   */
  private pluginRegistry: PluginRegistry;
  
  /**
   * Selection manager
   */
  private selectionManager: SelectionManager;
  
  /**
   * Event listeners for cleanup
   */
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];

  /**
 * Document model
 */
  private documentModel: DocumentModel;

  private selectionModel!: SelectionModel;
  private selectionObserver!: SelectionObserver;
  private renderingManager!: RenderingManager;

  
  /**
   * Constructor
   * 
   * @param element Container element
   */
  constructor(element: HTMLElement) {
    this.container = element;
    this.pluginRegistry = new PluginRegistry();
    
    // Create editor DOM structure
    this.createEditorDOM();
    
    // Initialize selection manager
    this.selectionManager = new SelectionManager(this.contentArea);
    
    // Set up event listeners
    this.setupEventListeners();


    // In the constructor, after initializing other components, add:
    // Initialize document model
    this.documentModel = new DocumentModel();

    // Parse initial content to model (optional in Phase 2A)
    this.parseContentToModel();

    // Initialize selection model
    this.selectionModel = new SelectionModel(this.documentModel);
    
    // Initialize selection observer
    this.selectionObserver = new SelectionObserver(this, this.selectionModel);
    this.selectionObserver.startObserving();

    this.renderingManager = new RenderingManager(this.contentArea, this.documentModel);
  }

    /**
   * Parse current content to document model
   * This is a one-way operation in Phase 2A
   */
  private parseContentToModel(): void {
    const html = this.contentArea.innerHTML;
    const document = HTMLParser.parseProcessedHtml(html, this.documentModel);
    this.documentModel.setDocument(document as any);
  }
  
  /**
   * Create the DOM structure for the editor
   */
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
    
    // Set up content editable with browser-specific adjustments
    setupContentEditable(this.contentArea);
    
    // Append elements to DOM
    editorElement.appendChild(this.toolbar);
    editorElement.appendChild(this.contentArea);
    this.container.appendChild(editorElement);
    
    // Insert initial paragraph if empty
    this.ensureContent();
  }
  
  /**
   * Ensure the content area has at least a paragraph
   */
  private ensureContent(): void {
    if (!this.contentArea.innerHTML.trim()) {
      const p = document.createElement('p');
      p.innerHTML = '<br>'; // Use <br> to ensure the paragraph has height
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
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Add event listeners to the content area
    this.addEventHandler(this.contentArea, 'keydown', this.handleKeyDown);
    this.addEventHandler(this.contentArea, 'input', this.handleInput);
    
    // Add mouseup handler to catch double-click and triple-click selections
    this.addEventHandler(this.contentArea, 'mouseup', this.handleMouseUp);
    
    // Add focus and blur handlers
    this.addEventHandler(this.contentArea, 'focus', this.handleFocus);
    this.addEventHandler(this.contentArea, 'blur', this.handleBlur);
    
    // Add copy and paste handlers
    this.addEventHandler(this.contentArea, 'copy', this.handleCopy);
    this.addEventHandler(this.contentArea, 'paste', this.handlePaste);
    
    // Add document-level selection change handler
    this.addEventHandler(document, 'selectionchange', this.handleSelectionChange);
  }
  
  /**
   * Add an event handler and track it for cleanup
   * 
   * @param element Element to add handler to
   * @param type Event type
   * @param handler Event handler
   */
  private addEventHandler<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document,
    type: string,
    handler: (event: any) => void
  ): void {
    const listener = handler.bind(this) as EventListener;
    element.addEventListener(type, listener);
    this.eventListeners.push({ element, type, listener });
  }
  
  /**
   * Handle keydown events
   * 
   * @param event Keyboard event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Emit event for plugins to handle
    this.pluginRegistry.emit('editor:keydown', {
      originalEvent: event,
      editor: this
    });
    
    // Handle special keys if not handled by plugins
    if (event.defaultPrevented) return;
    
    // Add specific editor key handling here
  };
  
  /**
   * Handle input events
   * 
   * @param event Input event
   */
  private handleInput = (event: InputEvent): void => {
    // Ensure content always has at least one block element
    this.ensureContent();
    
    // Emit event for plugins
    this.pluginRegistry.emit('editor:input', {
      originalEvent: event,
      editor: this
    });
  };
  
  /**
   * Handle mouseup events
   * 
   * @param event Mouse event
   */
  private handleMouseUp = (event: MouseEvent): void => {
    // Trigger a custom event for plugins to update their state
    // This helps with double-click and triple-click selections
    setTimeout(() => {
      // Use setTimeout to ensure selection is complete
      const customEvent = new CustomEvent('selectionupdate', { bubbles: true });
      this.contentArea.dispatchEvent(customEvent);
      
      // Also emit through plugin registry
      this.pluginRegistry.emit('editor:selectionupdate', {
        originalEvent: event,
        editor: this
      });
    }, 0);
  };
  
  /**
   * Handle focus events
   * 
   * @param event Focus event
   */
  private handleFocus = (event: FocusEvent): void => {
    // Add focus class to editor container
    this.container.classList.add('openrte-focused');
    
    // Emit event for plugins
    this.pluginRegistry.emit('editor:focus', {
      originalEvent: event,
      editor: this
    });
  };
  
  /**
   * Handle blur events
   * 
   * @param event Blur event
   */
  private handleBlur = (event: FocusEvent): void => {
    // Remove focus class from editor container
    this.container.classList.remove('openrte-focused');
    
    // Emit event for plugins
    this.pluginRegistry.emit('editor:blur', {
      originalEvent: event,
      editor: this
    });
  };
  
  /**
   * Handle copy events
   * 
   * @param event Copy event
   */
  private handleCopy = (event: ClipboardEvent): void => {
    // Emit event for plugins to handle
    this.pluginRegistry.emit('editor:copy', {
      originalEvent: event,
      editor: this
    });
  };
  
  /**
   * Handle paste events
   * 
   * @param event Paste event
   */
  private handlePaste = (event: ClipboardEvent): void => {
    // Let plugins handle paste first
    this.pluginRegistry.emit('editor:paste', {
      originalEvent: event,
      editor: this
    });
    
    // If event was not prevented by a plugin, handle it here
    if (!event.defaultPrevented) {
      // Implement default paste behavior
      // (This could be moved to a separate utility function)
    }
  };
  
  /**
   * Handle selection change events
   * 
   * @param event Selection change event
   */
  private handleSelectionChange = (event: Event): void => {
    // Check if selection is in editor
    const selection = this.selectionManager.getSelection();
    if (!selection) return;
    
    // Emit event for plugins
    this.pluginRegistry.emit('editor:selectionchange', {
      originalEvent: event,
      editor: this,
      selection
    });
  };

  /**
 * Render the document model to DOM
 */
  renderDocument(): void {
    this.renderingManager.render();
    
    // Emit event after rendering
    this.pluginRegistry.emit('editor:modelrendered', {
      editor: this,
      stats: this.renderingManager.getRenderStats()
    });
  }

  /**
   * Get rendering statistics
   */
  getRenderingStats(): RenderStats {
    return this.renderingManager.getRenderStats();
  }

  /**
   * Get the selection model
   */
  getSelectionModel(): SelectionModel {
    return this.selectionModel;
  }
  
  /**
   * Get the current document selection range
   */
  getDocumentRange(): DocumentRange | null {
    return this.selectionModel.toDocumentRange();
  }
  
  /**
   * Set selection to a document range
   */
  setDocumentRange(range: DocumentRange): void {
    this.selectionModel.setSelection(range.start, range.end);
    
    // Emit event
    this.pluginRegistry.emit('editor:modelselectionchange', {
      selectionModel: this.selectionModel,
      editor: this
    });
  }
  
  /**
   * Export selection to a serializable format for storage
   */
  exportSelection(): any {
    return this.selectionModel.serialize();
  }
  
  /**
   * Import selection from a serialized format
   */
  importSelection(serialized: any): boolean {
    return this.selectionModel.deserialize(serialized);
  }
  
  /**
   * Register a plugin
   * 
   * @param plugin Plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    this.pluginRegistry.register(plugin);
    
    // Initialize the plugin with this editor instance
    plugin.init(this);
    
    // Add the plugin's toolbar control
    this.toolbar.appendChild(plugin.createToolbarControl());
  }
  
  /**
   * Get the plugin registry
   * 
   * @returns The plugin registry
   */
  getPluginRegistry(): PluginRegistry {
    return this.pluginRegistry;
  }
  
  /**
   * Get the selection manager
   * 
   * @returns The selection manager
   */
  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }
  
  /**
   * Get the content area element
   * 
   * @returns The content area element
   */
  getContentArea(): HTMLElement {
    return this.contentArea;
  }
  
  /**
   * Get the editor content as HTML
   * 
   * @returns HTML content
   */
  getContent(): string {
    return this.contentArea.innerHTML;
  }
  
  /**
   * Set the editor content
   * 
   * @param html HTML content
   */
  setContent(html: string): void {
    // Sanitize and normalize HTML
    const sanitized = sanitizeHtml(html);
    const normalized = normalizeHtml(sanitized);
    
    this.contentArea.innerHTML = normalized;
    
    // Ensure there's at least one paragraph
    this.ensureContent();

    
    
    // Emit content change event
    this.pluginRegistry.emit('editor:contentchange', {
      html: normalized,
      editor: this
    });

    this.parseContentToModel();
  }

  /**
 * Get the document model
 */
  getDocumentModel(): DocumentModel {
    return this.documentModel;
  }
  
  /**
   * Focus the editor
   */
  focus(): void {
    // Use browser-specific focus handling
    focusElement(this.contentArea);
  }
  
  /**
   * Execute a command on the editor
   * 
   * @param command Command name
   * @param value Optional command value
   * @returns True if the command was executed
   */
  executeCommand(command: string, value?: string): boolean {
    try {
      return document.execCommand(command, false, value);
    } catch (e) {
      console.error(`Error executing command "${command}":`, e);
      return false;
    }
  }
  
  /**
   * Destroy the editor
   */
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
    
    // Emit destroy event
    this.pluginRegistry.emit('editor:destroy', { editor: this });

     // Stop selection observing
     this.selectionObserver.stopObserving();
  }
}