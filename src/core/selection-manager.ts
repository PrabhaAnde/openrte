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
    
    // Apply formatting to selection
    applyToSelection(callback: (range: Range) => void): void {
      const range = this.getRange();
      if (range) {
        callback(range);
      }
    }
  }