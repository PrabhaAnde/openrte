import { Plugin } from '../types/plugin';
import { Editor } from '../core/editor';
import { EventBus } from '../core/event-bus';
import { IconName, createIcon } from '../ui/icon';
import { PluginModelAdapter } from '../model/plugin-model-adapter';

/**
 * Base implementation of the Plugin interface
 */
export abstract class BasePlugin implements Plugin {
  /**
   * Reference to the editor instance
   */
  protected editor: Editor | null = null;
  
  /**
   * Reference to the event bus
   */
  protected eventBus: EventBus | null = null;
  
  /**
   * The toolbar button element
   */
  protected button: HTMLElement;
  
  /**
   * Constructor
   * 
   * @param name The unique name of the plugin
   * @param iconName The icon name (if any)
   * @param label The display label for the plugin
   * @param className Additional CSS class name(s)
   */
  constructor(
    private readonly name: string,
    private readonly iconName: IconName | null,
    private readonly label: string,
    private readonly className: string = ''
  ) {
    // Create toolbar button
    this.button = document.createElement('button');
    
    // If an icon is specified, use it; otherwise, use text label
    if (iconName) {
      const iconElement = createIcon(iconName);
      this.button.appendChild(iconElement);
      // Add aria-label for accessibility
      this.button.setAttribute('aria-label', label);
      // Add title for tooltip
      this.button.title = label;
    } else {
      this.button.textContent = this.label;
    }
    
    // Add CSS classes
    this.button.className = `openrte-button ${this.className}`.trim();
    
    // Add click handler
    this.button.addEventListener('click', this.handleClick.bind(this));
  }
  
  /**
   * Get the unique name of the plugin
   * 
   * @returns The plugin name
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Initialize the plugin with the editor instance
   * 
   * @param editor The editor instance
   */
  init(editor: Editor): void {
    this.editor = editor;
    this.eventBus = editor.getPluginRegistry().getEventBus();
    
    // Subscribe to events
    if (this.eventBus && this.onPluginEvent) {
      this.eventBus.on('plugin:event', this.handlePluginEvent.bind(this));
      
      // Subscribe to events specifically for this plugin
      const pluginEventPrefix = `plugin:${this.getName()}:`;
      this.eventBus.on(pluginEventPrefix + '*', (data) => {
        if (this.onPluginEvent) {
          // Extract the event name after the prefix
          const eventName = data.event.substring(pluginEventPrefix.length);
          this.onPluginEvent(eventName, data.data);
        }
      });
    }
    
    // Emit initialization event
    this.emitEvent('init', { plugin: this });
  }
  
  /**
   * Create and return a toolbar control element
   * 
   * @returns HTMLElement for the toolbar
   */
  createToolbarControl(): HTMLElement {
    return this.button;
  }
  
  /**
   * Handle button click
   * 
   * @param event Mouse event
   */
  protected handleClick(event: MouseEvent): void {
    event.preventDefault();
    this.execute();
    
    // Focus back on the editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  /**
   * Handle plugin events
   * 
   * @param data Event data
   */
  protected handlePluginEvent(data: any): void {
    if (this.onPluginEvent) {
      this.onPluginEvent(data.event, data.data);
    }
  }
  
  /**
   * Emit a plugin-specific event
   * 
   * @param event The event name
   * @param data The event data
   */
  protected emitEvent(event: string, data: any): void {
    if (this.eventBus) {
      this.eventBus.emit(`plugin:${this.getName()}:${event}`, data);
    }
  }
  
  /**
   * Indicates if this plugin supports the document model
   * 
   * @returns True if this plugin supports the document model
   */
  supportsDocumentModel(): boolean {
    return typeof this.getModelAdapter === 'function';
  }
  
  /**
   * Execute the plugin's primary action
   * 
   * This implementation checks for model support and falls back to DOM-based
   * execution if model is not supported.
   */
  execute(): void {
    if (!this.editor) return;
    
    // Don't try to use the model for formatting operations anymore
    // Always use DOM-based approach which is more reliable
    this.executeDOMBased();
    this.emitEvent('execute', { plugin: this });
    
    // Focus the editor afterward
    setTimeout(() => {
      this.editor?.focus();
    }, 0);
  }
  
  /**
   * DOM-based execution for backward compatibility
   * 
   * This must be implemented by each plugin to provide the DOM-based
   * implementation of the plugin's action.
   */
  protected abstract executeDOMBased(): void;
  
  /**
   * Gets the model adapter for this plugin
   * 
   * May be overridden by plugins that support the document model
   * 
   * @returns The model adapter for this plugin
   */
  getModelAdapter?(): PluginModelAdapter;
  
  /**
   * Clean up any resources
   */
  destroy(): void {
    // Unsubscribe from events
    if (this.eventBus && this.onPluginEvent) {
      this.eventBus.off('plugin:event', this.handlePluginEvent.bind(this));
      
      // Unsubscribe from plugin-specific events
      const pluginEventPrefix = `plugin:${this.getName()}:`;
      // (Implementation would depend on how event bus handles wildcard events)
    }
    
    // Remove event listeners
    this.button.removeEventListener('click', this.handleClick.bind(this));
    
    // Emit destruction event
    this.emitEvent('destroy', { plugin: this });
    
    // Clear references
    this.editor = null;
    this.eventBus = null;
  }
  
  /**
   * Handle plugin events
   * 
   * @param event The event name
   * @param data The event data
   */
  onPluginEvent?(event: string, data: any): void;
}