import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

interface SpacingOption {
  value: string;
  label: string;
}

export class LineSpacingPlugin extends BasePlugin {
  private spacingDropdown: HTMLSelectElement;
  private options: SpacingOption[] = [
    { value: '1', label: 'Single' },
    { value: '1.15', label: '1.15' },
    { value: '1.5', label: '1.5' },
    { value: '2', label: 'Double' },
    { value: '2.5', label: '2.5' },
    { value: '3', label: '3' }
  ];
  
  constructor() {
    // super('lineSpacing', '', 'openrte-line-spacing-control');
    super('lineSpacing', null, 'Line Spacing', 'openrte-line-spacing-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.spacingDropdown = document.createElement('select');
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
    this.spacingDropdown = document.createElement('select');
    this.spacingDropdown.className = 'openrte-spacing-dropdown';
    
    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.text = 'Line Spacing';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    this.spacingDropdown.add(placeholderOption);
    
    // Add spacing options
    this.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.text = option.label;
      this.spacingDropdown.add(optionElement);
    });
    
    // Add change handler
    this.spacingDropdown.addEventListener('change', this.handleSpacingChange);
    
    return this.spacingDropdown;
  }
  
  private handleSpacingChange = (event: Event): void => {
    event.preventDefault();
    
    if (!this.editor) return;
    
    const dropdown = event.target as HTMLSelectElement;
    const selectedSpacing = dropdown.value;
    
    if (!selectedSpacing) return;
    
    this.applyLineSpacing(selectedSpacing);
    
    // Reset dropdown
    dropdown.selectedIndex = 0;
    
    // Focus editor
    this.editor.focus();
  };
  
  private applyLineSpacing(spacing: string): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.applyLineSpacingToRange(range, spacing);
    });
    
    // Update dropdown state
    this.updateDropdownState();
  }
  
  private applyLineSpacingToRange(range: Range, spacing: string): void {
    if (!this.editor) return;
    
    // Find blocks in range
    const blocks = this.getBlocksInRange(range);
    
    if (blocks.length > 0) {
      // Apply spacing to each block
      blocks.forEach(block => {
        block.style.lineHeight = spacing;
      });
    } else {
      // No blocks found, apply to current paragraph or create one
      let node = range.commonAncestorContainer;
      
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      // Find closest block element
      let blockElement: HTMLElement | null = null;
      
      while (node && node !== this.editor.getContentArea()) {
        if (this.isBlockElement(node as HTMLElement)) {
          blockElement = node as HTMLElement;
          break;
        }
        node = node.parentNode as Node;
      }
      
      if (blockElement) {
        blockElement.style.lineHeight = spacing;
      } else {
        // No block found, create a paragraph with the spacing
        const p = document.createElement('p');
        p.style.lineHeight = spacing;
        
        // Extract and add content
        const content = range.extractContents();
        
        if (content.textContent?.trim() === '') {
          p.innerHTML = '&nbsp;';
        } else {
          p.appendChild(content);
        }
        
        // Insert the paragraph
        range.insertNode(p);
        
        // Position cursor at the end
        const selection = window.getSelection();
        if (selection) {
          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
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
  
  private updateDropdownState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current line spacing
    let node = range.commonAncestorContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let lineHeight: string | null = null;
    
    // Find the closest block with line height
    while (node && node !== this.editor.getContentArea()) {
      const element = node as HTMLElement;
      if (this.isBlockElement(element) && element.style.lineHeight) {
        lineHeight = element.style.lineHeight;
        break;
      }
      node = node.parentNode as Node;
    }
    
    // Update dropdown
    if (lineHeight) {
      for (let i = 0; i < this.spacingDropdown.options.length; i++) {
        if (this.spacingDropdown.options[i].value === lineHeight) {
          this.spacingDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no spacing found
    this.spacingDropdown.selectedIndex = 0;
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    this.spacingDropdown.removeEventListener('change', this.handleSpacingChange);
    super.destroy();
  }
}