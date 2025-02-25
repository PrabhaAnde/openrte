import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

interface SizeOption {
  name: string;
  value: string;
}

export class FontSizePlugin extends BasePlugin {
  private sizeDropdown: HTMLSelectElement;
  private sizes: SizeOption[] = [
    { name: 'Size', value: '' },
    { name: '8pt', value: '8pt' },
    { name: '10pt', value: '10pt' },
    { name: '12pt', value: '12pt' },
    { name: '14pt', value: '14pt' },
    { name: '16pt', value: '16pt' },
    { name: '18pt', value: '18pt' },
    { name: '24pt', value: '24pt' },
    { name: '36pt', value: '36pt' },
    { name: '48pt', value: '48pt' },
    { name: '72pt', value: '72pt' }
  ];
  
  constructor() {
    super('fontSize', '', 'openrte-font-size-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.sizeDropdown = document.createElement('select');
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
    this.sizeDropdown = document.createElement('select');
    this.sizeDropdown.className = 'openrte-font-size-dropdown';
    
    // Add size options
    this.sizes.forEach((size, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = size.value;
      optionElement.text = size.name;
      
      if (index === 0) {
        optionElement.disabled = true;
        optionElement.selected = true;
      } else {
        // Apply font size to the option text for visual preview
        optionElement.style.fontSize = size.value;
      }
      
      this.sizeDropdown.add(optionElement);
    });
    
    // Add change handler
    this.sizeDropdown.addEventListener('change', this.handleSizeChange);
    
    return this.sizeDropdown;
  }
  
  private handleSizeChange = (event: Event): void => {
    event.preventDefault();
    
    if (!this.editor) return;
    
    const dropdown = event.target as HTMLSelectElement;
    const selectedSize = dropdown.value;
    
    if (!selectedSize) return;
    
    this.applyFontSize(selectedSize);
    
    // Reset dropdown
    dropdown.selectedIndex = 0;
    
    // Focus editor
    this.editor.focus();
  };
  
  private applyFontSize(fontSize: string): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.applyFontSizeToRange(range, fontSize);
    });
    
    // Update dropdown state
    this.updateDropdownState();
  }
  
  private applyFontSizeToRange(range: Range, fontSize: string): void {
    if (range.collapsed) return;
    
    // Create a span with the font size
    const span = document.createElement('span');
    span.style.fontSize = fontSize;
    
    try {
      range.surroundContents(span);
    } catch (e) {
      // Handle complex selections (e.g., across elements)
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
  }
  
  private updateDropdownState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current font size
    let node = range.commonAncestorContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let fontSize: string | null = null;
    
    // Search up the DOM tree for font-size
    while (node && node !== this.editor.getContentArea()) {
      const element = node as HTMLElement;
      if (element.style && element.style.fontSize) {
        fontSize = element.style.fontSize;
        break;
      }
      node = node.parentNode as Node;
    }
    
    // Update dropdown
    if (fontSize) {
      for (let i = 0; i < this.sizeDropdown.options.length; i++) {
        if (this.sizeDropdown.options[i].value === fontSize) {
          this.sizeDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no font size found
    this.sizeDropdown.selectedIndex = 0;
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    this.sizeDropdown.removeEventListener('change', this.handleSizeChange);
    super.destroy();
  }
}