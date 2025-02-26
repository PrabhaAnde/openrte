import { BasePlugin } from './base-plugin';
import { Editor } from '../core/editor';
import { IconName } from '../ui/icon';

export interface FormattingOptions {
  tagNames: string[];  // Array of tag names to check for
  defaultTag: string;  // Default tag to use when adding formatting
}

export abstract class FormattingPlugin extends BasePlugin {
  protected formattingOptions: FormattingOptions;
  
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
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('selectionchange', this.updateButtonState);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    // Use the new toggleFormatting method from SelectionManager
    selectionManager.toggleFormatting(
      this.formattingOptions.tagNames,
      this.formattingOptions.defaultTag
    );
    
    // Update button state after execution
    this.updateButtonState();
  }
  
  protected updateButtonState = (): void => {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    const hasFormatting = selectionManager.hasFormatting(this.formattingOptions.tagNames);
    this.button.classList.toggle('active', hasFormatting);
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}