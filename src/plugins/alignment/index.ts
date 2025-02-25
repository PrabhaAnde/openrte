import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

type AlignType = 'left' | 'center' | 'right' | 'justify';

export class AlignmentPlugin extends BasePlugin {
  private alignButtons: Map<AlignType, HTMLElement> = new Map();
  private currentAlignment: AlignType = 'left';

  constructor() {
    // We'll override the createToolbarControl method, so we use an empty label here
    super('alignment', '', 'openrte-alignment-control');
  }

  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update button states
    document.addEventListener('selectionchange', this.updateButtonStates);
  }

  execute(): void {
    // This is a container plugin, so the main execute is not used
    // Instead, each alignment type has its own execute method
  }

  createToolbarControl(): HTMLElement {
    // Create a container for alignment buttons
    const container = document.createElement('div');
    container.className = 'openrte-alignment-container';
    container.style.display = 'flex';
    
    // Create buttons for each alignment type
    this.createAlignButton('left', container);
    this.createAlignButton('center', container);
    this.createAlignButton('right', container);
    this.createAlignButton('justify', container);
    
    return container;
  }
  
  private createAlignButton(type: AlignType, container: HTMLElement): void {
    const button = document.createElement('button');
    button.className = `openrte-button openrte-align-${type}-button`;
    button.title = `Align ${type}`;
    
    // Set the icon/text for the button
    switch (type) {
      case 'left':
        button.innerHTML = '&#8676;'; // Left align icon
        break;
      case 'center':
        button.innerHTML = '&#8677;'; // Center align icon
        break;
      case 'right':
        button.innerHTML = '&#8678;'; // Right align icon
        break;
      case 'justify':
        button.innerHTML = '&#8679;'; // Justify icon
        break;
    }
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.applyAlignment(type);
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Add button to the container
    container.appendChild(button);
    
    // Store button reference
    this.alignButtons.set(type, button);
  }
  
  private applyAlignment(type: AlignType): void {
    if (!this.editor) return;
    
    this.currentAlignment = type;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.applyAlignmentToRange(range, type);
    });
    
    // Update button states
    this.updateButtonStates();
  }
  
  private applyAlignmentToRange(range: Range, alignment: AlignType): void {
    if (!this.editor) return;
    
    // Find the block element containing the selection
    let node: Node | null = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Find the closest block-level element
    const blockElement = this.findBlockElement(node as HTMLElement);
    
    if (blockElement) {
      // Apply alignment
      blockElement.style.textAlign = alignment;
    } else {
      // If no block element, wrap the selection in a div with alignment
      const div = document.createElement('div');
      div.style.textAlign = alignment;
      
      try {
        // Try to surround the selection with a div
        range.surroundContents(div);
      } catch (e) {
        // Handle more complex selections
        const fragment = range.extractContents();
        div.appendChild(fragment);
        range.insertNode(div);
      }
    }
  }
  
  private findBlockElement(element: HTMLElement): HTMLElement | null {
    if (!this.editor) return null;
    
    let current: HTMLElement | null = element;
    
    while (current && current !== this.editor.getContentArea()) {
      const display = window.getComputedStyle(current).display;
      
      // Check if it's a block-level element
      if (display === 'block' || display === 'flex' || display === 'grid' ||
          current.tagName === 'P' || 
          current.tagName === 'DIV' || 
          current.tagName === 'H1' || 
          current.tagName === 'H2' || 
          current.tagName === 'H3' || 
          current.tagName === 'H4' || 
          current.tagName === 'H5' || 
          current.tagName === 'H6' || 
          current.tagName === 'BLOCKQUOTE') {
        return current;
      }
      
      current = current.parentElement;
    }
    
    return null;
  }
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current alignment
    let currentAlignment: AlignType = 'left'; // Default
    
    // Find the block element
    let node: Node | null = range.commonAncestorContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    const blockElement = this.findBlockElement(node as HTMLElement);
    
    if (blockElement) {
      const textAlign = blockElement.style.textAlign || 
                       window.getComputedStyle(blockElement).textAlign;
      
      if (textAlign === 'left' || textAlign === 'center' || 
          textAlign === 'right' || textAlign === 'justify') {
        currentAlignment = textAlign as AlignType;
      }
    }
    
    // Update button states
    this.alignButtons.forEach((button, type) => {
      button.classList.toggle('active', type === currentAlignment);
    });
  }
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonStates);
    super.destroy();
  }
}