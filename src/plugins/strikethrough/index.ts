import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class StrikethroughPlugin extends BasePlugin {
  constructor() {
    super('strikethrough', 'S', 'openrte-strikethrough-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update button state
    document.addEventListener('selectionchange', this.updateButtonState);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(this.applyStrikethrough.bind(this));
  }
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      const isStrikethrough = this.isSelectionStrikethrough(range);
      this.button.classList.toggle('active', isStrikethrough);
    }
  };
  
  private isSelectionStrikethrough(range: Range): boolean {
    if (!this.editor) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for strikethrough tags
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'S' || node.nodeName === 'STRIKE' || node.nodeName === 'DEL') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }  
  private applyStrikethrough(range: Range): void {
    if (!this.editor) return;
    
    // Check if already strikethrough
    if (this.isSelectionStrikethrough(range)) {
      this.removeStrikethrough(range);
    } else {
      this.addStrikethrough(range);
    }
  }
  
  private addStrikethrough(range: Range): void {
    const s = document.createElement('s');
    
    try {
      range.surroundContents(s);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      s.appendChild(fragment);
      range.insertNode(s);
    }
  }
  
  private removeStrikethrough(range: Range): void {
    if (!this.editor) return;
    
    // Find the strikethrough element
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let strikeNode: Node | null = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node instanceof Element && (node.nodeName === 'S' || node.nodeName === 'STRIKE' || node.nodeName === 'DEL')) {
        strikeNode = node;
        break;
      }
      node = node.parentNode;
    }
    
    if (strikeNode instanceof Element) {
      // Unwrap the strikethrough element
      const parent = strikeNode.parentNode;
      if (parent) {
        while (strikeNode.firstChild) {
          parent.insertBefore(strikeNode.firstChild, strikeNode);
        }
        parent.removeChild(strikeNode);
      }
    }
  }  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}