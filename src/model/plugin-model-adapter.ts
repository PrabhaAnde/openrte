import { DocumentModel } from './document-model';
import { DocumentRange } from './selection-interfaces';

/**
 * Interface for plugin model adapters
 * 
 * Provides a way for plugins to interact with the document model
 * while maintaining backward compatibility with DOM-based operations.
 */
export interface PluginModelAdapter {
  /**
   * Apply a plugin operation to the document model
   * 
   * @param model The document model to apply changes to
   * @param range The document range to apply changes to
   * @param params Optional parameters for the operation
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange, 
    params?: any
  ): void;
  
  /**
   * Get the current state from the document model
   * 
   * Used to determine the state of the plugin's UI controls
   * (e.g., whether a button should be active)
   * 
   * @param model The document model to check
   * @param range The current selection range
   * @returns State object for the plugin
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): any;
}