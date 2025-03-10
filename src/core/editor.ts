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
import { HTMLSerializer, SerializerOptions } from '../model/html-serializer';
import { AdapterRegistry } from '../model/adapter-registry';
import { HistoryManager } from '../model/history-manager';
import { CollaborationClient, CollaborationConfig } from '../collaboration/collaboration-client';

/**
 * Main editor class for OpenRTE
 */
export class Editor {
  /**
   * Collaboration client
   */
  private collaborationClient: CollaborationClient | null = null;
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
  private adapterRegistry!: AdapterRegistry;
  private historyManager!: HistoryManager;

  
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

    // Initialize adapter registry
    this.adapterRegistry = new AdapterRegistry();
    
    // Initialize history manager
    this.historyManager = new HistoryManager(this.documentModel);
  }

    /**
   * Parse current content to document model
   *
   * @param options Parser options
   */
  private parseContentToModel(options?: import('../model/html-parser').ParserOptions): void {
    const html = this.contentArea.innerHTML;
    const document = HTMLParser.parseProcessedHtml(html, this.documentModel, options);
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
    
    // Handle undo/redo keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        // Ctrl+Z or Cmd+Z for undo
        event.preventDefault();
        this.undo();
        return;
      } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
        // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
        event.preventDefault();
        this.redo();
        return;
      }
    }
    
    // Add other specific editor key handling here
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
   * Get the adapter registry
   * 
   * @returns Adapter registry
   */
  getAdapterRegistry(): AdapterRegistry {
    return this.adapterRegistry;
  }
  
  /**
   * Set content with model round-trip
   *
   * This method sets content by going through the document model,
   * which ensures that the model is updated and maintains backward compatibility.
   *
   * @param html HTML content
   * @param options Options for parsing and serializing
   */
  setContentWithModel(html: string, options?: {
    parserOptions?: import('../model/html-parser').ParserOptions,
    serializerOptions?: SerializerOptions
  }): void {
    // Parse to model with enhanced options
    const document = HTMLParser.parseProcessedHtml(
      html,
      this.documentModel,
      options?.parserOptions
    );
    
    this.documentModel.setDocument(document as any);
    
    // Serialize back to HTML with options
    const serialized = HTMLSerializer.toHTML(document, options?.serializerOptions);
    
    // Set content in DOM
    this.contentArea.innerHTML = serialized;
    
    // Ensure there's at least one paragraph
    this.ensureContent();
    
    // Emit content change event
    this.pluginRegistry.emit('editor:contentchange', {
      html: serialized,
      editor: this
    });
    
    // Emit model change event
    this.pluginRegistry.emit('editor:modelchange', {
      model: this.documentModel,
      editor: this
    });
  }
  
  /**
   * Execute a plugin by name
   * 
   * @param pluginName Name of the plugin to execute
   * @param params Optional parameters for the plugin
   * @returns True if the plugin was executed
   */
  executePlugin(pluginName: string, params?: any): boolean {
    const plugin = this.pluginRegistry.getPlugin(pluginName);
    if (!plugin) return false;
    
    if (plugin.supportsDocumentModel && plugin.supportsDocumentModel()) {
      const adapter = this.adapterRegistry.getAdapter(pluginName);
      const model = this.documentModel;
      const range = this.selectionModel.toDocumentRange();
      
      // Don't apply formatting if there's no actual selection
      if (adapter && model && range) {
        // Save cursor position before operation
        const selection = window.getSelection();
        const originalRange = selection && selection.rangeCount > 0 ? 
                            selection.getRangeAt(0).cloneRange() : null;
        
        this.historyManager.startBatch();
        adapter.applyToModel(model, range, params);
        this.historyManager.endBatch();
        
        // Use a partial render if possible rather than full document render
        this.renderAffectedNodesOnly(range);
        
        // Restore cursor position
        if (originalRange) {
          try {
            selection?.removeAllRanges();
            selection?.addRange(originalRange);
            this.selectionModel.fromDOMRange(originalRange);
          } catch (e) {
            console.warn("Could not restore selection after operation:", e);
          }
        }
        
        this.pluginRegistry.emit('editor:modeloperation', {
          plugin: pluginName,
          params,
          editor: this
        });
        return true;
      }
    }
    
    plugin.execute();
    return true;
  }

  private renderAffectedNodesOnly(range: DocumentRange): void {
    // For now, still do a full render but with selection preservation
    const selection = window.getSelection();
    let savedRange = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    this.renderDocument();
    
    // Restore selection
    if (savedRange) {
      setTimeout(() => {
        try {
          selection?.removeAllRanges();
          selection?.addRange(savedRange);
        } catch (e) {
          console.warn("Could not restore selection after render:", e);
        }
      }, 0);
    }
  }
  /**
 * Render the document model to DOM
 */
  renderDocument(): void {
    // Save detailed selection information
    const selection = window.getSelection();
    let savedRange = null;
    let savedPosition = null;
    
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
      
      // Save position as HTML offset for more reliable restoration
      const content = this.contentArea.innerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(savedRange.cloneContents());
      const selectedText = tempDiv.textContent || '';
      
      // Record the container node's position relative to its siblings
      let container = savedRange.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentNode as Node;
      }
      
      // Get a path to the node
      savedPosition = {
        text: selectedText,
        offset: savedRange.startOffset,
        containerPath: this.getNodePath(container as HTMLElement)
      };
      
      console.log("Saved position before render:", savedPosition);
    }
    
    // Perform rendering
    this.renderingManager.render();
    
    // Restore selection with multiple strategies
    if (savedRange && selection) {
      // Try multiple approaches to restore cursor position
      setTimeout(() => {
        let restored = false;
        
        // First try: direct range restoration
        try {
          selection.removeAllRanges();
          selection.addRange(savedRange);
          restored = true;
        } catch (e) {
          console.log("Direct range restoration failed");
        }
        
        // Second try: node path approach
        if (!restored && savedPosition) {
          try {
            const node = this.getNodeByPath(savedPosition.containerPath);
            if (node) {
              // Look for text nodes
              const textNodes = this.getAllTextNodesIn(node);
              if (textNodes.length > 0) {
                // Place cursor at similar position
                const range = document.createRange();
                const offset = Math.min(savedPosition.offset, textNodes[0].textContent?.length || 0);
                range.setStart(textNodes[0], offset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                restored = true;
              }
            }
          } catch (e) {
            console.log("Path-based restoration failed");
          }
        }
        
        // Last resort: focus without restoring exact position
        if (!restored) {
          this.focus();
        }
      }, 10); // Slight delay to allow rendering to complete
    }
    
    this.pluginRegistry.emit('editor:modelrendered', {
      editor: this,
      stats: this.renderingManager.getRenderStats()
    });
  }
  
  // Add these helper methods to the Editor class:
  
  private getNodePath(node: HTMLElement): number[] {
    const path = [];
    let current = node;
    
    while (current !== this.contentArea && current.parentNode) {
      const parent = current.parentNode as HTMLElement;
      const children = Array.from(parent.children);
      const index = children.indexOf(current);
      if (index !== -1) {
        path.unshift(index);
      }
      current = parent;
    }
    
    return path;
  }
  
  private getNodeByPath(path: number[]): HTMLElement | null {
    let current: HTMLElement = this.contentArea;
    
    for (const index of path) {
      if (index >= 0 && index < current.children.length) {
        current = current.children[index] as HTMLElement;
      } else {
        return null;
      }
    }
    
    return current;
  }
  
  private getAllTextNodesIn(element: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
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
    
    // Register model adapter if available
    if (plugin.supportsDocumentModel && plugin.supportsDocumentModel() && 
        typeof plugin.getModelAdapter === 'function') {
      const adapter = plugin.getModelAdapter();
      if (adapter) {
        this.adapterRegistry.register(plugin.getName(), adapter);
      }
    }
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
   * @param options Parser options
   */
  setContent(html: string, options?: import('../model/html-parser').ParserOptions): void {
    // Create parser options with forced sanitize and normalize
    const parserOptions = {
      ...options,
      sanitize: true,
      normalize: true
    };
    
    // Parse to model first to ensure proper normalization
    const document = HTMLParser.parseProcessedHtml(html, this.documentModel, parserOptions);
    
    // Serialize back to HTML
    const normalized = HTMLSerializer.toHTML(document);
    
    // Set content in DOM
    this.contentArea.innerHTML = normalized;
    
    // Ensure there's at least one paragraph
    this.ensureContent();
    
    // Set the document model
    this.documentModel.setDocument(document as any);
    
    // Emit content change event
    this.pluginRegistry.emit('editor:contentchange', {
      html: normalized,
      editor: this
    });
    
    // Emit model change event
    this.pluginRegistry.emit('editor:modelchange', {
      model: this.documentModel,
      editor: this
    });
  }

  /**
   * Get the document model
   */
  getDocumentModel(): DocumentModel {
    return this.documentModel;
  }
  
  /**
   * Get the history manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }
  
  /**
   * Undo last operation
   */
  undo(): boolean {
    const result = this.historyManager.undo();
    if (result) {
      // Re-render the document
      this.renderDocument();
      
      // Emit undo event
      this.pluginRegistry.emit('editor:undo', { editor: this });
    }
    return result;
  }
  
  /**
   * Redo previously undone operation
   */
  redo(): boolean {
    const result = this.historyManager.redo();
    if (result) {
      // Re-render the document
      this.renderDocument();
      
      // Emit redo event
      this.pluginRegistry.emit('editor:redo', { editor: this });
    }
    return result;
  }
  
  /**
   * Render the document model to HTML
   *
   * @param options Serializer options
   * @returns HTML string
   */
  renderModelToHTML(options?: SerializerOptions): string {
    const document = this.documentModel.getDocument();
    return HTMLSerializer.toHTML(document, options);
  }
  
  /**
   * Enable collaboration mode
   *
   * @param config Collaboration configuration
   */
  enableCollaboration(config: CollaborationConfig): void {
    if (this.collaborationClient) {
      this.disableCollaboration();
    }
    
    this.collaborationClient = new CollaborationClient(this, config);
    this.collaborationClient.connect();
    
    // Replace history manager with collaborative one
    this.historyManager = this.collaborationClient.getHistoryManager();
    
    // Emit event
    this.pluginRegistry.emit('editor:collaboration', {
      enabled: true,
      editor: this
    });
  }
  
  /**
   * Disable collaboration mode
   */
  disableCollaboration(): void {
    if (this.collaborationClient) {
      this.collaborationClient.disconnect();
      this.collaborationClient = null;
      
      // Re-initialize history manager
      this.historyManager = new HistoryManager(this.documentModel);
      
      // Emit event
      this.pluginRegistry.emit('editor:collaboration', {
        enabled: false,
        editor: this
      });
    }
  }
  
  /**
   * Check if collaboration is enabled
   *
   * @returns True if collaboration is enabled
   */
  isCollaborationEnabled(): boolean {
    return this.collaborationClient !== null;
  }
  
  /**
   * Set a new history manager
   * This allows replacing the default with a collaborative one
   *
   * @param historyManager History manager
   */
  setHistoryManager(historyManager: HistoryManager): void {
    this.historyManager = historyManager;
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
    
    // Clear registries and managers
    this.adapterRegistry.clear();
    this.historyManager.clear();
  }
}