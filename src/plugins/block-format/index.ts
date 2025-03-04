import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { BlockFormatModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

interface FormatOption {
  tag: string;
  label: string;
}

export class BlockFormatPlugin extends BasePlugin {
  private formatDropdown: HTMLSelectElement;
  private modelAdapter: BlockFormatModelAdapter;
  private options: FormatOption[] = [
    { tag: 'p', label: 'Paragraph' },
    { tag: 'h1', label: 'Heading 1' },
    { tag: 'h2', label: 'Heading 2' },
    { tag: 'h3', label: 'Heading 3' },
    { tag: 'h4', label: 'Heading 4' },
    { tag: 'h5', label: 'Heading 5' },
    { tag: 'h6', label: 'Heading 6' },
    { tag: 'blockquote', label: 'Blockquote' }
  ];
  
  constructor() {
    // super('blockFormat', '', 'openrte-block-format-control');
    super('blockFormat', null, 'Block Format', 'openrte-block-format-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.formatDropdown = document.createElement('select');
    
    // Initialize model adapter
    this.modelAdapter = new BlockFormatModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update dropdown
    document.addEventListener('selectionchange', this.updateDropdownState);
  }
  
  execute(): void {
    // The dropdown handles execution directly
  }
  
  createToolbarControl(): HTMLElement {
    // Create dropdown
    this.formatDropdown = document.createElement('select');
    this.formatDropdown.className = 'openrte-format-dropdown';
    
    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.text = 'Format';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    this.formatDropdown.add(placeholderOption);
    
    // Add format options
    this.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.tag;
      optionElement.text = option.label;
      this.formatDropdown.add(optionElement);
    });
    
    // Add change handler
    this.formatDropdown.addEventListener('change', this.handleFormatChange);
    
    return this.formatDropdown;
  }
  
  private handleFormatChange = (event: Event): void => {
    event.preventDefault();
    
    if (!this.editor) return;
    
    const dropdown = event.target as HTMLSelectElement;
    const selectedTag = dropdown.value;
    
    if (!selectedTag) return;
    
    this.applyFormat(selectedTag);
    
    // Reset dropdown
    dropdown.selectedIndex = 0;
    
    // Focus editor
    this.editor.focus();
  };
  
  /**
   * Return the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * DOM-based execution (for backward compatibility)
   */
  protected executeDOMBased(format?: string, level?: number): void {
    if (!this.editor) return;
    
    // If format is provided, use it; otherwise, get from dropdown
    const selectedFormat = format || this.formatDropdown.value;
    
    if (!selectedFormat) return;
    
    this.applyFormat(selectedFormat);
  }
  
  private applyFormat(tag: string): void {
    if (!this.editor) return;
    
    // Check if we can use the model adapter
    if (this.supportsDocumentModel() && this.editor.getDocumentModel() && this.editor.getDocumentRange()) {
      // Model-based execution is handled by the base class execute() method
      this.execute();
    } else {
      // DOM-based execution
      const selectionManager = this.editor.getSelectionManager();
      selectionManager.applyToSelection(range => {
        this.applyFormatToRange(range, tag);
      });
    }
    
    // Update dropdown state
    this.updateDropdownState();
  }
  
  private applyFormatToRange(range: Range, tag: string): void {
    if (!this.editor) return;
    
    // Find blocks in range
    const blocks = this.getBlocksInRange(range);
    
    if (blocks.length > 0) {
      // Apply format to each block
      blocks.forEach(block => {
        this.replaceWithTag(block, tag);
      });
    } else {
      // No blocks found, create a new one
      const newBlock = document.createElement(tag);
      
      // Get selection content
      const content = range.extractContents();
      
      // If content is empty, add a non-breaking space
      if (content.textContent?.trim() === '') {
        newBlock.innerHTML = '&nbsp;';
      } else {
        newBlock.appendChild(content);
      }
      
      // Insert the new block
      range.insertNode(newBlock);
      
      // Position cursor at the end of the block
      const selection = window.getSelection();
      if (selection) {
        const newRange = document.createRange();
        newRange.selectNodeContents(newBlock);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  }
  
  private replaceWithTag(element: HTMLElement, tag: string): void {
    const newElement = document.createElement(tag);
    
    // Copy content
    newElement.innerHTML = element.innerHTML;
    
    // Replace the element
    if (element.parentNode) {
      element.parentNode.replaceChild(newElement, element);
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
  
  private updateDropdownState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current block format
    let node = range.commonAncestorContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let formatTag: string | null = null;
    
    // Find the closest block element
    while (node && node !== this.editor.getContentArea()) {
      const nodeTag = (node as HTMLElement).tagName.toLowerCase();
      
      if (this.options.some(option => option.tag === nodeTag)) {
        formatTag = nodeTag;
        break;
      }
      
      node = node.parentNode as Node;
    }
    
    // Update dropdown
    if (formatTag) {
      for (let i = 0; i < this.formatDropdown.options.length; i++) {
        if (this.formatDropdown.options[i].value === formatTag) {
          this.formatDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no format found
    this.formatDropdown.selectedIndex = 0;
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    this.formatDropdown.removeEventListener('change', this.handleFormatChange);
    super.destroy();
  }
}