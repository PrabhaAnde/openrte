import { BasePlugin } from './base-plugin';
import { Editor } from '../core/editor';
import { IconName } from '../ui/icon';

export interface FormattingOptions {
  tagNames: string[];
  defaultTag: string;
  command?: string;
  value?: string;
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
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateButtonState);
    }
  }
  
  protected executeDOMBased(): void {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range || range.collapsed) {
      console.log("No text selected, skipping formatting");
      return;
    }
    
    // Save selection to restore later
    const selection = window.getSelection();
    const savedRange = range.cloneRange();
    
    // Use the native execCommand when possible (much more reliable)
    if (this.formattingOptions.command) {
      document.execCommand(
        this.formattingOptions.command, 
        false, 
        this.formattingOptions.value || ''
      );
    } else {
      // Fall back to manual toggle if no command is available
      const hasFormatting = this.editor.getSelectionManager().hasFormatting(
        this.formattingOptions.tagNames
      );
      
      if (hasFormatting) {
        this.editor.getSelectionManager().removeFormatting(
          this.formattingOptions.tagNames
        );
      } else {
        this.editor.getSelectionManager().addFormatting(
          this.formattingOptions.defaultTag
        );
      }
    }
    
    // Restore selection and focus
    setTimeout(() => {
      try {
        selection?.removeAllRanges();
        selection?.addRange(savedRange);
        this.editor?.focus();
      } catch (e) {
        console.warn("Selection restoration failed", e);
        this.editor?.focus();
      }
    }, 0);
    
    this.updateButtonState();
  }
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    const hasFormatting = selectionManager.hasFormatting(
      this.formattingOptions.tagNames
    );
    
    this.button.classList.toggle('active', hasFormatting);
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonState);
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateButtonState);
    }
    super.destroy();
  }
}