import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createColorPicker, ColorOption } from '../../ui/color-picker';
import { createIcon } from '../../ui/icon';

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
    
    // Add selection listener to ensure we can detect color in selection
    document.addEventListener('selectionchange', this.updateColorState);
  }

  init(editor: Editor): void {
    super.init(editor);
    
    // Add listener for the custom selection update event
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateColorState);
    }
  }

  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    
    // Clear existing content and add the proper icon
    button.innerHTML = '';
    button.appendChild(createIcon('textColor'));
    
    // Add color indicator
    const colorIndicator = document.createElement('div');
    colorIndicator.style.width = '100%';
    colorIndicator.style.height = '3px';
    colorIndicator.style.backgroundColor = this.currentColor;
    colorIndicator.style.position = 'absolute';
    colorIndicator.style.bottom = '0';
    colorIndicator.style.left = '0';
    colorIndicator.style.borderRadius = '0 0 3px 3px';
    button.appendChild(colorIndicator);
    
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
  
  private updateColorState = (): void => {
    if (!this.editor) return;
    
    const range = this.editor.getSelectionManager().getRange();
    if (!range) return;
    
    // Find current color in selection
    let currentColor = this.getSelectionColor(range);
    
    // Update button indicator if a color is found
    if (currentColor) {
      const indicator = this.button.querySelector('div');
      if (indicator) {
        indicator.style.backgroundColor = currentColor;
      }
      this.currentColor = currentColor;
    }
  };
  
  private getSelectionColor(range: Range): string | null {
    if (!this.editor) return null;
    
    // If range is collapsed (cursor only), check ancestors
    if (range.collapsed) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }
      
      return this.getNodeColor(node as HTMLElement);
    }
    
    // For actual selections, check if there's a span with color
    const existingColorSpan = this.findExistingColorSpan(range);
    if (existingColorSpan && existingColorSpan.style.color) {
      return existingColorSpan.style.color;
    }
    
    return null;
  }
  
  private getNodeColor(element: HTMLElement): string | null {
    if (!element) return null;
    
    // Check if element has a color style
    if (element.style && element.style.color) {
      return element.style.color;
    }
    
    // Check computed style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.color !== 'rgb(0, 0, 0)') { // Not default black
      return computedStyle.color;
    }
    
    return null;
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
  
  destroy(): void {
    document.removeEventListener('click', this.closeColorPicker);
    document.removeEventListener('selectionchange', this.updateColorState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateColorState);
    }
    
    if (this.colorPicker.parentNode) {
      this.colorPicker.parentNode.removeChild(this.colorPicker);
    }
    super.destroy();
  }
}