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
    super('highlight', 'H', 'openrte-highlight-button');
    
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
    
    // If color is 'transparent', remove highlight instead
    if (this.currentColor === 'transparent') {
      this.removeHighlight(range);
      return;
    }
    
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
  
  private removeHighlight(range: Range): void {
    if (!this.editor) return;
    
    // Find elements with background color in the current selection
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // If both start and end are the same text node
    if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
      let parentNode = startContainer.parentNode;
      
      while (parentNode && parentNode !== this.editor.getContentArea()) {
        if (parentNode.nodeType === Node.ELEMENT_NODE) {
          const element = parentNode as HTMLElement;
          if (element.style.backgroundColor) {
            // Reset background color
            element.style.backgroundColor = '';
            
            // If the element has no more styles, unwrap it
            if (!element.style.length) {
              this.unwrapElement(element);
            }
            break;
          }
        }
        parentNode = parentNode.parentNode;
      }
    } else {
      // TODO: Handle more complex selections with multiple highlighted elements
      // This is a simplified implementation
      console.log('Complex highlight removal not implemented yet');
    }
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