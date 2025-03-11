import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { FontFamilyModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

interface FontOption {
  name: string;
  value: string;
}

export class FontFamilyPlugin extends BasePlugin {
  private fontDropdown: HTMLSelectElement;
  private modelAdapter: FontFamilyModelAdapter;
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
    this.modelAdapter = new FontFamilyModelAdapter();
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
    if (!this.editor) return;
    
    const selectedFont = this.fontDropdown.value;
    if (!selectedFont) return;
    
    if (this.supportsDocumentModel()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      if (model && range) {
        this.modelAdapter.applyToModel(model, range, { fontFamily: selectedFont });
        this.editor.renderDocument();
        return;
      }
    }
    
    this.applyFontFamily(selectedFont);
    this.fontDropdown.selectedIndex = 0;
    this.editor.focus();
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

  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }

  protected executeDOMBased(): void {
    // Not needed as execute() handles both model and DOM cases
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
    const selectionManager = this.editor.getSelectionManager();
    const range = selectionManager.getRange();
    if (!range) return;
    
    // Use the same detection logic as in SelectionManager
    // This fixes double-click and triple-click issues
    const isWordSelection = this.isWordSelection(range);
    
    try {
      // Take a different approach that doesn't rely on SelectionManager's applyToSelection
      // This prevents issues with selection restoration that can happen when DOM nodes change
      if (isWordSelection) {
        // Clone the range to avoid modifying the original
        const clonedRange = range.cloneRange();
        this.applyFontToWord(clonedRange, fontFamily);
      } else {
        // For normal selections, apply directly without using SelectionManager's wrapper
        const clonedRange = range.cloneRange();
        this.applyFontFamilyToRange(clonedRange, fontFamily);
      }
    } catch (e) {
      console.warn('Error applying font family:', e);
    } finally {
      // Focus back on the editor
      if (this.editor) {
        this.editor.focus();
      }
    }
    
    this.updateDropdownState();
  }

  private isWordSelection(range: Range): boolean {
    if (range.collapsed) return false;
    
    // For double-click (word selection), the range will be within a single text node
    // and will start and end at word boundaries
    if (range.startContainer === range.endContainer && 
        range.startContainer.nodeType === Node.TEXT_NODE) {
      const text = range.startContainer.textContent || '';
      const beforeStart = text.substring(0, range.startOffset).trim();
      const afterEnd = text.substring(range.endOffset).trim();
      const selectedText = text.substring(range.startOffset, range.endOffset).trim();
      
      // If selection starts at a word boundary and ends at a word boundary
      if ((beforeStart === '' || beforeStart.endsWith(' ')) &&
          (afterEnd === '' || afterEnd.startsWith(' ')) &&
          selectedText.indexOf(' ') === -1) {
        return true;
      }
    }
    
    return false;
  }

  private applyFontToWord(range: Range, fontFamily: string): void {
    if (!range || range.collapsed) return;
    
    // Create a new span for the font
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.setAttribute('data-font-family', 'true');
    
    // Remember the container for later selection
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    
    try {
      // Try to use surroundContents which is cleaner when it works
      range.surroundContents(span);
    } catch (e) {
      // For more complex selections that can't use surroundContents
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    
    // Clean up any nested spans
    if (span.parentNode) {
      this.cleanupFontSpans(span.parentNode as HTMLElement);
    }
    
    // Create a new range and try to position it after our operation
    try {
      const newRange = document.createRange();
      
      // Try to place cursor at the end of our modified content
      newRange.selectNodeContents(span);
      newRange.collapse(false); // Collapse to end
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (e) {
      // If that fails, try to get back to where we started
      console.warn('Error restoring selection, trying alternate method:', e);
      try {
        // Try to restore using original containers
        const newRange = document.createRange();
        if (startContainer && startContainer.parentNode && 
            endContainer && endContainer.parentNode) {
          
          // Find the closest valid text node
          const walker = document.createTreeWalker(
            this.editor?.getContentArea() || document.body,
            NodeFilter.SHOW_TEXT
          );
          let currentNode = walker.currentNode;
          while (currentNode) {
            if (currentNode.textContent && currentNode.textContent.trim()) {
              break;
            }
            currentNode = walker.nextNode() as Text;
          }
          
          if (currentNode) {
            newRange.setStart(currentNode, 0);
            newRange.setEnd(currentNode, 0);
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
      } catch (e2) {
        console.warn('Failed to restore selection with alternate method:', e2);
      }
    }
  }

  private applyFontFamilyToRange(range: Range, fontFamily: string): void {
    if (range.collapsed) return;
    
    // Remember where we are
    const commonAncestor = range.commonAncestorContainer;
    
    // Special case for line/paragraph selections that might contain multiple formatted spans
    const isLineSelection = this.isLineSelection(range);
    
    if (isLineSelection) {
      // For line selections, take special care to preserve whitespace
      this.applyFontToLineSelection(range, fontFamily);
      return;
    }
    
    // Regular selection case - proceed as before
    const fragment = range.extractContents();
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.setAttribute('data-font-family', 'true');
    
    // Clean up nested font spans
    this.normalizeNestedFontSpans(fragment, fontFamily);
    span.appendChild(fragment);
    range.insertNode(span);
    
    // Clean up adjacent spans
    if (span.parentNode) {
      span.parentNode.normalize();
      this.cleanupFontSpans(span.parentNode as HTMLElement);
    }
    
    // Create a new range after our modifications
    try {
      const newRange = document.createRange();
      // Place cursor at end of our span
      newRange.selectNodeContents(span);
      newRange.collapse(false); // Collapse to end
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (e) {
      console.warn('Error restoring selection after range formatting:', e);
      // Fall back to a simpler approach
      try {
        if (this.editor) {
          this.editor.focus();
        }
      } catch (e2) {
        console.warn('Failed to restore focus to editor:', e2);
      }
    }
  }
  
  // Check if this is a line or paragraph selection (likely from triple-click)
  private isLineSelection(range: Range): boolean {
    // If selection spans multiple block elements or covers most of a paragraph
    if (range.startContainer !== range.endContainer) {
      // Check if common ancestor is a block element
      const commonAncestor = range.commonAncestorContainer;
      if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        const element = commonAncestor as HTMLElement;
        if (this.isBlockElement(element)) {
          // Check how much of the element is selected
          const elementContent = element.textContent || '';
          
          // Create a fragment of the selection
          const tempFragment = range.cloneContents();
          const tempDiv = document.createElement('div');
          tempDiv.appendChild(tempFragment);
          const selectedContent = tempDiv.textContent || '';
          
          // If selection contains most of the element content
          if (selectedContent.length > elementContent.length * 0.8) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Handle font application for line/paragraph selections (triple-click)
  private applyFontToLineSelection(range: Range, fontFamily: string): void {
    // Instead of extracting content, we'll walk through and format each text node
    // This preserves the structure better, especially whitespace between formatted spans
    
    const nodes = this.getTextNodesInRange(range);
    
    // Track which parent spans we've already processed to avoid duplication
    const processedParents = new Set<Node>();
    
    nodes.forEach(textNode => {
      // Skip empty text nodes
      if (!textNode.textContent || textNode.textContent.trim() === '') {
        return;
      }
      
      // Find parent element
      let parent = textNode.parentNode;
      
      // If this text node is inside a font span
      if (parent && 
          parent.nodeType === Node.ELEMENT_NODE && 
          (parent as HTMLElement).tagName === 'SPAN' && 
          (parent as HTMLElement).style.fontFamily) {
        
        // If we haven't processed this parent yet
        if (!processedParents.has(parent)) {
          (parent as HTMLElement).style.fontFamily = fontFamily;
          processedParents.add(parent);
        }
      } 
      // Text node isn't in a font span, wrap it in one
      else {
        // Don't wrap standalone whitespace
        if (textNode.textContent.trim() !== '') {
          const span = document.createElement('span');
          span.style.fontFamily = fontFamily;
          
          // Wrap the text node
          if (parent) {
            parent.insertBefore(span, textNode);
            span.appendChild(textNode);
          }
        }
      }
    });
    
    // No need to restore selection here - the DOM structure has been
    // modified in place, so the original selection should still be valid
    try {
      if (this.editor) {
        this.editor.focus();
      }
    } catch (e) {
      console.warn('Failed to restore focus after line formatting:', e);
    }
  }
  
  // Get all text nodes in the range
  private getTextNodesInRange(range: Range): Text[] {
    const nodes: Text[] = [];
    
    if (range.collapsed) {
      return nodes;
    }
    
    const iterator = document.createNodeIterator(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Create a range for this text node
          const nodeRange = document.createRange();
          nodeRange.selectNode(node);
          
          // Check if this node intersects with our selection range
          if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 &&
              range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_REJECT;
        }
      } as NodeFilter
    );
    
    let node;
    while (node = iterator.nextNode()) {
      nodes.push(node as Text);
    }
    
    return nodes;
  }
  
  // Check if element is a block element
  private isBlockElement(element: HTMLElement): boolean {
    const blockElements = [
      'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
      'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI'
    ];
    
    return blockElements.includes(element.tagName);
  }

  private normalizeNestedFontSpans(fragment: DocumentFragment, fontFamily: string): void {
    // First identify all text nodes including whitespace
    const textNodes = this.getAllTextNodes(fragment);
    
    // Find all spans with font-family styles
    const spans = fragment.querySelectorAll('span[style*="font-family"]');
    
    // Apply the new font family to spans but preserve their structure
    spans.forEach(span => {
      (span as HTMLElement).style.fontFamily = fontFamily;
    });
    
    // Make sure all text nodes are properly wrapped
    textNodes.forEach(textNode => {
      // Skip text nodes that are already inside font spans
      if (this.isInsideFontSpan(textNode)) {
        return;
      }
      
      // For text nodes not in font spans (especially whitespace), 
      // wrap them in a span if they're not just whitespace
      if (textNode.textContent && textNode.textContent.trim() !== '') {
        const newSpan = document.createElement('span');
        newSpan.style.fontFamily = fontFamily;
        
        // If the node is not already wrapped, wrap it
        if (textNode.parentNode) {
          textNode.parentNode.insertBefore(newSpan, textNode);
          newSpan.appendChild(textNode);
        }
      }
    });
  }
  
  // Helper to check if a node is already inside a font span
  private isInsideFontSpan(node: Node): boolean {
    let current = node.parentNode;
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE && 
          (current as HTMLElement).tagName === 'SPAN' && 
          (current as HTMLElement).style.fontFamily) {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }
  
  // Get all text nodes including whitespace
  private getAllTextNodes(container: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
  }

  private cleanupFontSpans(container: HTMLElement): void {
    if (!container) return;
    
    // Remove empty spans
    const fontSpans = container.querySelectorAll('span[style*="font-family"]');
    fontSpans.forEach(span => {
      if (!span.textContent?.trim()) {
        span.parentNode?.removeChild(span);
      }
    });
    
    this.mergeAdjacentFontSpans(container);
    this.fixNestedFontSpans(container);
  }

  private mergeAdjacentFontSpans(container: HTMLElement): void {
    const spans: HTMLElement[] = [];
    for (let i = 0; i < container.childNodes.length; i++) {
      const node = container.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName === 'SPAN' &&
          (node as HTMLElement).style.fontFamily) {
        spans.push(node as HTMLElement);
      }
    }
    
    for (let i = 0; i < spans.length - 1; i++) {
      const currentSpan = spans[i];
      let nextSibling = currentSpan.nextSibling;
      while (nextSibling && nextSibling.nodeType === Node.TEXT_NODE &&
             !nextSibling.textContent?.trim()) {
        nextSibling = nextSibling.nextSibling;
      }
      
      if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE &&
          (nextSibling as HTMLElement).tagName === 'SPAN' &&
          (nextSibling as HTMLElement).style.fontFamily) {
        const nextSpan = nextSibling as HTMLElement;
        if (this.areFontFamiliesEquivalent(
            currentSpan.style.fontFamily,
            nextSpan.style.fontFamily)) {
          while (nextSpan.firstChild) {
            currentSpan.appendChild(nextSpan.firstChild);
          }
          nextSpan.parentNode?.removeChild(nextSpan);
          spans.splice(i + 1, 1);
          i--;
        }
      }
    }
    
    for (const span of spans) {
      this.mergeAdjacentFontSpans(span);
    }
  }

  private fixNestedFontSpans(container: HTMLElement): void {
    const fontSpans = Array.from(container.querySelectorAll('span[style*="font-family"]'));
    fontSpans.sort((a, b) => {
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
      return depthB - depthA;
    });
    
    fontSpans.forEach(span => {
      let parent = span.parentNode;
      if (parent && parent.nodeType === Node.ELEMENT_NODE &&
          (parent as HTMLElement).tagName === 'SPAN' &&
          (parent as HTMLElement).style.fontFamily) {
        const parentSpan = parent as HTMLElement;
        if (this.areFontFamiliesEquivalent(
            (span as HTMLElement).style.fontFamily,
            parentSpan.style.fontFamily)) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
        else {
          parentSpan.style.fontFamily = (span as HTMLElement).style.fontFamily;
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
    
    let fontFamily: string | null = null;
    
    if (this.supportsDocumentModel()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      if (model && range) {
        const state = this.modelAdapter.getStateFromModel(model, range);
        fontFamily = state.fontFamily;
      } else {
        fontFamily = this.getDOMFontFamily();
      }
    } else {
      fontFamily = this.getDOMFontFamily();
    }
    
    if (fontFamily) {
      let matchFound = false;
      for (let i = 0; i < this.fontDropdown.options.length; i++) {
        const optionValue = this.fontDropdown.options[i].value;
        if (optionValue && this.areFontFamiliesEquivalent(optionValue, fontFamily)) {
          this.fontDropdown.selectedIndex = i;
          matchFound = true;
          break;
        }
      }
      if (!matchFound) {
        this.fontDropdown.selectedIndex = 0;
      }
    } else {
      this.fontDropdown.selectedIndex = 0;
    }
  };

  private getDOMFontFamily(): string | null {
    if (!this.editor) return null;
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return null;
    
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    while (current && current !== this.editor.getContentArea()) {
      if (current.style && current.style.fontFamily) {
        return current.style.fontFamily;
      }
      if (!current.parentElement) break;
      current = current.parentElement;
    }
    
    // Use computed style as a fallback
    const computedStyle = window.getComputedStyle(node as HTMLElement);
    if (computedStyle.fontFamily) {
      return computedStyle.fontFamily;
    }
    
    return null;
  }

  private areFontFamiliesEquivalent(font1: string, font2: string): boolean {
    if (!font1 || !font2) return false;
    
    const normalize = (font: string) => {
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