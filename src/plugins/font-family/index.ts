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
    super('fontFamily', null, 'Font Family', 'openrte-font-family-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.fontDropdown = document.createElement('select');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update dropdown
    document.addEventListener('selectionchange', this.updateDropdownState);
    
    // Add listener for custom selection update event
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateDropdownState);
    }
  }
  
  execute(): void {
    // The dropdown handles execution directly
    super.execute();
  }
  
  /**
   * DOM-based execution for backward compatibility
   * This plugin uses the dropdown for execution, so this is a no-op
   */
  protected executeDOMBased(): void {
    // No default action for font family plugin
    // Font selection is handled by the dropdown
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
    
    // Check for existing font family span
    const existingFontSpan = this.findExistingFontSpan(range);
    
    if (existingFontSpan) {
      // Update existing span
      existingFontSpan.style.fontFamily = fontFamily;
    } else {
      // Create a new span with the font family
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
  }
  
  private findExistingFontSpan(range: Range): HTMLElement | null {
    if (!this.editor) return null;
    
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    
    // Look up to find a span with font-family that contains the selection
    while (current && current !== this.editor.getContentArea()) {
      if (current.nodeName === 'SPAN' && 
          current.style && 
          current.style.fontFamily && 
          this.elementContainsRange(current, range)) {
        return current;
      }
      if (!current.parentNode) break;
      current = current.parentNode as HTMLElement;
    }
    
    return null;
  }
  
  private elementContainsRange(element: HTMLElement, range: Range): boolean {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(element);
      
      return nodeRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0 &&
             nodeRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0;
    } catch (e) {
      console.warn('Error checking element range containment:', e);
      return false;
    }
  }
  
  private updateDropdownState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current font family
    let fontFamily = this.getSelectionFontFamily(range);
    
    // Update dropdown if font family found
    if (fontFamily) {
      for (let i = 0; i < this.fontDropdown.options.length; i++) {
        if (this.areFontFamiliesEquivalent(this.fontDropdown.options[i].value, fontFamily)) {
          this.fontDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no font family found
    this.fontDropdown.selectedIndex = 0;
  };
  
  private getSelectionFontFamily(range: Range): string | null {
    if (!this.editor) return null;
    
    // If range is collapsed (cursor only), check ancestors
    if (range.collapsed) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      return this.getNodeFontFamily(node as HTMLElement);
    }
    
    // For selections, check for a span with font family
    const existingFontSpan = this.findExistingFontSpan(range);
    if (existingFontSpan && existingFontSpan.style.fontFamily) {
      return existingFontSpan.style.fontFamily;
    }
    
    return null;
  }
  
  private getNodeFontFamily(element: HTMLElement): string | null {
    if (!element) return null;
    
    // Check if element has a font-family style
    if (element.style && element.style.fontFamily) {
      return element.style.fontFamily;
    }
    
    // Check computed style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.fontFamily) {
      return computedStyle.fontFamily;
    }
    
    return null;
  }
  
  // Helper to compare font families which might have different formatting
  private areFontFamiliesEquivalent(font1: string, font2: string): boolean {
    // Normalize strings by removing extra spaces and quotes
    const normalize = (font: string) => {
      return font.replace(/['"]/g, '').toLowerCase().trim();
    };
    
    return normalize(font1) === normalize(font2);
  }
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateDropdownState);
    }
    
    this.fontDropdown.removeEventListener('change', this.handleFontChange);
    super.destroy();
  }
}