import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class ImagePlugin extends BasePlugin {
  constructor() {
    super('image', 'image', 'Insert Image', 'openrte-image-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    // Clear any existing content and add the icon
    button.innerHTML = '';
    button.appendChild(createIcon('image'));
    return button;
  }
  
  execute(): void {
    super.execute();
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    if (!this.editor) return;
    
    // Image insertion implementation
    const url = prompt('Enter image URL:');
    if (url) {
      this.insertImage(url);
    }
  }
  
  private insertImage(url: string): void {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Image';
    img.style.maxWidth = '100%';
    
    // Get selection
    const selectionManager = this.editor?.getSelectionManager();
    const range = selectionManager?.getRange();
    
    if (range) {
      // Insert the image
      range.deleteContents();
      range.insertNode(img);
      
      // Move cursor after the image
      const newRange = document.createRange();
      newRange.setStartAfter(img);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    
    // Focus editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  destroy(): void {
    super.destroy();
  }
}