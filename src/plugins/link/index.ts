import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class LinkPlugin extends BasePlugin {
  constructor() {
    super('link', 'link', 'Insert Link', 'openrte-link-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('selectionchange', this.updateButtonState);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    // Clear any existing content and add the icon
    button.innerHTML = '';
    button.appendChild(createIcon('link'));
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
    
    // Implement link insertion logic
    const url = prompt('Enter URL:');
    if (url) {
      const selectionManager = this.editor.getSelectionManager();
      selectionManager.applyToSelection(range => this.createLink(range, url));
    }
  }
  
  private updateButtonState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      const isLink = this.isSelectionLink(range);
      this.button.classList.toggle('active', isLink);
    }
  };
  
  private isSelectionLink(range: Range): boolean {
    if (!this.editor) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Check if text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check for link tag
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'A') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }
  
  private createLink(range: Range, url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank'; // Open in new tab
    
    try {
      range.surroundContents(link);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      link.appendChild(fragment);
      range.insertNode(link);
    }
    
    // Focus editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  private editLink(range: Range): void {
    if (!this.editor) return;
    
    // Find the link element
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    let linkNode: HTMLAnchorElement | null = null;
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'A') {
        linkNode = node as HTMLAnchorElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (!linkNode) return;
    
    // Get the current URL
    const currentUrl = linkNode.href;
    
    // Prompt for new URL
    const newUrl = prompt('Edit URL:', currentUrl);
    
    if (newUrl === null) return; // Cancelled
    
    if (newUrl === '') {
      // Remove link if URL is empty
      this.removeLink(linkNode);
    } else {
      // Update URL
      linkNode.href = newUrl;
    }
    
    // Focus editor
    this.editor.focus();
  }
  
  private removeLink(linkNode: HTMLAnchorElement): void {
    const parent = linkNode.parentNode;
    if (!parent) return;
    
    // Unwrap the link (keep contents)
    while (linkNode.firstChild) {
      parent.insertBefore(linkNode.firstChild, linkNode);
    }
    parent.removeChild(linkNode);
  }
  
  destroy(): void {
    // document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('selectionchange', this.updateButtonState);
    super.destroy();
  }
}