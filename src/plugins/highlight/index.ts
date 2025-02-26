import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createColorPicker, ColorOption } from '../../ui/color-picker';

export class HighlightPlugin extends BasePlugin {
  private colorPicker: HTMLElement;
  private currentColor: string = 'yellow';
  
  // Default color options
  private colors: ColorOption[] = [
    { color: 'yellow', label: 'Yellow' },
    { color: 'lightgreen', label: 'Green' },
    { color: 'lightblue', label: 'Blue' },
    { color: 'pink', label: 'Pink' },
    { color: 'orange', label: 'Orange' },
    { color: '#cccccc', label: 'Gray' },
    { color: 'white', label: 'White' },
    { color: 'transparent', label: 'None' }
  ];
  
  constructor() {
      super('highlight', null, 'Highlight', 'openrte-highlight-button');

   
    
    // Add indicator to the button
    this.button.style.position = 'relative';
    const colorIndicator = document.createElement('div');
    colorIndicator.style.width = '100%';
    colorIndicator.style.height = '3px';
    colorIndicator.style.backgroundColor = this.currentColor;
    colorIndicator.style.position = 'absolute';
    colorIndicator.style.bottom = '0';
    colorIndicator.style.left = '0';
    colorIndicator.style.borderRadius = '0 0 3px 3px';
    this.button.appendChild(colorIndicator);
    
    // Create color picker
    this.colorPicker = createColorPicker(this.colors, this.onColorSelect.bind(this));
    document.body.appendChild(this.colorPicker);
    
    // Modify button behavior to show color picker
    this.button.removeEventListener('click', this.handleClick);
    this.button.addEventListener('click', this.toggleColorPicker.bind(this));
    
    // Close color picker when clicking outside
    document.addEventListener('click', this.closeColorPicker.bind(this));
  }

  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    // Create a custom highlight icon or use text
    button.textContent = 'H'; // Or create a custom highlight icon
    return button;
  }
  
  execute(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(this.applyHighlight.bind(this));
  }
  
  private toggleColorPicker(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle visibility
    if (this.colorPicker.style.display === 'none') {
      // Position the color picker below the button
      const rect = this.button.getBoundingClientRect();
      this.colorPicker.style.top = `${rect.bottom + window.scrollY}px`;
      this.colorPicker.style.left = `${rect.left + window.scrollX}px`;
      this.colorPicker.style.display = 'block';
    } else {
      this.colorPicker.style.display = 'none';
    }
  }
  
  private closeColorPicker(event: MouseEvent): void {
    // Skip if clicking the button
    if (event.target === this.button || this.button.contains(event.target as Node)) {
      return;
    }
    
    // Skip if clicking inside the color picker
    if (this.colorPicker.contains(event.target as Node)) {
      return;
    }
    
    this.colorPicker.style.display = 'none';
  }
  
  private onColorSelect(color: string): void {
    this.currentColor = color;
    
    // Update the color indicator
    const indicator = this.button.querySelector('div');
    if (indicator) {
      indicator.style.backgroundColor = color;
    }
    
    // Apply the color to the selection
    this.execute();
  }
  
  private applyHighlight(range: Range): void {
    if (range.collapsed) return;
    
    // Store current selection for restoration
    const savedSelection = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
    
    // If color is 'transparent', remove highlight instead
    if (this.currentColor === 'transparent') {
      this.removeHighlight(range);
    } else {
      // Check for existing highlighted span
      const existingHighlightSpan = this.findExistingHighlightSpan(range);
      
      if (existingHighlightSpan) {
        // Update existing span's background color
        existingHighlightSpan.style.backgroundColor = this.currentColor;
      } else {
        // Create a new span with the background color
        const span = document.createElement('span');
        span.style.backgroundColor = this.currentColor;
        
        try {
          range.surroundContents(span);
        } catch (e) {
          // Handle complex selections
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
      }
    }
    
    // Hide the color picker after application
    this.colorPicker.style.display = 'none';
    
    // Restore selection - makes the change visible and allows immediate follow-up edits
    try {
      if (this.editor) {
        const newRange = document.createRange();
        newRange.setStart(savedSelection.startContainer, savedSelection.startOffset);
        newRange.setEnd(savedSelection.endContainer, savedSelection.endOffset);
        this.editor.getSelectionManager().setRange(newRange);
        
        // Focus back on the editor
        this.editor.focus();
      }
    } catch (e) {
      console.warn('Could not restore selection after highlight change');
    }
  }

  // Helper method to find existing highlight span that contains the current selection
  private findExistingHighlightSpan(range: Range): HTMLElement | null {
    if (!this.editor) return null;
    
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    
    // Look up to find a span with background-color that fully contains the selection
    while (current && current !== this.editor.getContentArea()) {
      if (current.nodeName === 'SPAN' && 
          current.style && 
          current.style.backgroundColor && 
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
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(element);
    
    return nodeRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0 &&
                nodeRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0;
  }
  
  private removeHighlight(range: Range): void {
    if (!this.editor) return;
    
    // Create a clone of the range to avoid modification issues
    const clonedRange = range.cloneRange();
    
    // Get all nodes in the selection
    const iterator = document.createNodeIterator(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          // Check if node is at least partially within range
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          
          const isStartBeforeEnd = nodeRange.compareBoundaryPoints(Range.START_TO_END, clonedRange) <= 0;
          const isEndAfterStart = nodeRange.compareBoundaryPoints(Range.END_TO_START, clonedRange) >= 0;
          
          if (isStartBeforeEnd && isEndAfterStart) {
            if (node.nodeName === 'SPAN' && 
                (node as HTMLElement).style && 
                (node as HTMLElement).style.backgroundColor) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      } as NodeFilter
    );
    
    // Collect spans to process
    const highlightSpans: HTMLElement[] = [];
    let currentNode;
    while (currentNode = iterator.nextNode()) {
      highlightSpans.push(currentNode as HTMLElement);
    }
    
    // Process each highlight span
    highlightSpans.forEach(span => {
      span.style.backgroundColor = '';
      // If the element has no more styles, unwrap it
      if (!span.style.length) {
        this.unwrapElement(span);
      }
    });
  }
  
  private unwrapElement(element: HTMLElement): void {
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }
  }
  
  destroy(): void {
    document.removeEventListener('click', this.closeColorPicker);
    if (this.colorPicker.parentNode) {
      this.colorPicker.parentNode.removeChild(this.colorPicker);
    }
    super.destroy();
  }
}