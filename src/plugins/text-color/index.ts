import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createColorPicker, ColorOption } from '../../ui/color-picker';
import { createIcon } from '../../ui/icon';
import { TextColorModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

/**
 * Plugin for text color formatting
 */
export class TextColorPlugin extends BasePlugin {
  /**
   * The model adapter for this plugin
   */
  private modelAdapter: TextColorModelAdapter;
  
  /**
   * Color picker element
   */
  private colorPicker: HTMLElement;
  
  /**
   * Current color
   */
  private currentColor: string = 'black';
  
  /**
   * Default color options
   */
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
  
  /**
   * Constructor
   */
  constructor() {
    super('textColor', 'textColor', 'Text Color', 'openrte-text-color-button');
    
    // Initialize model adapter
    this.modelAdapter = new TextColorModelAdapter();
    
    // Create color picker
    this.colorPicker = createColorPicker(this.colors, this.onColorSelect.bind(this));
    document.body.appendChild(this.colorPicker);
    
    // Modify button behavior to show color picker
    this.button.removeEventListener('click', this.handleClick);
    this.button.addEventListener('click', this.toggleColorPicker.bind(this));
    
    // Close color picker when clicking outside
    document.addEventListener('click', this.closeColorPicker.bind(this));
  }
  
  /**
   * Initialize the plugin
   */
  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update button state
    document.addEventListener('selectionchange', this.updateColorState);
    
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateColorState);
    }
  }
  
  /**
   * Create toolbar button
   */
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
  
  /**
   * Get the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    // This will be handled by color picker interaction
  }
  
  /**
   * Toggle color picker visibility
   */
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
  
  /**
   * Close color picker when clicking outside
   */
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
  
  /**
   * Handle color selection
   */
  private onColorSelect(color: string): void {
    this.currentColor = color;
    
    // Update the color indicator
    const indicator = this.button.querySelector('div');
    if (indicator) {
      indicator.style.backgroundColor = color;
    }
    
    // Apply color to the selection
    if (this.editor && this.supportsDocumentModel()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        this.modelAdapter.applyToModel(model, range, { color });
        this.editor.renderDocument();
      } else {
        // Fall back to DOM-based approach
        this.applyColorToSelection(color);
      }
    } else {
      // DOM-based approach
      this.applyColorToSelection(color);
    }
    
    // Hide the color picker
    this.colorPicker.style.display = 'none';
    
    // Focus back on the editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  /**
   * Apply color to the current selection (DOM-based)
   */
  private applyColorToSelection(color: string): void {
    if (!this.editor) return;
    
    // Use execCommand for backward compatibility
    document.execCommand('foreColor', false, color);
  }
  
  /**
   * Update color state based on current selection
   */
  private updateColorState = (): void => {
    if (!this.editor) return;
    
    // Try to use model if supported
    if (this.supportsDocumentModel()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        const state = this.modelAdapter.getStateFromModel(model, range);
        if (state.hasColor && state.color) {
          // Update color
          this.currentColor = state.color;
          
          // Update indicator
          const indicator = this.button.querySelector('div');
          if (indicator) {
            indicator.style.backgroundColor = state.color;
          }
        }
      }
    } else {
      // DOM-based approach (simplified)
      // Would need more implementation to extract current text color
    }
  };
  
  /**
   * Clean up resources
   */
  destroy(): void {
    document.removeEventListener('click', this.closeColorPicker);
    document.removeEventListener('selectionchange', this.updateColorState);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateColorState);
    }
    
    // Remove color picker from DOM
    if (this.colorPicker.parentNode) {
      this.colorPicker.parentNode.removeChild(this.colorPicker);
    }
    
    super.destroy();
  }
}