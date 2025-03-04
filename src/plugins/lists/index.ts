import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { ListsModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentRange } from '../../model/selection-interfaces';

type ListType = 'ol' | 'ul';

export class ListsPlugin extends BasePlugin {
  private listButtons: Map<ListType, HTMLElement> = new Map();
  private modelAdapter: ListsModelAdapter;
  
  constructor() {
    super('lists', null, 'Lists', 'openrte-lists-control');
    this.modelAdapter = new ListsModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update button states
    document.addEventListener('selectionchange', this.updateButtonStates);
    
    // Add keydown listener for Enter key in lists
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  execute(): void {
    // This is a container plugin, individual list types have their own execute
  }
  
  createToolbarControl(): HTMLElement {
    // Create a container for list buttons
    const container = document.createElement('div');
    container.className = 'openrte-lists-container';
    container.style.display = 'flex';
    
    // Create buttons for each list type
    this.createListButton('ol', container);
    this.createListButton('ul', container);
    
    return container;
  }
  
  private createListButton(type: ListType, container: HTMLElement): void {
    const button = document.createElement('button');
    button.className = `openrte-button openrte-${type}-button`;
    button.title = type === 'ol' ? 'Ordered List' : 'Unordered List';
    
    // Use SVG icons instead of text characters
    const iconName = type === 'ol' ? 'orderedList' : 'unorderedList';
    button.appendChild(createIcon(iconName));
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleList(type);
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Add button to the container
    container.appendChild(button);
    
    // Store button reference
    this.listButtons.set(type, button);
  }
  
  private toggleList(type: ListType): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.toggleListForRange(range, type);
    });
    
    // Update button states
    this.updateButtonStates();
  }
  
  private toggleListForRange(range: Range, listType: ListType): void {
    if (!this.editor) return;
    
    // Find if we're already in a list
    let node = range.commonAncestorContainer;
    let inList = false;
    let listElement: HTMLElement | null = null;
    let currentListType: ListType | null = null;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    // Check if we're in a list
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'UL') {
        inList = true;
        listElement = node as HTMLElement;
        currentListType = 'ul';
        break;
      } else if (node.nodeName === 'OL') {
        inList = true;
        listElement = node as HTMLElement;
        currentListType = 'ol';
        break;
      }
      node = node.parentNode as Node;
    }
    
    if (inList && listElement) {
      if (currentListType === listType) {
        // Already in this list type, convert to paragraphs
        this.convertListToParagraphs(listElement);
      } else {
        // Convert list type
        this.changeListType(listElement, listType);
      }
    } else {
      // Not in a list, create new list
      this.createNewList(range, listType);
    }
  }
  
  private convertListToParagraphs(listElement: HTMLElement): void {
    if (!listElement.parentNode) return;
    
    const fragment = document.createDocumentFragment();
    const items = listElement.querySelectorAll('li');
    
    items.forEach(item => {
      const p = document.createElement('p');
      p.innerHTML = item.innerHTML;
      fragment.appendChild(p);
    });
    
    // Replace the list with paragraphs
    listElement.parentNode.replaceChild(fragment, listElement);
  }
  
  private changeListType(listElement: HTMLElement, newType: ListType): void {
    const newList = document.createElement(newType);
    const items = listElement.querySelectorAll('li');
    
    // Clone all list items to the new list
    items.forEach(item => {
      newList.appendChild(item.cloneNode(true));
    });
    
    // Replace the old list with the new one
    if (listElement.parentNode) {
      listElement.parentNode.replaceChild(newList, listElement);
    }
  }
  
  private createNewList(range: Range, listType: ListType): void {
    const list = document.createElement(listType);
    
    // Get the blocks that are in the selection
    const blocks = this.getBlocksInRange(range);
    
    if (blocks.length > 0) {
      // Convert blocks to list items
      blocks.forEach(block => {
        const li = document.createElement('li');
        li.innerHTML = block.innerHTML;
        list.appendChild(li);
        
        // Remove the original block
        if (block.parentNode) {
          block.parentNode.removeChild(block);
        }
      });
      
      // Insert the list at the beginning of the range
      range.insertNode(list);
    } else {
      // No blocks found, create a new list item
      const li = document.createElement('li');
      li.innerHTML = range.toString() || '&nbsp;';
      list.appendChild(li);
      
      // Delete the selection contents and insert the list
      range.deleteContents();
      range.insertNode(list);
      
      // Position cursor in the list item
      const selection = window.getSelection();
      if (selection) {
        const newRange = document.createRange();
        newRange.setStart(li, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
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
    const clonedRange = range.cloneRange();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(clonedRange.cloneContents());
    
    // Find all blocks
    const blockElements = tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote');
    blockElements.forEach(block => {
      blocks.push(block as HTMLElement);
    });
    
    // If no blocks found and there's text, find the containing block
    if (blocks.length === 0 && tempDiv.textContent?.trim()) {
      let node = range.commonAncestorContainer;
      
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
    }
    
    return blocks;
  }
  
  private isBlockElement(element: HTMLElement): boolean {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'];
    return blockTags.includes(element.tagName);
  }
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Check if we're in a list
    let node = range.commonAncestorContainer;
    let inOl = false;
    let inUl = false;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    // Check ancestors for lists
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'UL') {
        inUl = true;
        break;
      } else if (node.nodeName === 'OL') {
        inOl = true;
        break;
      }
      node = node.parentNode as Node;
    }
    
    // Update button states
    const olButton = this.listButtons.get('ol');
    const ulButton = this.listButtons.get('ul');
    
    if (olButton) {
      olButton.classList.toggle('active', inOl);
    }
    
    if (ulButton) {
      ulButton.classList.toggle('active', inUl);
    }
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.editor) return;
    
    // Check if we're in a list item
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Only handle Enter key
    if (event.key !== 'Enter') return;
    
    let node = range.startContainer;
    let inList = false;
    let inListItem = false;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    // Check if we're in a list item
    while (node && node !== this.editor.getContentArea()) {
      if (node.nodeName === 'LI') {
        inListItem = true;
      }
      
      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        inList = true;
        break;
      }
      
      node = node.parentNode as Node;
    }
    
    // Special handling for empty list items
    if (inList && inListItem) {
      let listItem = null;
      
      // Find the list item
      node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      while (node && node.nodeName !== 'LI') {
        node = node.parentNode as Node;
      }
      
      listItem = node;
      
      // Check if list item is empty
      if (listItem && listItem.textContent?.trim() === '') {
        event.preventDefault();
        
        // Find the parent list
        let parentList = listItem.parentNode;
        if (parentList && (parentList.nodeName === 'UL' || parentList.nodeName === 'OL')) {
          // Create a new paragraph after the list
          const p = document.createElement('p');
          p.innerHTML = '&nbsp;';
          
          if (parentList.nextSibling) {
            parentList.parentNode?.insertBefore(p, parentList.nextSibling);
          } else {
            parentList.parentNode?.appendChild(p);
          }
          
          // Remove the empty list item
          parentList.removeChild(listItem);
          
          // If the list is now empty, remove it
          if (parentList.childNodes.length === 0) {
            parentList.parentNode?.removeChild(parentList);
          }
          
          // Set cursor to the new paragraph
          const selection = window.getSelection();
          if (selection) {
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    // This is a container plugin, individual list types have their own execute
    // For DOM-based execution, we'll toggle the unordered list by default
    this.toggleList('ul');
  }
  
  /**
   * Return the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonStates);
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}