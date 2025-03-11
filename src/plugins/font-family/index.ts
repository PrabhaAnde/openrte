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
    this.fontDropdown = document.createElement('select');
  }

  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('selectionchange', this.updateDropdownState);
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateDropdownState);
      editor.getPluginRegistry().on('editor:contentchange', this.updateDropdownState);
    }
  }

  execute(): void {
    super.execute();
  }

  protected executeDOMBased(): void {
    // Implementation handled by handleFontChange
  }

  createToolbarControl(): HTMLElement {
    this.fontDropdown = document.createElement('select');
    this.fontDropdown.className = 'openrte-font-family-dropdown';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.text = 'Font';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    this.fontDropdown.add(placeholderOption);
    this.fonts.forEach(font => {
      if (font.value === '') return; // Skip the default option
      const optionElement = document.createElement('option');
      optionElement.value = font.value;
      optionElement.text = font.name;
      optionElement.style.fontFamily = font.value;
      this.fontDropdown.add(optionElement);
    });
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
    dropdown.selectedIndex = 0;
    this.editor.focus();
  };

  private applyFontFamily(fontFamily: string): void {
    if (!this.editor) return;
    
    // Get selection and range
    const selectionManager = this.editor.getSelectionManager();
    const range = selectionManager.getRange();
    
    if (!range) return;
    
    // Make a clean copy of the range to avoid browser selection quirks
    const cleanRange = range.cloneRange();
    
    // Check if this is a word or line selection (double/triple click)
    const isWordOrLineSelection = this.detectWordOrLineSelection(cleanRange);
    
    // Apply font family differently based on selection type
    if (isWordOrLineSelection) {
      this.applyFontToWordOrLineSelection(cleanRange, fontFamily);
    } else {
      // Standard selection
      selectionManager.applyToSelection(range => {
        this.applyFontFamilyToRange(range, fontFamily);
      });
    }
    
    // Force a DOM refresh to ensure the changes take effect
    setTimeout(() => {
      // Try to restore selection
      try {
        selectionManager.setRange(cleanRange);
      } catch (e) {
        console.warn("Failed to restore selection after font change:", e);
      }
      
      // Force update the dropdown state
      this.updateDropdownState();
      
      // Refocus the editor
      this.editor?.focus();
    }, 10);
  }
  
  /**
   * Detect if the selection is likely a word or line selection (double/triple click)
   */
  private detectWordOrLineSelection(range: Range): boolean {
    if (range.collapsed) return false;
    
    // Check if selection starts/ends at word or paragraph boundaries
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    
    // If both nodes are text nodes
    if (startNode.nodeType === Node.TEXT_NODE && endNode.nodeType === Node.TEXT_NODE) {
      const startText = startNode.textContent || '';
      const endText = endNode.textContent || '';
      
      // Word selection often starts at the beginning of a word and ends at the end
      const startsAtWordBoundary = range.startOffset === 0 || 
                                 /\s/.test(startText.charAt(range.startOffset - 1));
      
      const endsAtWordBoundary = range.endOffset === endText.length ||
                               (range.endOffset < endText.length && /\s/.test(endText.charAt(range.endOffset)));
      
      // If both at word boundaries, likely a word or line selection
      if (startsAtWordBoundary && endsAtWordBoundary) {
        return true;
      }
      
      // Line selection often includes the entire textContent
      if (range.startOffset === 0 && range.endOffset === endText.length) {
        return true;
      }
    }
    
    // Also check if selection spans multiple block elements - likely a triple-click
    if (startNode !== endNode) {
      const startBlock = this.getParentBlock(startNode);
      const endBlock = this.getParentBlock(endNode);
      
      if (startBlock && endBlock && startBlock !== endBlock) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get the parent block element of a node
   */
  private getParentBlock(node: Node): HTMLElement | null {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'];
    let current = node;
    
    while (current && current.nodeType !== Node.ELEMENT_NODE) {
      if (!current.parentNode) break;
      current = current.parentNode;
    }
    
    while (current && current !== this.editor?.getContentArea()) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        if (blockTags.includes(element.tagName)) {
          return element;
        }
      }
      if (!current.parentNode) break;
      current = current.parentNode;
    }
    
    return null;
  }
  
  /**
   * Special handler for word or line selections (double/triple click)
   */
  private applyFontToWordOrLineSelection(range: Range, fontFamily: string): void {
    if (!this.editor) return;
    
    // Extract the contents
    const fragment = range.extractContents();
    
    // Create a wrapper span
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.setAttribute('data-font-family', 'true');
    
    // Find and fix any nested font spans to prevent formatting issues
    this.normalizeNestedFontSpans(fragment, fontFamily);
    
    // Add the content to the span
    span.appendChild(fragment);
    
    // Insert the span
    range.insertNode(span);
    
    // Normalize and clean up any adjacent or nested spans
    if (span.parentNode) {
      span.parentNode.normalize();
      this.cleanupFontSpans(span.parentNode as HTMLElement);
    }
    
    // Update the range
    range.selectNodeContents(span);
  }

  /**
   * Fix nested font spans in a document fragment
   */
  private normalizeNestedFontSpans(fragment: DocumentFragment, fontFamily: string): void {
    // Find all font spans
    const spans = fragment.querySelectorAll('span[style*="font-family"]');
    
    spans.forEach(span => {
      // Update to the new font family
      (span as HTMLElement).style.fontFamily = fontFamily;
      
      // Remove any nested font spans with their content preserved
      const nestedSpans = span.querySelectorAll('span[style*="font-family"]');
      nestedSpans.forEach(nestedSpan => {
        const parent = nestedSpan.parentNode;
        if (parent) {
          while (nestedSpan.firstChild) {
            parent.insertBefore(nestedSpan.firstChild, nestedSpan);
          }
          parent.removeChild(nestedSpan);
        }
      });
    });
  }

  private applyFontFamilyToRange(range: Range, fontFamily: string): void {
    if (range.collapsed) return;
    
    // Check if we're dealing with a word or line selection
    if (this.detectWordOrLineSelection(range)) {
      this.applyFontToWordOrLineSelection(range.cloneRange(), fontFamily);
      return;
    }
    
    // Begin with extracting content - this helps with selection boundary issues
    const fragment = range.extractContents();
    
    // Create wrapper span
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.setAttribute('data-font-family', 'true');
    
    // Normalize any nested font spans in the fragment
    this.normalizeNestedFontSpans(fragment, fontFamily);
    
    // Append the content to the span
    span.appendChild(fragment);
    
    // Insert the span back
    range.insertNode(span);
    
    // Clean up any adjacent or nested spans
    if (span.parentNode) {
      span.parentNode.normalize();
      this.cleanupFontSpans(span.parentNode as HTMLElement);
    }
    
    // Update the range
    range.selectNodeContents(span);
  }

  private cleanupFontSpans(container: HTMLElement): void {
    if (!container) return;
    
    // Find all font spans
    const fontSpans = container.querySelectorAll('span[style*="font-family"]');
    
    // First remove empty spans
    fontSpans.forEach(span => {
      if (!span.textContent?.trim()) {
        span.parentNode?.removeChild(span);
      }
    });
    
    // Merge adjacent spans with the same font
    this.mergeAdjacentFontSpans(container);
    
    // Fix any remaining nested spans
    this.fixNestedFontSpans(container);
  }

  private mergeAdjacentFontSpans(container: HTMLElement): void {
    // This is a recursive function that processes direct children first
    // and then processes deeper child elements
    
    // First, find all direct child spans
    const spans: HTMLElement[] = [];
    for (let i = 0; i < container.childNodes.length; i++) {
      const node = container.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && 
          (node as HTMLElement).tagName === 'SPAN' &&
          (node as HTMLElement).style.fontFamily) {
        spans.push(node as HTMLElement);
      }
    }
    
    // Compare adjacent spans
    for (let i = 0; i < spans.length - 1; i++) {
      const currentSpan = spans[i];
      let nextSibling = currentSpan.nextSibling;
      
      // Skip text nodes between spans
      while (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && 
             !nextSibling.textContent?.trim()) {
        nextSibling = nextSibling.nextSibling;
      }
      
      if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE &&
          (nextSibling as HTMLElement).tagName === 'SPAN' &&
          (nextSibling as HTMLElement).style.fontFamily) {
        
        const nextSpan = nextSibling as HTMLElement;
        
        // Check if fonts match
        if (this.areFontFamiliesEquivalent(
            currentSpan.style.fontFamily, 
            nextSpan.style.fontFamily)) {
          
          // Copy children to the first span
          while (nextSpan.firstChild) {
            currentSpan.appendChild(nextSpan.firstChild);
          }
          
          // Remove the second span
          nextSpan.parentNode?.removeChild(nextSpan);
          
          // Adjust our span array
          spans.splice(i + 1, 1);
          i--; // To check the new adjacent span on next iteration
        }
      }
    }
    
    // Now process child elements recursively
    for (const span of spans) {
      this.mergeAdjacentFontSpans(span);
    }
  }

  private fixNestedFontSpans(container: HTMLElement): void {
    // Find all font spans
    const fontSpans = Array.from(container.querySelectorAll('span[style*="font-family"]'));
    
    // Sort by DOM depth to process deepest spans first
    fontSpans.sort((a, b) => {
      // Count parents to determine depth
      let depthA = 0, depthB = 0;
      let parentA: Node | null = a, parentB: Node | null = b;
      
      while (parentA) {
        depthA++;
        parentA = parentA.parentNode;
      }
      
      while (parentB) {
        depthB++;
        parentB = parentB.parentNode;
      }
      
      return depthB - depthA; // Process deepest first
    });
    
    // Process nested spans
    fontSpans.forEach(span => {
      let parent = span.parentNode;
      
      // Check if parent is also a font span
      if (parent && parent.nodeType === Node.ELEMENT_NODE && 
          (parent as HTMLElement).tagName === 'SPAN' &&
          (parent as HTMLElement).style.fontFamily) {
        
        const parentSpan = parent as HTMLElement;
        
        // If same font, unwrap this span
        if (this.areFontFamiliesEquivalent(
            (span as HTMLElement).style.fontFamily, 
            parentSpan.style.fontFamily)) {
          
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
        // If different font, let child win by replacing parent's style
        else {
          parentSpan.style.fontFamily = (span as HTMLElement).style.fontFamily;
          
          // Then unwrap the child
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      }
    });
  }

  private updateDropdownState = (): void => {
    if (!this.editor) return;
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    let fontFamily = this.getSelectionFontFamily(range);
    
    if (fontFamily) {
      // Try to find a matching font in the dropdown
      let matchFound = false;
      
      for (let i = 0; i < this.fontDropdown.options.length; i++) {
        const optionValue = this.fontDropdown.options[i].value;
        if (optionValue && this.areFontFamiliesEquivalent(optionValue, fontFamily)) {
          this.fontDropdown.selectedIndex = i;
          matchFound = true;
          break;
        }
      }
      
      // If no match found, default to the first option
      if (!matchFound) {
        this.fontDropdown.selectedIndex = 0;
      }
    } else {
      this.fontDropdown.selectedIndex = 0;
    }
  };

  private getSelectionFontFamily(range: Range): string | null {
    if (!this.editor) return null;
    
    // For cursor position (collapsed range)
    if (range.collapsed) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      return this.getNodeFontFamily(node as HTMLElement);
    }
    
    // For word/line selection, try to handle specially
    if (this.detectWordOrLineSelection(range)) {
      // Try to get the font from the common parent first
      const parentBlock = this.getParentBlock(range.commonAncestorContainer);
      if (parentBlock) {
        const fontSpans = parentBlock.querySelectorAll('span[style*="font-family"]');
        if (fontSpans.length === 1) {
          // If there's only one font span in the block, it's likely what we want
          return (fontSpans[0] as HTMLElement).style.fontFamily;
        }
      }
    }
    
    // Clone to avoid modifying the selection
    const clonedRange = range.cloneRange();
    const fragment = clonedRange.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    
    // Find all font spans in the fragment
    const fontSpans = tempDiv.querySelectorAll('span[style*="font-family"]');
    
    if (fontSpans.length > 0) {
      // If there's only one span or all spans have the same font, return that font
      const firstFont = (fontSpans[0] as HTMLElement).style.fontFamily;
      
      // Single span case
      if (fontSpans.length === 1) {
        return firstFont;
      }
      
      // Check if all spans have the same font
      const allSameFont = Array.from(fontSpans).every(span => 
        this.areFontFamiliesEquivalent((span as HTMLElement).style.fontFamily, firstFont));
      
      if (allSameFont) {
        return firstFont;
      }
      
      // Mixed fonts case
      // Check which font covers the most content by text length
      const fontCoverage = new Map<string, number>();
      fontSpans.forEach(span => {
        const font = (span as HTMLElement).style.fontFamily;
        const textLength = span.textContent?.length || 0;
        const currentCount = fontCoverage.get(font) || 0;
        fontCoverage.set(font, currentCount + textLength);
      });
      
      // Find the font with the most coverage
      let maxCoverage = 0;
      let dominantFont = null;
      
      fontCoverage.forEach((coverage, font) => {
        if (coverage > maxCoverage) {
          maxCoverage = coverage;
          dominantFont = font;
        }
      });
      
      return dominantFont;
    }
    
    // If no font spans found, try to get computed style
    if (tempDiv.textContent?.trim()) {
      const textNodes = this.getAllTextNodes(tempDiv);
      if (textNodes.length > 0) {
        const firstTextNode = textNodes[0];
        if (firstTextNode.parentNode) {
          const computedStyle = window.getComputedStyle(firstTextNode.parentNode as HTMLElement);
          return computedStyle.fontFamily;
        }
      }
    }
    
    return null;
  }

  private getAllTextNodes(element: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Only accept non-empty text nodes
          return node.textContent?.trim() 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node: Node | null;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
  }

  private getNodeFontFamily(element: HTMLElement): string | null {
    if (!element) return null;
    
    // Check for inline style first
    if (element.style && element.style.fontFamily) {
      return element.style.fontFamily;
    }
    
    // Check parent elements for font-family style
    let current = element;
    while (current && current !== this.editor?.getContentArea()) {
      if (current.style && current.style.fontFamily) {
        return current.style.fontFamily;
      }
      if (!current.parentElement) break;
      current = current.parentElement;
    }
    
    // Fall back to computed style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.fontFamily) {
      return computedStyle.fontFamily;
    }
    
    return null;
  }

  private areFontFamiliesEquivalent(font1: string, font2: string): boolean {
    if (!font1 || !font2) return false;
    
    const normalize = (font: string) => {
      // Remove quotes, normalize whitespace, and convert to lowercase
      return font.replace(/['"]/g, '')
                .replace(/\s+/g, ' ')
                .toLowerCase()
                .trim();
    };
    
    const normalizedFont1 = normalize(font1);
    const normalizedFont2 = normalize(font2);
    
    // Direct comparison
    if (normalizedFont1 === normalizedFont2) {
      return true;
    }
    
    // Check if one contains the other (for cases like "Arial" vs "Arial, sans-serif")
    const font1Parts = normalizedFont1.split(',').map(p => p.trim());
    const font2Parts = normalizedFont2.split(',').map(p => p.trim());
    
    // Check if primary fonts match
    if (font1Parts[0] === font2Parts[0]) {
      return true;
    }
    
    // Check for font alternatives
    for (const part1 of font1Parts) {
      for (const part2 of font2Parts) {
        if (part1 === part2 && part1 !== 'sans-serif' && 
            part1 !== 'serif' && part1 !== 'monospace') {
          return true;
        }
      }
    }
    
    return false;
  }

  destroy(): void {
    document.removeEventListener('selectionchange', this.updateDropdownState);
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateDropdownState);
      this.editor.getPluginRegistry().off('editor:contentchange', this.updateDropdownState);
    }
    this.fontDropdown.removeEventListener('change', this.handleFontChange);
    super.destroy();
  }
}