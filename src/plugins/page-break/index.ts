import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class PageBreakPlugin extends BasePlugin {
  constructor() {
    super('pageBreak', 'pageBreak', 'Page Break', 'openrte-page-break-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    if (!this.editor) return;
    
    this.insertPageBreak();
  }
  
  private insertPageBreak(): void {
    // Create a div for the page break
    const pageBreak = document.createElement('div');
    pageBreak.className = 'openrte-page-break';
    pageBreak.setAttribute('data-type', 'page-break');
    
    // Style the page break
    pageBreak.style.pageBreakAfter = 'always';
    pageBreak.style.breakAfter = 'page';
    pageBreak.style.height = '0';
    pageBreak.style.borderTop = '1px dashed #bbb';
    pageBreak.style.margin = '15px 0';
    pageBreak.style.width = '100%';
    
    // Add a label
    const label = document.createElement('span');
    label.textContent = 'Page Break';
    label.style.display = 'block';
    label.style.textAlign = 'center';
    label.style.fontSize = '12px';
    label.style.color = '#999';
    label.style.marginTop = '-10px';
    label.style.background = 'white';
    label.style.width = '70px';
    label.style.margin = '-10px auto 0';
    
    pageBreak.appendChild(label);
    
    // Get selection
    const selectionManager = this.editor?.getSelectionManager();
    const range = selectionManager?.getRange();
    
    if (range) {
      // Insert the page break
      range.deleteContents();
      range.insertNode(pageBreak);
      
      // Add paragraph after page break if needed
      const nextSibling = pageBreak.nextSibling;
      if (!nextSibling || 
          (nextSibling.nodeType === Node.ELEMENT_NODE && 
           (nextSibling as HTMLElement).tagName !== 'P')) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        
        if (nextSibling) {
          pageBreak.parentNode?.insertBefore(p, nextSibling);
        } else {
          pageBreak.parentNode?.appendChild(p);
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
        // Move cursor after the page break
        const newRange = document.createRange();
        newRange.setStartAfter(pageBreak);
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