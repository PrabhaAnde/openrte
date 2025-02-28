import { adjustRangeForBrowser, getNativeSelectionRange, setNativeSelectionRange } from '../utils/browser-utils';
import { findElementsInRange,getNodesInRange } from '../utils/dom-utils';

/**
 * Interface for a normalized range representation
 */
export interface NormalizedRange {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  commonAncestor: Node;
}

/**
 * Class for managing selection within the editor
 */
export class SelectionManager {
  /**
   * The content area element
   */
  private contentArea: HTMLElement;
  
  /**
   * Constructor
   * 
   * @param contentArea The content area element
   */
  constructor(contentArea: HTMLElement) {
    this.contentArea = contentArea;
  }
  
  /**
   * Get current selection if it's within the editor
   * 
   * @returns Selection object or null
   */
  getSelection(): Selection | null {
    const selection = window.getSelection();
    if (!selection) return null;
    
    // Check if selection is within the editor
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    
    while (node && node !== this.contentArea) {
      node = node.parentNode as Node | null;
    }
    
    return node ? selection : null;
  }  
  /**
   * Get current range
   * 
   * @returns Range object or null
   */
  getRange(): Range | null {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0).cloneRange();
    return adjustRangeForBrowser(range);
  }
  
  /**
   * Creates a normalized range representation
   * 
   * @param range The range to normalize
   * @returns Normalized range object
   */
  normalizeRange(range: Range): NormalizedRange {
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      commonAncestor: range.commonAncestorContainer
    };
  }
  
  /**
   * Creates a Range from a normalized range
   * 
   * @param normalized The normalized range
   * @returns Range object
   */
  createRangeFromNormalized(normalized: NormalizedRange): Range {
    const range = document.createRange();
    range.setStart(normalized.startContainer, normalized.startOffset);
    range.setEnd(normalized.endContainer, normalized.endOffset);
    return range;
  }
  
  /**
   * Save current selection
   * 
   * @returns Normalized range or null
   */
  saveSelection(): NormalizedRange | null {
    const range = this.getRange();
    return range ? this.normalizeRange(range) : null;
  }
  
  /**
   * Restore a saved selection
   * 
   * @param normalized The normalized range to restore
   * @returns True if successful
   */
  restoreSelection(normalized: NormalizedRange): boolean {
    try {
      const range = this.createRangeFromNormalized(normalized);
      return this.setRange(range);
    } catch (e) {
      console.warn('Failed to restore selection:', e);
      return false;
    }
  }
  
  /**
   * Sets the current selection to the provided range
   * 
   * @param range Range to set as the current selection
   * @returns boolean indicating if setting the range was successful
   */
  setRange(range: Range): boolean {
    return setNativeSelectionRange(range);
  }
  
  /**
   * Apply formatting to selection
   * 
   * @param callback Function to apply to the range
   */
  applyToSelection(callback: (range: Range) => void): void {
    const range = this.getRange();
    if (range) {
      // Save selection state
      const savedSelection = this.saveSelection();
      
      // Apply callback to the range
      callback(range);
      
      // Try to restore selection
      if (savedSelection) {
        try {
          this.restoreSelection(savedSelection);
        } catch (e) {
          // If restoration fails, try to use the modified range
          try {
            this.setRange(range);
          } catch (e2) {
            console.warn('Failed to restore selection after applying formatting:', e2);
          }
        }
      }
    }
  }
  
  /**
   * Expands selection to encompass specified node types
   * 
   * @param tagNames Array of tag names to expand to
   * @returns The expanded range or null
   */
  expandSelectionToNodeType(tagNames: string[]): Range | null {
    const range = this.getRange();
    if (!range) return null;
    
    let startContainer = range.startContainer;
    let endContainer = range.endContainer;
    let startOffset = range.startOffset;
    let endOffset = range.endOffset;
    
    // Find closest ancestor of start that matches tag names
    let node: Node | null = startContainer;
    while (node && node !== this.contentArea) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          tagNames.includes((node as Element).tagName)) {
        startContainer = node;
        startOffset = 0;
        break;
      }
      node = node.parentNode;
    }
    
    // Find closest ancestor of end that matches tag names
    node = endContainer;
    while (node && node !== this.contentArea) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          tagNames.includes((node as Element).tagName)) {
        endContainer = node;
        endOffset = endContainer.childNodes.length;
        break;
      }
      node = node.parentNode;
    }
    
    // Create new range
    const newRange = document.createRange();
    newRange.setStart(startContainer, startOffset);
    newRange.setEnd(endContainer, endOffset);
    
    // Set the expanded range
    this.setRange(newRange);
    
    return newRange;
  }  
  /**
   * Gets all nodes of a specific type within the current selection
   * 
   * @param nodeType The type of node to find
   * @param nodeNames Optional array of tag names to filter by
   * @returns Array of matching nodes
   */
  getNodesOfTypeInSelection(nodeType: number, nodeNames?: string[]): Node[] {
    const range = this.getRange();
    if (!range) return [];
    
    const nodes: Node[] = [];
    
    // Create a NodeIterator to walk through all nodes in the range
    const nodeIterator = document.createNodeIterator(
      range.commonAncestorContainer,
      nodeType,
      {
        acceptNode: function(node) {
          // Check if node is at least partially within range
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          
          const isStartBeforeEnd = nodeRange.compareBoundaryPoints(Range.START_TO_END, range) <= 0;
          const isEndAfterStart = nodeRange.compareBoundaryPoints(Range.END_TO_START, range) >= 0;
          
          if (isStartBeforeEnd && isEndAfterStart) {
            // If nodeNames is provided, check if the node's name is in the list
            if (nodeNames && node.nodeType === Node.ELEMENT_NODE) {
              return nodeNames.includes((node as Element).tagName) ? 
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_SKIP;
        }
      } as NodeFilter
    );
    
    // Collect all matching nodes
    let currentNode;
    while (currentNode = nodeIterator.nextNode()) {
      nodes.push(currentNode);
    }
    
    return nodes;
  }
  
  /**
   * Checks if the current selection has specific formatting
   * 
   * @param tagNames Array of HTML tag names to check for
   * @returns boolean indicating if selection has the formatting
   */
  hasFormatting(tagNames: string[]): boolean {
    const range = this.getRange();
    if (!range) return false;
    
    // Normalize tagNames to uppercase for case-insensitive comparison
    const normalizedTagNames = tagNames.map(tag => tag.toUpperCase());
    
    console.log(`Checking for formatting: ${normalizedTagNames.join(', ')}`);
    
    // Special case for collapsed selections (cursor only)
    if (range.collapsed) {
      const result = this.hasFormattingAtCursor(normalizedTagNames);
      console.log(`Cursor check result: ${result}`);
      return result;
    }
    
    // For non-collapsed selections, try multiple detection methods
    const ancestorResult = this.hasFormattingInAncestors(range, normalizedTagNames);
    if (ancestorResult) {
      console.log('Found formatting in ancestors');
      return true;
    }
    
    const contentsResult = this.hasFormattingInContents(range, normalizedTagNames);
    if (contentsResult) {
      console.log('Found formatting in range contents');
      return true;
    }
    
    const acrossNodesResult = this.hasFormattingAcrossNodes(range, normalizedTagNames);
    if (acrossNodesResult) {
      console.log('Found formatting across nodes');
      return true;
    }
    
    // Special case: check if entire selection is within a formatting element
    const containingElement = this.findFormattingElementContainingRange(range, normalizedTagNames);
    if (containingElement) {
      console.log('Found formatting element containing range:', containingElement.tagName);
      return true;
    }
    
    console.log('No formatting found');
    return false;
  }
  
  /**
   * Find a formatting element that completely contains the range
   * 
   * @param range The range to check
   * @param tagNames Normalized tag names to check for
   * @returns The containing element or null
   */
  private findFormattingElementContainingRange(range: Range, tagNames: string[]): HTMLElement | null {
    // Check if range is contained within a specific element
    let node: Node | null = range.commonAncestorContainer;
    
    // If the common ancestor is a text node, check its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check if the node or any of its ancestors match our tag names
    while (node && node !== this.contentArea) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as Element).tagName.toUpperCase();
        if (tagNames.includes(tagName)) {
          return node as HTMLElement;
        }
      }
      node = node.parentNode;
    }
    
    return null;
  }  
  /**
   * Check if cursor position is within a formatting element
   * 
   * @param tagNames Array of normalized tag names (uppercase)
   * @returns True if formatting is present
   */
  private hasFormattingAtCursor(tagNames: string[]): boolean {
    const range = this.getRange();
    if (!range) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    
    // Start at the current node or its parent if it's a text node
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    console.log(`Checking cursor formatting. Starting at node: ${node?.nodeName}`);
    
    // Check parent nodes for formatting
    while (node && node !== this.contentArea) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Get uppercase tag name for comparison
        const tagName = (node as Element).tagName.toUpperCase();
        if (tagNames.includes(tagName)) {
          console.log(`Found formatting at cursor: ${tagName}`);
          return true;
        }
      }
      node = node.parentNode;
    }
    
    return false;
  }
  
  /**
   * Check if any ancestor elements have the desired formatting
   * 
   * @param range The range to check
   * @param tagNames Array of normalized tag names (uppercase)
   * @returns True if formatting is present
   */
  private hasFormattingInAncestors(range: Range, tagNames: string[]): boolean {
    let node: Node | null = range.commonAncestorContainer;
    
    // If text node, start with its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    console.log(`Checking ancestors for formatting. Starting at node: ${node?.nodeName}`);
    
    // Check ancestors for formatting tags
    while (node && node !== this.contentArea) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as Element).tagName.toUpperCase();
        if (tagNames.includes(tagName)) {
          console.log(`Found formatting in ancestor: ${tagName}`);
          return true;
        }
      }
      node = node.parentNode;
    }
    
    return false;
  }
  
  /**
   * Check if the selection contents have the desired formatting
   * 
   * @param range The range to check
   * @param tagNames Array of tag names to check for
   * @returns True if formatting is present
   */
  private hasFormattingInContents(range: Range, tagNames: string[]): boolean {
    // Get all elements with the specified tag names within the range
    const elements = findElementsInRange(range, tagNames);
    return elements.length > 0;
  }
  
  /**
   * Check if the selection spans formatted elements
   * 
   * @param range The range to check
   * @param tagNames Array of normalized tag names (uppercase)
   * @returns True if formatting is present
   */
  private hasFormattingAcrossNodes(range: Range, tagNames: string[]): boolean {
    // Clone the range contents to a temporary div with better inspection
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(range.cloneContents());
    const selectionHtml = tempDiv.innerHTML;
    
    // For very precise tag detection, especially with double-click and triple-click,
    // check the raw HTML for tag patterns
    for (const tagName of tagNames) {
      // Look for opening tags (both standalone and with attributes)
      const openingPattern = new RegExp(`<${tagName}[^>]*>`, 'i');
      if (openingPattern.test(selectionHtml)) {
        console.log(`Found ${tagName} opening tag in selection HTML`);
        return true;
      }
      
      // Look for closing tags
      const closingPattern = new RegExp(`</${tagName}>`, 'i');
      if (closingPattern.test(selectionHtml)) {
        console.log(`Found ${tagName} closing tag in selection HTML`);
        return true;
      }
    }
    
    // Check for any of the formatting tags using DOM methods as backup
    for (const tagName of tagNames) {
      const elements = tempDiv.getElementsByTagName(tagName);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} ${tagName} elements in selection via DOM`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Applies formatting to the current selection
   * 
   * @param tagName HTML tag to wrap selection with
   */
  addFormatting(tagName: string): void {
    const range = this.getRange();
    if (!range) return;
    
    // Skip if range is collapsed
    if (range.collapsed) return;
    
    // Store original selection boundaries for later restoration
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    
    const element = document.createElement(tagName);
    
    try {
      range.surroundContents(element);
    } catch (e) {
      // Handle complex selections
      const fragment = range.extractContents();
      element.appendChild(fragment);
      range.insertNode(element);
    }
    
    // Try to restore original selection
    try {
      const newRange = document.createRange();
      
      // If we're selecting text inside the element
      if (element.firstChild && element.lastChild) {
        // Set start point
        if (element.contains(startContainer)) {
          newRange.setStart(startContainer, startOffset);
        } else {
          newRange.setStart(element.firstChild, 0);
        }
        
        // Set end point
        if (element.contains(endContainer)) {
          newRange.setEnd(endContainer, endOffset);
        } else {
          const lastChild = element.lastChild;
          const lastChildLength = lastChild.nodeType === Node.TEXT_NODE ? 
            lastChild.textContent!.length : lastChild.childNodes.length;
          newRange.setEnd(lastChild, lastChildLength);
        }
      } else {
        // Fallback to selecting the whole element
        this.selectNode(element);
        return;
      }
      
      // Set the new range as the selection
      this.setRange(newRange);
    } catch (e) {
      console.warn('Error restoring selection after formatting, falling back to element selection:', e);
      // Fallback to selecting the element
      this.selectNode(element);
    }
  }

  /**
 * Finds formatting elements that contain the current range
 * 
 * @param range The range to check
 * @param tagNames Array of normalized tag names (uppercase)
 * @returns Array of matching elements
 */
private findFormattingElementsInRange(range: Range, tagNames: string[]): HTMLElement[] {
  const result: HTMLElement[] = [];
  
  // Create a temporary div to hold range contents for analysis
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(range.cloneContents());
  
  // Look for formatting elements in the range contents
  for (const tagName of tagNames) {
    const elements = tempDiv.getElementsByTagName(tagName);
    if (elements.length > 0) {
      // Find the actual elements in the DOM
      const nodesInRange = getNodesInRange(range, Node.ELEMENT_NODE, [tagName]);
      nodesInRange.forEach((node: Node) => {
        if (!result.includes(node as HTMLElement)) {
          result.push(node as HTMLElement);
        }
      });    }
  }
  
  return result;
}

/**
 * Finds all formatting ancestor elements of the range
 * 
 * @param range The range to check
 * @param tagNames Array of normalized tag names (uppercase)
 * @returns Array of matching elements
 */
private findFormattingAncestors(range: Range, tagNames: string[]): HTMLElement[] {
  const result: HTMLElement[] = [];
  let node: Node | null = range.commonAncestorContainer;
  
  // If we're in a text node, start with its parent
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  
  // Check ancestors for matching tag names
  while (node && node !== this.contentArea) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toUpperCase();
      if (tagNames.includes(tag)) {
        result.push(node as HTMLElement);
      }
    }
    node = node.parentNode;
  }
  
  return result;
}  
  /**
   * Removes specific formatting from the current selection
   * 
   * @param tagNames Array of HTML tags to remove
   */
  removeFormatting(tagNames: string[]): void {
    const range = this.getRange();
    if (!range) return;
    
    console.log("Removing formatting for tags:", tagNames);
    
    // Store original selection points for later restoration
    const savedRange = this.saveSelection();
    
    // Check if this is a word selection (double-click) or line selection (triple-click)
    const isWordOrLineSelection = this.detectWordOrLineSelection(range);
    console.log(`Is word/line selection: ${isWordOrLineSelection}`);
    
    // Normalize tagNames to uppercase for case-insensitive comparison
    const normalizedTagNames = tagNames.map(tag => tag.toUpperCase());
    
    // Special handling for word/line selections
    if (isWordOrLineSelection) {
      // For word/line selection, we need to look at the entire content
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      
      // First, try to directly query elements from cloned content
      let elementsFound = false;
      const elementsToUnwrap: HTMLElement[] = [];
      
      for (const tagName of normalizedTagNames) {
        const elements = Array.from(tempDiv.getElementsByTagName(tagName));
        console.log(`Found ${elements.length} ${tagName} elements in selection`);
        
        if (elements.length > 0) {
          elementsFound = true;
          
          // Special approach for word/line selections:
          // 1. Get the exact HTML content
          const html = tempDiv.innerHTML;
          console.log("Selection HTML:", html);
          
          // 2. Create a replacement with tags removed
          let replacementHtml = html;
          
          // Create a regex to match each tag type
          for (const tag of normalizedTagNames) {
            const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
            const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
            
            // Remove opening and closing tags
            replacementHtml = replacementHtml.replace(openTagRegex, '');
            replacementHtml = replacementHtml.replace(closeTagRegex, '');
          }
          
          console.log("Replacement HTML:", replacementHtml);
          
          // 3. Delete the current selection and insert the unformatted content
          range.deleteContents();
          
          // Create a temporary element to hold the new content
          const replacementDiv = document.createElement('div');
          replacementDiv.innerHTML = replacementHtml;
          
          // Create a document fragment for insertion
          const fragment = document.createDocumentFragment();
          while (replacementDiv.firstChild) {
            fragment.appendChild(replacementDiv.firstChild);
          }
          
          // Insert the replacement content
          range.insertNode(fragment);
          
          // Try to restore selection
          if (savedRange) {
            try {
              this.restoreSelection(savedRange);
            } catch (e) {
              console.warn("Could not restore selection after word/line format removal");
            }
          }
          
          return;
        }
      }
    }
    
    // Standard removal approach (for non-word/line selections or if special handling failed)
    // Method 1: Try direct approach first - find and unwrap elements within range
    const elements = findElementsInRange(range, tagNames);
    console.log("Found elements to remove:", elements.length);
    
    if (elements.length === 0) {
      // Method 2: If no elements found, check if we're inside a formatting element
      const innerElements = this.findFormattingElementsInRange(range, normalizedTagNames);
      
      if (innerElements.length > 0) {
        console.log("Found formatting elements via alternate method:", innerElements.length);
        
        // Unwrap each element
        innerElements.forEach(element => {
          this.unwrapElement(element);
        });
        
        // Try to restore the selection
        if (savedRange) {
          this.restoreSelection(savedRange);
        }
        return;
      }
      
      // Method 3: Try parent nodes approach
      const ancestorElements = this.findFormattingAncestors(range, normalizedTagNames);
      if (ancestorElements.length > 0) {
        console.log("Found formatting ancestors:", ancestorElements.length);
        
        // Unwrap from outside in (in reverse order)
        for (let i = ancestorElements.length - 1; i >= 0; i--) {
          this.unwrapElement(ancestorElements[i]);
        }
        
        // Try to restore the selection
        if (savedRange) {
          this.restoreSelection(savedRange);
        }
        return;
      }
      
      // Method 4: Special handling for cross-node formatting
      if (this.hasFormattingAcrossNodes(range, normalizedTagNames)) {
        console.log("Using special handling for cross-node formatting");
        
        // Get the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(range.cloneContents());
        const html = tempDiv.innerHTML;
        
        // Create a replacement with tags removed
        let replacementHtml = html;
        
        // Remove opening and closing tags for each tag name
        for (const tag of normalizedTagNames) {
          const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
          const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
          
          replacementHtml = replacementHtml.replace(openTagRegex, '');
          replacementHtml = replacementHtml.replace(closeTagRegex, '');
        }
        
        // Replace content
        range.deleteContents();
        
        // Create a temporary element
        const replacementDiv = document.createElement('div');
        replacementDiv.innerHTML = replacementHtml;
        
        // Create a document fragment
        const fragment = document.createDocumentFragment();
        while (replacementDiv.firstChild) {
          fragment.appendChild(replacementDiv.firstChild);
        }
        
        // Insert the replacement content
        range.insertNode(fragment);
        
        // Try to restore the selection
        if (savedRange) {
          try {
            this.restoreSelection(savedRange);
          } catch (e) {
            console.warn("Could not restore selection after cross-node format removal");
          }
        }
        
        return;
      }
      
      // If we get here, we didn't find any elements to unwrap
      console.log("No formatting elements found to remove");
      if (savedRange) {
        this.restoreSelection(savedRange);
      }
      return;
    }
    
    // Process each element that needs formatting removed
    elements.forEach(element => {
      console.log("Unwrapping element:", element.tagName);
      this.unwrapElement(element);
    });
    
    // Try to restore the selection
    if (savedRange) {
      this.restoreSelection(savedRange);
    }
  }
  
  /**
   * Detects if the current selection is a word or line selection (double or triple click)
   * 
   * @param range The range to check
   * @returns True if it appears to be a word/line selection
   */
  private detectWordOrLineSelection(range: Range): boolean {
    // Double-click typically selects a word boundary
    // Triple-click typically selects a paragraph boundary or a line
    
    // Check for typical word selection patterns
    if (range.startContainer === range.endContainer && 
        range.startContainer.nodeType === Node.TEXT_NODE) {
      const text = range.startContainer.textContent || '';
      
      // Word selection usually selects a whole word
      // Look at the selection boundaries relative to word boundaries
      const beforeStart = text.substring(0, range.startOffset).trim();
      const afterEnd = text.substring(range.endOffset).trim();
      const selectedText = text.substring(range.startOffset, range.endOffset).trim();
      
      // If selection starts at a word boundary and ends at a word boundary
      if ((beforeStart === '' || beforeStart.endsWith(' ')) && 
          (afterEnd === '' || afterEnd.startsWith(' ')) &&
          selectedText.indexOf(' ') === -1) {
        console.log("Detected word selection");
        return true;
      }
    }
    
    // Check for line/paragraph selection (triple-click)
    // Triple-click often selects the entire paragraph or line
    if (range.startContainer !== range.endContainer) {
      // Get common ancestor
      let node = range.commonAncestorContainer;
      
      // If it's a text node, check its parent
      if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
        node = node.parentNode;
      }
      
      // If the common ancestor is a block element and the selection
      // appears to cover most of it, treat as a line selection
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (this.isBlockElement(element)) {
          const tempDiv = document.createElement('div');
          tempDiv.appendChild(range.cloneContents());
          
          // If the selection content has similar length to the entire block,
          // it's likely a line selection
          const selectionLength = tempDiv.textContent?.length || 0;
          const elementLength = element.textContent?.length || 0;
          
          if (selectionLength > 0 && selectionLength / elementLength > 0.7) {
            console.log("Detected line/paragraph selection");
            return true;
          }
        }
      }
    }
    
    return false;
  }  
  /**
   * Checks if an element is a block-level element
   * 
   * @param element The element to check
   * @returns True if it's a block element
   */
  private isBlockElement(element: HTMLElement): boolean {
    const blockElements = [
      'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
      'BLOCKQUOTE', 'PRE', 'SECTION', 'ARTICLE', 'LI'
    ];
    
    return blockElements.includes(element.tagName.toUpperCase());
  }
  
  /**
   * Toggles formatting on the current selection
   * 
   * @param tagNames Array of HTML tags to check for
   * @param defaultTag Tag to use when adding formatting
   */
  toggleFormatting(tagNames: string[], defaultTag: string): void {
    // Store current selection state
    const range = this.getRange();
    if (!range) return;
    
    // Check selection type (helpful for debugging)
    const isWordSelection = this.detectWordOrLineSelection(range);
    
    // Check if formatting exists
    const hasFormat = this.hasFormatting(tagNames);
    
    console.log(`Toggle formatting: Has format? ${hasFormat}, Tags: ${tagNames.join(',')}, Default: ${defaultTag}`);
    console.log(`Selection range: start=${range.startContainer.nodeName}[${range.startOffset}], end=${range.endContainer.nodeName}[${range.endOffset}]`);
    console.log(`Is word/line selection: ${isWordSelection}`);
    
    // Get more details about the selection
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(range.cloneContents());
    console.log(`Selection HTML: ${tempDiv.innerHTML}`);
    console.log(`Selection text: ${tempDiv.textContent}`);
    
    if (hasFormat) {
      console.log("Removing formatting");
      this.removeFormatting(tagNames);
    } else {
      console.log("Adding formatting");
      this.addFormatting(defaultTag);
    }
    
    // Ensure the editor regains focus
    if (this.contentArea) {
      this.contentArea.focus();
    }
  }
  
  /**
   * Helper method to unwrap an element while preserving its contents
   * 
   * @param element Element to unwrap
   */
  private unwrapElement(element: Element): void {
    // Validate inputs
    if (!element || !element.parentNode) {
      console.warn('Cannot unwrap element: Invalid element or no parent node');
      return;
    }
    
    const parent = element.parentNode;
    
    console.log(`Unwrapping ${element.tagName} element with ${element.childNodes.length} children`);
    
    try {
      // Create a range to remember position
      const range = document.createRange();
      range.selectNode(element);
      
      // Create a document fragment and copy children
      const fragment = document.createDocumentFragment();
      
      // Move all children to the fragment
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      
      // Insert the fragment before the element
      parent.insertBefore(fragment, element);
      
      // Remove the now-empty element
      parent.removeChild(element);
      
      // Try to restore the selection at the right spot
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.setEnd(range.endContainer, range.endOffset);
      
      // Update selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (e) {
      console.error('Error unwrapping element:', e);
      
      // Fallback approach - insert nodes one at a time
      try {
        // Move children before the element
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        
        // Remove the empty element
        parent.removeChild(element);
      } catch (e2) {
        console.error('Fallback unwrapping failed:', e2);
      }
    }
  }
  
  /**
   * Helper to select a specific node
   * 
   * @param node Node to select
   */
  private selectNode(node: Node): void {
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = document.createRange();
    range.selectNodeContents(node);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
}