import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class HorizontalRulePlugin extends BasePlugin {
  constructor() {
    super('horizontalRule', 'HR', 'openrte-hr-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    this.insertHorizontalRule();
  }
  
  private insertHorizontalRule(): void {
    const hr = document.createElement('hr');
    
    // Style the HR
    hr.style.border = 'none';
    hr.style.borderTop = '1px solid #ccc';
    hr.style.height = '1px';
    hr.style.margin = '10px 0';
    
    // Get selection
    const selectionManager = this.editor?.getSelectionManager();
    const range = selectionManager?.getRange();
    
    if (range) {
      // Insert the horizontal rule
      range.deleteContents();
      range.insertNode(hr);
      
      // Add paragraph after hr if needed
      const nextSibling = hr.nextSibling;
      if (!nextSibling || 
          (nextSibling.nodeType === Node.ELEMENT_NODE && 
           (nextSibling as HTMLElement).tagName !== 'P')) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        
        if (nextSibling) {
          hr.parentNode?.insertBefore(p, nextSibling);
        } else {
          hr.parentNode?.appendChild(p);
        }
        
        // Move cursor to the new paragraph
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Move cursor after the horizontal rule
        const newRange = document.createRange();
        newRange.setStartAfter(hr);
        newRange.collapse(true);
        
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
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