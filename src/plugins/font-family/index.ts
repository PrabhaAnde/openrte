import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

interface FontOption {
  name: string;
  value: string;
}

export class FontFamilyPlugin extends BasePlugin {
  private fontDropdown: HTMLSelectElement;
  private fonts: FontOption[] = [
    { name: 'Default', value: '' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
    { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' }
  ];
  
  constructor() {
    // super('fontFamily', '', 'openrte-font-family-control');
    super('fontFamily', null, 'Font Family', 'openrte-font-family-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.fontDropdown = document.createElement('select');
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
    this.fontDropdown = document.createElement('select');
    this.fontDropdown.className = 'openrte-font-family-dropdown';
    
    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.text = 'Font';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    this.fontDropdown.add(placeholderOption);
    
    // Add font options
    this.fonts.forEach(font => {
      if (font.value === '') return; // Skip the default option
      
      const optionElement = document.createElement('option');
      optionElement.value = font.value;
      optionElement.text = font.name;
      optionElement.style.fontFamily = font.value;
      this.fontDropdown.add(optionElement);
    });
    
    // Add change handler
    this.fontDropdown.addEventListener('change', this.handleFontChange);
    
    return this.fontDropdown;
  }
  
  private handleFontChange = (event: Event): void => {
    event.preventDefault();
    
    if (!this.editor) return;
    
    const dropdown = event.target as HTMLSelectElement;
    const selectedFont = dropdown.value;
    
    if (!selectedFont) return;
    
    this.applyFontFamily(selectedFont);
    
    // Reset dropdown
    dropdown.selectedIndex = 0;
    
    // Focus editor
    this.editor.focus();
  };
  
  private applyFontFamily(fontFamily: string): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(range => {
      this.applyFontFamilyToRange(range, fontFamily);
    });
    
    // Update dropdown state
    this.updateDropdownState();
  }
  
  private applyFontFamilyToRange(range: Range, fontFamily: string): void {
    if (range.collapsed) return;
    
    // Create a span with the font family
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    
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
    
    // Find current font family
    let node = range.commonAncestorContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let fontFamily: string | null = null;
    
    // Search up the DOM tree for font-family
    while (node && node !== this.editor.getContentArea()) {
      const element = node as HTMLElement;
      if (element.style && element.style.fontFamily) {
        fontFamily = element.style.fontFamily;
        break;
      }
      node = node.parentNode as Node;
    }
    
    // Update dropdown
    if (fontFamily) {
      for (let i = 0; i < this.fontDropdown.options.length; i++) {
        if (this.fontDropdown.options[i].value === fontFamily) {
          this.fontDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no font family found
    this.fontDropdown.selectedIndex = 0;
  };
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    this.fontDropdown.removeEventListener('change', this.handleFontChange);
    super.destroy();
  }
}