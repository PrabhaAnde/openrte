import { BasePlugin } from './base-plugin';
import { Editor } from '../core/editor';
import { IconName } from '../ui/icon';
import { PluginModelAdapter } from '../model/plugin-model-adapter';

/**
 * Interface for formatting options
 */
export interface FormattingOptions {
  /**
   * Array of tag names to check for
   */
  tagNames: string[];
  
  /**
   * Default tag to use when adding formatting
   */
  defaultTag: string;
  
  /**
   * Attribute to set for formatting (optional)
   */
  attribute?: string;
}

/**
 * Base class for text formatting plugins
 */
export abstract class FormattingPlugin extends BasePlugin {
  /**
   * Formatting options
   */
  protected formattingOptions: FormattingOptions;
  
  /**
   * Constructor
   * 
   * @param id Plugin ID
   * @param name Icon name or null
   * @param title Plugin title
   * @param buttonClass Button CSS class
   * @param formattingOptions Formatting options
   */
  constructor(
    id: string, 
    name: IconName | null, 
    title: string, 
    buttonClass: string,
    formattingOptions: FormattingOptions
  ) {
    super(id, name, title, buttonClass);
    this.formattingOptions = formattingOptions;
  }
  
  /**
   * Initialize the plugin
   * 
   * @param editor Editor instance
   */
  init(editor: Editor): void {
    super.init(editor);
    
    // Listen for both standard selection change and our custom event
    document.addEventListener('selectionchange', this.updateButtonState);
    
    // Listen for our custom selectionupdate event that gets triggered after mouseup
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateButtonState);
    }
    
    // Listen for editor events
    if (this.eventBus) {
      this.eventBus.on('editor:selectionchange', this.updateButtonState);
      this.eventBus.on('editor:selectionupdate', this.updateButtonState);
      this.eventBus.on('editor:modelselectionchange', this.updateButtonState);
      this.eventBus.on('editor:modelrendered', this.updateButtonState);
    }
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    
    // Use the toggleFormatting method from SelectionManager
    selectionManager.toggleFormatting(
      this.formattingOptions.tagNames,
      this.formattingOptions.defaultTag
    );
    
    // Update button state after execution
    this.updateButtonState();
  }
  
  /**
   * Update the button state based on current selection
   */
  protected updateButtonState = (): void => {
    if (!this.editor) return;
    
    let hasFormatting = false;
    
    // Try to use model if supported
    if (this.supportsDocumentModel() && typeof this.getModelAdapter === 'function') {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        const adapter = this.getModelAdapter();
        hasFormatting = adapter.getStateFromModel(model, range);
      } else {
        // Fall back to DOM-based detection
        const selectionManager = this.editor.getSelectionManager();
        hasFormatting = selectionManager.hasFormatting(this.formattingOptions.tagNames);
      }
    } else {
      // Fall back to DOM-based detection
      const selectionManager = this.editor.getSelectionManager();
      hasFormatting = selectionManager.hasFormatting(this.formattingOptions.tagNames);
    }
    
    // Update button active state
    this.button.classList.toggle('active', hasFormatting);
  };
  
  /**
   * Clean up resources
   */
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateButtonState);
    }
    
    super.destroy();
  }
}