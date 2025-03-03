import { Editor } from '../core/editor';
import { PluginModelAdapter } from '../model/plugin-model-adapter';

/**
 * Plugin interface for OpenRTE
 */
export interface Plugin {
  /**
   * Get the unique name of the plugin
   * 
   * @returns The plugin name
   */
  getName(): string;
  
  /**
   * Initialize the plugin with the editor instance
   * 
   * @param editor The editor instance
   */
  init(editor: Editor): void;
  
  /**
   * Create and return a toolbar control element
   * 
   * @returns HTMLElement for the toolbar
   */
  createToolbarControl(): HTMLElement;
  
  /**
   * Execute the plugin's primary action
   * 
   * In hybrid mode, this method should determine whether to use
   * model-based or DOM-based execution based on availability
   */
  execute(): void;
  
  /**
   * Clean up any resources
   */
  destroy(): void;
  
  /**
   * Handle plugin events
   * 
   * @param event The event name
   * @param data The event data
   * @optional
   */
  onPluginEvent?(event: string, data: any): void;
  
  /**
   * Gets the model adapter for this plugin
   * 
   * @returns The model adapter or undefined if not supported
   * @optional
   */
  getModelAdapter?(): PluginModelAdapter;
  
  /**
   * Indicates if this plugin supports the document model
   * 
   * @returns True if this plugin supports the document model
   * @optional
   */
  supportsDocumentModel?(): boolean;
}