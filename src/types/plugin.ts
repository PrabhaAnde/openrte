import { Editor } from '../core/editor';

export interface Plugin {
  // Unique identifier for the plugin
  getName(): string;
  
  // Initialize with the editor instance
  init(editor: Editor): void;
  
  // Create and return a toolbar control element
  createToolbarControl(): HTMLElement;
  
  // Execute the plugin's primary action
  execute(): void;
  
  // Clean up any resources
  destroy(): void;
}