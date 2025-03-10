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
    super('blockFormat', null, 'Block Format', 'openrte-block-format-control');
    this.formatDropdown = document.createElement('select');
    this.modelAdapter = new BlockFormatModelAdapter();
  }

  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('selectionchange', this.updateDropdownState);
    
    // Add selection update listener
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateDropdownState);
      
      // Listen for model changes
      editor.getPluginRegistry().on('editor:modelrendered', this.updateDropdownState);
      editor.getPluginRegistry().on('editor:modelchange', this.updateDropdownState);
    }
  }

  execute(): void {
    if (!this.editor) return;
    
    // Get the selected format from the dropdown
    const selectedFormat = this.formatDropdown.value;
    if (!selectedFormat) return;
    
    if (this.supportsDocumentModel() && this.editor.getDocumentModel() && this.editor.getDocumentRange()) {
      // Use model-based formatting
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        // Create parameters based on selected format
        const params: { format: string; level?: number } = { format: selectedFormat };
        
        // Extract heading level if applicable
        if (selectedFormat.startsWith('h') && selectedFormat.length === 2) {
          params.level = parseInt(selectedFormat.substring(1), 10);
        }
        
        // Apply format through model adapter
        this.modelAdapter.applyToModel(model, range, params);
        
        // Render changes
        this.editor.renderDocument();
        
        // Emit event
        this.emitEvent('model-execute', {
          model,
          range,
          plugin: this,
          format: selectedFormat
        });
      }
    } else {
      // Fallback to DOM-based formatting
      this.applyFormat(selectedFormat);
    }
    
    // Reset dropdown selection
    this.formatDropdown.selectedIndex = 0;
    
    // Focus editor
    this.editor.focus();
  }

  createToolbarControl(): HTMLElement {
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
    
    // Add change event listener
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
    dropdown.selectedIndex = 0;
    this.editor.focus();
  };

  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }

  protected executeDOMBased(format?: string): void {
    if (!this.editor) return;
    
    const selectedFormat = format || this.formatDropdown.value;
    if (!selectedFormat) return;
    
    this.applyFormat(selectedFormat);
  }

  private applyFormat(tag: string): void {
    if (!this.editor) return;
    
    if (this.supportsDocumentModel() && this.editor.getDocumentModel() && this.editor.getDocumentRange()) {
      this.execute();
    } else {
      const selectionManager = this.editor.getSelectionManager();
      selectionManager.applyToSelection(range => {
        this.applyFormatToRange(range, tag);
      });
    }
    
    this.updateDropdownState();
  }

  private applyFormatToRange(range: Range, tag: string): void {
    if (!this.editor) return;
    
    const blocks = this.getBlocksInRange(range);
    
    if (blocks.length > 0) {
      // Convert existing blocks
      blocks.forEach(block => {
        this.replaceWithTag(block, tag);
      });
    } else {
      // Create a new block
      const newBlock = document.createElement(tag);
      
      try {
        // Extract content and add to new block
        const content = range.extractContents();
        
        // Handle empty content
        if (!content.textContent?.trim()) {
          newBlock.innerHTML = '<br>';
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
      } catch (e) {
        console.error('Error applying format:', e);
      }
    }
  }

  private replaceWithTag(element: HTMLElement, tag: string): void {
    if (!element.parentNode) return;
    
    // Create new element with selected tag
    const newElement = document.createElement(tag);
    
    // Preserve content and attributes
    newElement.innerHTML = element.innerHTML;
    
    // Copy attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name !== 'id') { // Skip id to avoid duplicates
        newElement.setAttribute(attr.name, attr.value);
      }
    });
    
    // Replace the element
    element.parentNode.replaceChild(newElement, element);
  }

  private getBlocksInRange(range: Range): HTMLElement[] {
    if (!this.editor) return [];
    
    const blocks: HTMLElement[] = [];
    
    // Handle collapsed selection (cursor)
    if (range.collapsed) {
      let node = range.startContainer;
      
      // Navigate up to find block element
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
    
    // For non-collapsed selection, try to find all blocks
    try {
      // Create a temporary div with selection contents
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      
      // Find all block elements in the selection
      const blockElements = tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote');
      blockElements.forEach(block => {
        blocks.push(block as HTMLElement);
      });
      
      // If no blocks found in selection, look for parent block
      if (blocks.length === 0 && tempDiv.textContent?.trim()) {
        let node = range.commonAncestorContainer;
        
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode as Node;
        }
        
        // Find closest block element
        while (node && node !== this.editor.getContentArea()) {
          if (this.isBlockElement(node as HTMLElement)) {
            blocks.push(node as HTMLElement);
            break;
          }
          node = node.parentNode as Node;
        }
      }
    } catch (e) {
      console.error('Error finding blocks in range:', e);
    }
    
    return blocks;
  }

  private isBlockElement(element: HTMLElement): boolean {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'];
    return blockTags.includes(element.tagName);
  }

  private updateDropdownState = (): void => {
    if (!this.editor) return;
    
    let formatTag: string | null = null;
    
    if (this.supportsDocumentModel()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        const state = this.modelAdapter.getStateFromModel(model, range);
        if (state) {
          formatTag = state.format;
        }
      }
    }
    
    if (!formatTag) {
      // Fallback to DOM-based detection
      const range = this.editor.getSelectionManager().getRange();
      if (!range) return;
      
      let node: Node | null = range.commonAncestorContainer;
      
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      // Find the first block element
      while (node && node !== this.editor.getContentArea()) {
        const nodeTag = (node as HTMLElement).tagName.toLowerCase();
        if (this.options.some(option => option.tag === nodeTag)) {
          formatTag = nodeTag;
          break;
        }
        node = node.parentNode as Node;
      }
    }
    
    // Update dropdown selection
    if (formatTag) {
      for (let i = 0; i < this.formatDropdown.options.length; i++) {
        if (this.formatDropdown.options[i].value === formatTag) {
          this.formatDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to first option if no match found
    this.formatDropdown.selectedIndex = 0;
  };

  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateDropdownState);
      
      this.editor.getPluginRegistry().off('editor:modelrendered', this.updateDropdownState);
      this.editor.getPluginRegistry().off('editor:modelchange', this.updateDropdownState);
    }
    
    this.formatDropdown.removeEventListener('change', this.handleFormatChange);
    
    super.destroy();
  }
}