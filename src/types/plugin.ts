import { Editor } from '../core/editor';

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
   */
  onPluginEvent?(event: string, data: any): void;
}