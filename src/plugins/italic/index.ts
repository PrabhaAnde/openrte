import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class ItalicPlugin extends BasePlugin {
  constructor() {
    super('italic', 'I', 'openrte-italic-button');
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
    selectionManager.applyToSelection(this.applyItalic.bind(this));
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+I / Cmd+I
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.execute();
    }
  };
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      const isItalic = this.isSelectionItalic(range);
      this.button.classList.toggle('active', isItalic);
    }
  };
  
  private isSelectionItalic(range: Range): boolean {
    if (!this.editor) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for italic tags
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'I' || node.nodeName === 'EM') {
        return true;
      }
      node = node.parentNode as Node | null;
    }
    
    return false;
  }  
  private applyItalic(range: Range): void {
    if (!this.editor) return;
    
    // Check if already italic
    if (this.isSelectionItalic(range)) {
      this.removeItalic(range);
    } else {
      this.addItalic(range);
    }
  }
  
  private addItalic(range: Range): void {
    const em = document.createElement('em');
    
    try {
      range.surroundContents(em);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      em.appendChild(fragment);
      range.insertNode(em);
    }
  }
  
  private removeItalic(range: Range): void {
    if (!this.editor) return;
    
    // Find the italic element
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let italicNode: Node | null = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'I' || node.nodeName === 'EM') {
        italicNode = node;
        break;
      }
      node = node.parentNode as Node | null;
    }
    
    if (italicNode) {
      // Unwrap the italic element
      const parent = italicNode.parentNode;
      if (parent) {
        while (italicNode.firstChild) {
          parent.insertBefore(italicNode.firstChild, italicNode);
        }
        parent.removeChild(italicNode);
      }
    }
  }  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}