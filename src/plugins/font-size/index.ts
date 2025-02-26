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
    super('fontSize', null, 'Font Size', 'openrte-font-size-control');
    
    // Create dropdown (will be properly initialized in createToolbarControl)
    this.sizeDropdown = document.createElement('select');
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
    
    // Store current selection for restoration
    const savedSelection = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
    
    // Find if the current selection is already inside a font-size span
    const existingFontSizeSpan = this.findExistingFontSizeSpan(range);
    
    if (existingFontSizeSpan) {
      // Update existing span's font size
      existingFontSizeSpan.style.fontSize = fontSize;
    } else {
      // Create a new span with the font size
      const span = document.createElement('span');
      span.style.fontSize = fontSize;
      
      try {
        // Try the simple way first
        range.surroundContents(span);
      } catch (e) {
        // Handle complex selections (e.g., across elements)
        this.handleComplexRangeFormatting(range, span);
      }
    }
    
    // Restore selection - prevents issues with multiple consecutive changes
    try {
      const newRange = document.createRange();
      newRange.setStart(savedSelection.startContainer, savedSelection.startOffset);
      newRange.setEnd(savedSelection.endContainer, savedSelection.endOffset);
      
      if (this.editor) {
        this.editor.getSelectionManager().setRange(newRange);
      }
    } catch (e) {
      console.warn('Could not restore selection after font size change');
    }
  }
  
  // Helper method to handle complex range formatting
  private handleComplexRangeFormatting(range: Range, span: HTMLElement): void {
    // First attempt: extract and reinsert content
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
    
    // Clean up nested spans with the same styling
    this.mergeNestedFontSizeSpans(span);
  }
  
  // Helper to merge and clean up nested spans
  private mergeNestedFontSizeSpans(parentElement: HTMLElement): void {
    const spanElements = parentElement.querySelectorAll('span[style*="font-size"]');
    
    spanElements.forEach(span => {
      const spanEl = span as HTMLElement;
      if (spanEl.parentElement && spanEl.parentElement.style.fontSize === spanEl.style.fontSize) {
        // Move children out and remove the redundant span
        while (spanEl.firstChild) {
          spanEl.parentElement.insertBefore(spanEl.firstChild, spanEl);
        }
        spanEl.parentElement.removeChild(spanEl);
      }
    });
  }
  
  // Helper method to find existing font-size span that contains the current selection
  private findExistingFontSizeSpan(range: Range): HTMLElement | null {
    if (!this.editor) return null;
    
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    
    // Look up to find a span with font-size that fully contains the selection
    while (current && current !== this.editor.getContentArea()) {
      if (current.nodeName === 'SPAN' && 
          current.style && 
          current.style.fontSize && 
          this.elementContainsRange(current, range)) {
        return current;
      }
      if (!current.parentNode) break;
      current = current.parentNode as HTMLElement;
    }
    
    return null;
  }
  
  // Check if an element fully contains the range
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
    
    // Find current font size
    let fontSize = this.getSelectionFontSize(range);
    
    // Update dropdown - now with normalized comparison
    if (fontSize) {
      // Normalize font size for comparison (trim and lowercase)
      const normalizedFontSize = fontSize.trim().toLowerCase();
      
      for (let i = 0; i < this.sizeDropdown.options.length; i++) {
        const optionValue = this.sizeDropdown.options[i].value.trim().toLowerCase();
        // Check if the font size matches or if it's equivalent
        if (optionValue === normalizedFontSize || this.areFontSizesEquivalent(optionValue, normalizedFontSize)) {
          this.sizeDropdown.selectedIndex = i;
          return;
        }
      }
    }
    
    // Default to placeholder if no font size found
    this.sizeDropdown.selectedIndex = 0;
  };
  
  private getSelectionFontSize(range: Range): string | null {
    if (!this.editor) return null;
    
    // If range is collapsed (cursor only), check ancestors
    if (range.collapsed) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      return this.getNodeFontSize(node as HTMLElement);
    }
    
    // For selections, check for a span with font size
    const existingFontSizeSpan = this.findExistingFontSizeSpan(range);
    if (existingFontSizeSpan && existingFontSizeSpan.style.fontSize) {
      return existingFontSizeSpan.style.fontSize;
    }
    
    return null;
  }
  
  private getNodeFontSize(element: HTMLElement): string | null {
    if (!element) return null;
    
    // Check if element has a font-size style
    if (element.style && element.style.fontSize) {
      return element.style.fontSize;
    }
    
    // Check computed style - only if significantly different from default
    const computedStyle = window.getComputedStyle(element);
    const defaultSize = '16px'; // Most browsers default
    if (computedStyle.fontSize !== defaultSize) {
      return computedStyle.fontSize;
    }
    
    return null;
  }
  
  // Helper to check if two different representations of font size are equivalent
  private areFontSizesEquivalent(size1: string, size2: string): boolean {
    // This is a simplified check that could be expanded with actual conversion logic
    // For now, we'll just handle exact matches with unit-aware comparison
    
    // Remove units for basic comparison
    const numericValue1 = parseFloat(size1);
    const numericValue2 = parseFloat(size2);
    
    // Get the units
    const unit1 = size1.replace(/[\d.]/g, '');
    const unit2 = size2.replace(/[\d.]/g, '');
    
    // If units are the same and values are the same, they're equivalent
    if (unit1 === unit2 && numericValue1 === numericValue2) {
      return true;
    }
    
    // Handle pixel to point conversion (approximate)
    if ((unit1 === 'px' && unit2 === 'pt') || (unit1 === 'pt' && unit2 === 'px')) {
      // 1pt ≈ 1.33px
      const conversionFactor = 1.33;
      
      if (unit1 === 'px' && unit2 === 'pt') {
        return Math.abs(numericValue1 - (numericValue2 * conversionFactor)) < 1;
      } else {
        return Math.abs(numericValue1 * conversionFactor - numericValue2) < 1;
      }
    }
    
    return false;
  }
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateDropdownState);
    }
    
    this.sizeDropdown.removeEventListener('change', this.handleSizeChange);
    super.destroy();
  }
}