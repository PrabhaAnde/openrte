import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createColorPicker, ColorOption } from '../../ui/color-picker';

export class TextColorPlugin extends BasePlugin {
  private colorPicker: HTMLElement;
  private currentColor: string = 'black';
  
  // Default color options
  private colors: ColorOption[] = [
    { color: 'black', label: 'Black' },
    { color: 'red', label: 'Red' },
    { color: 'blue', label: 'Blue' },
    { color: 'green', label: 'Green' },
    { color: 'yellow', label: 'Yellow' },
    { color: 'purple', label: 'Purple' },
    { color: 'orange', label: 'Orange' },
    { color: 'white', label: 'White' }
  ];
  
  constructor() {
    super('textColor', null, 'Text Color', 'openrte-text-color-button');
    
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
    // Create a colored A text or use a custom icon
    const colorSwatch = document.createElement('span');
    colorSwatch.textContent = 'A';
    colorSwatch.style.color = 'currentColor';
    button.appendChild(colorSwatch);
    return button;
  }
  
  execute(): void {
    if (!this.editor) return;
    
    const selectionManager = this.editor.getSelectionManager();
    selectionManager.applyToSelection(this.applyTextColor.bind(this));
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
  
  private applyTextColor(range: Range): void {
    if (range.collapsed) return;
    
    // Store current selection for restoration
    const savedSelection = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
    
    // Find if the selection is already inside a text color span
    const existingColorSpan = this.findExistingColorSpan(range);
    
    if (existingColorSpan) {
      // Update existing span's color
      existingColorSpan.style.color = this.currentColor;
    } else {
      // Create a new span with the color
      const span = document.createElement('span');
      span.style.color = this.currentColor;
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // Handle complex selections
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
    }
    
    // Hide the color picker after selection
    this.colorPicker.style.display = 'none';
    
    // Restore selection - makes the change visible and allows immediate follow-up edits
    try {
      if (this.editor) {
        const newRange = document.createRange();
        newRange.setStart(savedSelection.startContainer, savedSelection.startOffset);
        newRange.setEnd(savedSelection.endContainer, savedSelection.endOffset);
        this.editor.getSelectionManager().setRange(newRange);
      }
    } catch (e) {
      console.warn('Could not restore selection after color change');
    }
  }  
  // Helper method to find existing color span that contains the current selection
  private findExistingColorSpan(range: Range): HTMLElement | null {
    if (!this.editor) return null;
    
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    
    // Look up to find a span with color that fully contains the selection
    while (current && current !== this.editor.getContentArea()) {
      if (current.nodeName === 'SPAN' && 
          current.style && 
          current.style.color && 
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
  
  destroy(): void {
    document.removeEventListener('click', this.closeColorPicker);
    if (this.colorPicker.parentNode) {
      this.colorPicker.parentNode.removeChild(this.colorPicker);
    }
    super.destroy();
  }
}