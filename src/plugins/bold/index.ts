import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class BoldPlugin extends BasePlugin {
  constructor() {
    super('bold', 'B', 'openrte-bold-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    // Add keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Add selection change listener to update button state
    document.addEventListener('selectionchange', this.updateButtonState);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(this.applyBold.bind(this));
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+B / Cmd+B
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.execute();
    }
  };
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      const isBold = this.isSelectionBold(range);
      this.button.classList.toggle('active', isBold);
    }
  };
  
  private isSelectionBold(range: Range): boolean {
    if (!this.editor) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for bold tags
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'B' || node.nodeName === 'STRONG') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }  
  private applyBold(range: Range): void {
    if (!this.editor) return;
    
    // Check if already bold
    if (this.isSelectionBold(range)) {
      this.removeBold(range);
    } else {
      this.addBold(range);
    }
  }
  
  private addBold(range: Range): void {
    const strong = document.createElement('strong');
    
    try {
      range.surroundContents(strong);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      strong.appendChild(fragment);
      range.insertNode(strong);
    }
  }
  
  private removeBold(range: Range): void {
    if (!this.editor) return;
    
    // Find the bold element
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let boldNode: Node | null = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'B' || node.nodeName === 'STRONG') {
        boldNode = node;
        break;
      }
      node = node.parentNode as Node;
    }
    
    if (boldNode) {
      // Unwrap the bold element
      const parent = boldNode.parentNode;
      if (parent) {
        while (boldNode.firstChild) {
          parent.insertBefore(boldNode.firstChild, boldNode);
        }
        parent.removeChild(boldNode);
      }
    }
  }  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}