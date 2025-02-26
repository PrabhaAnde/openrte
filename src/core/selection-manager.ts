export class SelectionManager {
    private contentArea: HTMLElement;
    
    constructor(contentArea: HTMLElement) {
      this.contentArea = contentArea;
    }
    
    // Get current selection if it's within the editor
    getSelection(): Selection | null {
      const selection = window.getSelection();
      if (!selection) return null;
      
      // Check if selection is within the editor
      let node = selection.anchorNode;
      while (node && node !== this.contentArea) {
        node = node.parentNode;
      }
      
      return node ? selection : null;
    }
    
    // Get current range
    getRange(): Range | null {
      const selection = this.getSelection();
      return selection?.rangeCount ? selection.getRangeAt(0) : null;
    }
    
    // Save current selection
    saveSelection(): Range | null {
      const range = this.getRange();
      return range ? range.cloneRange() : null;
    }
    
    // Restore a saved selection
    restoreSelection(range: Range): void {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    /**
     * Sets the current selection to the provided range
     * @param range Range to set as the current selection
     * @returns boolean indicating if setting the range was successful
     */
    setRange(range: Range): boolean {
      const selection = window.getSelection();
      if (!selection) return false;
      
      try {
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      } catch (e) {
        console.warn('Failed to set selection range:', e);
        return false;
      }
    }
    
    // Apply formatting to selection
    applyToSelection(callback: (range: Range) => void): void {
      const range = this.getRange();
      if (range) {
        callback(range);
      }
    }
    
    // New methods for formatting support
    
    /**
     * Checks if the current selection has specific formatting
     * @param tagNames Array of HTML tag names to check for
     * @returns boolean indicating if selection has the formatting
     */
    hasFormatting(tagNames: string[]): boolean {
      const range = this.getRange();
      if (!range) return false;
      
      // Special case for collapsed selections (cursor only)
      if (range.collapsed) {
        let node: Node | null = range.commonAncestorContainer;
        
        // Check if text node
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        
        // Check parent nodes for formatting
        while (node && node !== this.contentArea) {
          if (tagNames.includes(node.nodeName)) {
            return true;
          }
          node = node.parentNode;
        }
        
        return false;
      }
      
      // For non-collapsed selections, check if any part has formatting
      const fragment = range.cloneContents();
      const temp = document.createElement('div');
      temp.appendChild(fragment);
      
      // Check if any direct formatting tags exist
      for (const tagName of tagNames) {
        if (temp.querySelector(tagName.toLowerCase())) {
          return true;
        }
      }
      
      // Check if the selection is inside a formatting tag
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      
      while (node && node !== this.contentArea) {
        if (tagNames.includes(node.nodeName)) {
          return true;
        }
        node = node.parentNode;
      }
      
      return false;
    }
    
    /**
     * Applies formatting to the current selection
     * @param tagName HTML tag to wrap selection with
     */
    addFormatting(tagName: string): void {
      const range = this.getRange();
      if (!range) return;
      
      const element = document.createElement(tagName);
      
      try {
        range.surroundContents(element);
      } catch (e) {
        // Handle complex selections
        const fragment = range.extractContents();
        element.appendChild(fragment);
        range.insertNode(element);
      }
      
      // Restore selection
      this.selectNode(element);
    }
    
    /**
     * Removes specific formatting from the current selection
     * @param tagNames Array of HTML tags to remove
     */
    removeFormatting(tagNames: string[]): void {
      const range = this.getRange();
      if (!range) return;
      
      // Get the selected content
      const selection = this.getSelection();
      if (!selection) return;
      
      // Extract the content
      const content = range.extractContents();
      
      // Process the content to remove formatting
      const temp = document.createElement('div');
      temp.appendChild(content);
      
      // Remove all instances of the specified tags
      tagNames.forEach(tagName => {
        const elements = temp.getElementsByTagName(tagName);
        
        // We need to iterate backwards as the collection is live
        for (let i = elements.length - 1; i >= 0; i--) {
          const element = elements[i];
          this.unwrapElement(element);
        }
      });
      
      // Insert the processed content
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      
      range.insertNode(fragment);
      
      // Restore selection
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    /**
     * Toggles formatting on the current selection
     * @param tagNames Array of HTML tags to check for
     * @param defaultTag Tag to use when adding formatting
     */
    toggleFormatting(tagNames: string[], defaultTag: string): void {
      if (this.hasFormatting(tagNames)) {
        this.removeFormatting(tagNames);
      } else {
        this.addFormatting(defaultTag);
      }
    }
    
    /**
     * Helper method to unwrap an element while preserving its contents
     */
    private unwrapElement(element: Element): void {
      const parent = element.parentNode;
      if (!parent) return;
      
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      
      parent.removeChild(element);
    }
    
    /**
     * Helper to select a specific node
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