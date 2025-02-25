import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class ImagePlugin extends BasePlugin {
  constructor() {
    super('image', 'Image', 'openrte-image-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    this.insertImage();
  }
  
  private insertImage(): void {
    const url = prompt('Enter image URL:', 'https://');
    
    if (!url) return;
    
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