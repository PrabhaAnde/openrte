import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class UnderlinePlugin extends BasePlugin {
  constructor() {
    super('underline', 'U', 'openrte-underline-button');
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
    selectionManager.applyToSelection(this.applyUnderline.bind(this));
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+U / Cmd+U
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      this.execute();
    }
  };
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      const isUnderline = this.isSelectionUnderline(range);
      this.button.classList.toggle('active', isUnderline);
    }
  };
  
  private isSelectionUnderline(range: Range): boolean {
    if (!this.editor) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for underline tags
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'U') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }  
  private applyUnderline(range: Range): void {
    if (!this.editor) return;
    
    // Check if already underline
    if (this.isSelectionUnderline(range)) {
      this.removeUnderline(range);
    } else {
      this.addUnderline(range);
    }
  }
  
  private addUnderline(range: Range): void {
    const u = document.createElement('u');
    
    try {
      range.surroundContents(u);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      u.appendChild(fragment);
      range.insertNode(u);
    }
  }
  
  private removeUnderline(range: Range): void {
    if (!this.editor) return;
    
    // Find the underline element
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let underlineNode: Node | null = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'U') {
        underlineNode = node;
        break;
      }
      node = node.parentNode;
    }
    
    if (underlineNode) {
      // Unwrap the underline element
      const parent = underlineNode.parentNode;
      if (parent) {
        while (underlineNode.firstChild) {
          parent.insertBefore(underlineNode.firstChild, underlineNode);
        }
        parent.removeChild(underlineNode);
      }
    }
  }  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}