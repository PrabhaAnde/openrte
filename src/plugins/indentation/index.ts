import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class IndentationPlugin extends BasePlugin {
  private indentButton: HTMLElement;
  private outdentButton: HTMLElement;
  
  constructor() {
    // We'll override the createToolbarControl method
    super('indentation', null, '', 'openrte-indentation-control');
    
    // Create temporary buttons (will be replaced in createToolbarControl)
    this.indentButton = document.createElement('button');
    this.outdentButton = document.createElement('button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    // This is a container plugin, indent and outdent have their own methods
  }
  
  createToolbarControl(): HTMLElement {
    // Create a container for indent buttons
    const container = document.createElement('div');
    container.className = 'openrte-indentation-container';
    container.style.display = 'flex';
    
    // Create indent button
    this.indentButton = document.createElement('button');
    this.indentButton.className = 'openrte-button openrte-indent-button';
    this.indentButton.title = 'Increase Indent';
    this.indentButton.appendChild(createIcon('decreaseIndent')); // Switched to correct icon
    this.indentButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.indent();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Create outdent button
    this.outdentButton = document.createElement('button');
    this.outdentButton.className = 'openrte-button openrte-outdent-button';
    this.outdentButton.title = 'Decrease Indent';
    this.outdentButton.appendChild(createIcon('increaseIndent')); // Switched to correct icon
    this.outdentButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.outdent();
      if (this.editor) {
        this.editor.focus();
      }
    });    
    // Add buttons to container
    container.appendChild(this.indentButton);
    container.appendChild(this.outdentButton);
    
    return container;
  }
  
  private indent(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.indentRange(range);
    });
  }
  
  private outdent(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.outdentRange(range);
    });
  }
  
  private indentRange(range: Range): void {
    if (!this.editor) return;
    
    // Find the block elements in the range
    const blocks = this.getBlocksInRange(range);
    
    blocks.forEach(block => {
      // Check if we're in a list
      if (this.isInsideList(block)) {
        this.indentListItem(block);
      } else {
        // Standard block indentation
        const currentMargin = parseInt(block.style.marginLeft || '0', 10);
        block.style.marginLeft = `${currentMargin + 40}px`;
      }
    });
  }
  
  private outdentRange(range: Range): void {
    if (!this.editor) return;
    
    // Find the block elements in the range
    const blocks = this.getBlocksInRange(range);
    
    blocks.forEach(block => {
      // Check if we're in a list
      if (this.isInsideList(block)) {
        this.outdentListItem(block);
      } else {
        // Standard block outdentation
        const currentMargin = parseInt(block.style.marginLeft || '0', 10);
        if (currentMargin > 0) {
          block.style.marginLeft = `${Math.max(0, currentMargin - 40)}px`;
        }
      }
    });
  }
  
  // Rest of the implementation remains the same...
  private indentListItem(element: HTMLElement): void {
    // Find the list item
    let listItem = element;
    while (listItem && listItem.tagName !== 'LI') {
      listItem = listItem.parentElement as HTMLElement;
    }
    
    if (!listItem) return;
    
    // Find the previous list item
    const prevItem = listItem.previousElementSibling;
    if (!prevItem || prevItem.tagName !== 'LI') return;
    
    // Check if the previous item already has a nested list
    let nestedList = Array.from(prevItem.children).find(child => 
      child.tagName === 'UL' || child.tagName === 'OL'
    ) as HTMLElement;
    
    // If no nested list exists, create one
    if (!nestedList) {
      // Create same type of list
      const parentList = listItem.parentElement;
      if (!parentList) return;
      
      nestedList = document.createElement(parentList.tagName);
      prevItem.appendChild(nestedList);
    }
    
    // Move the current list item to the nested list
    nestedList.appendChild(listItem);
  }
  
  private outdentListItem(element: HTMLElement): void {
    // Find the list item
    let listItem = element;
    while (listItem && listItem.tagName !== 'LI') {
      listItem = listItem.parentElement as HTMLElement;
    }
    
    if (!listItem) return;
    
    // Check if list item is in a nested list
    const parentList = listItem.parentElement;
    if (!parentList) return;
    
    const grandparentListItem = parentList.parentElement;
    if (!grandparentListItem || grandparentListItem.tagName !== 'LI') return;
    
    const greatGrandparentList = grandparentListItem.parentElement;
    if (!greatGrandparentList) return;
    
    // Move this list item after the grandparent list item
    greatGrandparentList.insertBefore(listItem, grandparentListItem.nextSibling);
    
    // If the nested list is now empty, remove it
    if (parentList.children.length === 0) {
      grandparentListItem.removeChild(parentList);
    }
  }
  
  private isInsideList(element: HTMLElement): boolean {
    let current = element;
    
    while (current) {
      if (current.tagName === 'UL' || current.tagName === 'OL') {
        return true;
      } else if (current === this.editor?.getContentArea()) {
        return false;
      }
      
      current = current.parentElement as HTMLElement;
    }
    
    return false;
  }
  
  private getBlocksInRange(range: Range): HTMLElement[] {
    if (!this.editor) return [];
    
    const blocks: HTMLElement[] = [];
    
    // If range is collapsed, get the closest block
    if (range.collapsed) {
      let node = range.startContainer;
      
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      // Find the closest block
      while (node && node !== this.editor.getContentArea()) {
        if (this.isBlockElement(node as HTMLElement)) {
          blocks.push(node as HTMLElement);
          break;
        }
        node = node.parentNode as Node;
      }
      
      return blocks;
    }
    
    // Get all blocks in the range
    const startNode = this.getBlockParent(range.startContainer);
    const endNode = this.getBlockParent(range.endContainer);
    
    if (startNode === endNode && startNode) {
      blocks.push(startNode);
      return blocks;
    }
    
    // Find all blocks between start and end
    if (startNode && endNode) {
      let current: HTMLElement | null = startNode;
      
      while (current && current !== endNode) {
        blocks.push(current);
        current = this.getNextBlockSibling(current);
      }
      
      blocks.push(endNode);
    }
    
    return blocks;
  }
  
  private getBlockParent(node: Node): HTMLElement | null {
    if (!this.editor) return null;
    
    let current = node;
    
    if (current.nodeType === Node.TEXT_NODE) {
      current = current.parentNode as Node;
    }
    
    while (current && current !== this.editor.getContentArea()) {
      if (this.isBlockElement(current as HTMLElement)) {
        return current as HTMLElement;
      }
      current = current.parentNode as Node;
    }
    
    return null;
  }
  
  private getNextBlockSibling(element: HTMLElement): HTMLElement | null {
    if (!element.nextElementSibling) {
      const parent = element.parentElement;
      if (!parent || parent === this.editor?.getContentArea()) {
        return null;
      }
      
      // If parent is not a block, check parent's siblings
      if (!this.isBlockElement(parent)) {
        return this.getNextBlockSibling(parent);
      }
      
      return null;
    }
    
    const next = element.nextElementSibling as HTMLElement;
    
    if (this.isBlockElement(next)) {
      return next;
    }
    
    // If next sibling is not a block, recursively check its children
    const childBlock = this.findFirstBlockChild(next);
    if (childBlock) {
      return childBlock;
    }
    
    // No block children, check next sibling
    return this.getNextBlockSibling(next);
  }
  
  private findFirstBlockChild(element: HTMLElement): HTMLElement | null {
    const children = element.children;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      
      if (this.isBlockElement(child)) {
        return child;
      }
      
      const blockChild = this.findFirstBlockChild(child);
      if (blockChild) {
        return blockChild;
      }
    }
    
    return null;
  }
  
  private isBlockElement(element: HTMLElement): boolean {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'];
    return blockTags.includes(element.tagName);
  }
  
  destroy(): void {
    super.destroy();
  }
}