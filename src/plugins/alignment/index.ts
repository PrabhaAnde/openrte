import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { AlignmentModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

type AlignType = 'left' | 'center' | 'right' | 'justify';

export class AlignmentPlugin extends BasePlugin {
  private alignButtons: Map<AlignType, HTMLElement> = new Map();
  private currentAlignment: AlignType = 'left';
  private modelAdapter: AlignmentModelAdapter;

  constructor() {
    // We'll override the createToolbarControl method, so we use an empty label here
    super('alignment', null, '', 'openrte-alignment-control');
    
    // Initialize model adapter
    this.modelAdapter = new AlignmentModelAdapter();
  }

  init(editor: Editor): void {
    super.init(editor);
    
    // Add selection change listener to update button states
    document.addEventListener('selectionchange', this.updateButtonStates);
    
    // Add listener for custom selection update event
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('selectionupdate', this.updateButtonStates);
    }
  }

  /**
   * Return the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * DOM-based execution (for backward compatibility)
   */
  protected executeDOMBased(alignment?: AlignType): void {
    if (!this.editor || !alignment) return;
    
    this.applyAlignment(alignment);
  }
  
  execute(): void {
    // This is a container plugin, so the main execute is not used
    // Instead, each alignment type has its own execute method
    // The base class execute() will use the model adapter if available
  }

  createToolbarControl(): HTMLElement {
    // Create a container for alignment buttons
    const container = document.createElement('div');
    container.className = 'openrte-alignment-container';
    container.style.display = 'flex';
    
    // Create buttons for each alignment type
    this.createAlignButton('left', container);
    this.createAlignButton('center', container);
    this.createAlignButton('right', container);
    this.createAlignButton('justify', container);
    
    return container;
  }
  
  private createAlignButton(type: AlignType, container: HTMLElement): void {
    const button = document.createElement('button');
    button.className = `openrte-button openrte-align-${type}-button`;
    button.title = `Align ${type}`;
    
    // Add the icon
    const iconName = `align${type.charAt(0).toUpperCase() + type.slice(1)}` as any; // Cast to any for now
    const iconElement = createIcon(iconName);
    button.appendChild(iconElement);
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.applyAlignment(type);
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Add button to the container
    container.appendChild(button);
    
    // Store button reference
    this.alignButtons.set(type, button);
  }
  
  private applyAlignment(type: AlignType): void {
    if (!this.editor) return;
    
    this.currentAlignment = type;
    
    // Check if we can use the model adapter
    if (this.supportsDocumentModel() && this.editor.getDocumentModel() && this.editor.getDocumentRange()) {
      // Use model-based execution
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        this.modelAdapter.applyToModel(model, range, { alignment: type });
        this.editor.renderDocument();
        
        // Emit event for model execution
        this.emitEvent('model-execute', {
          model,
          range,
          plugin: this,
          alignment: type
        });
      }
    } else {
      // Fall back to DOM-based execution
      const selectionManager = this.editor.getSelectionManager();
      selectionManager.applyToSelection(range => {
        this.applyAlignmentToRange(range, type);
      });
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private applyAlignmentToRange(range: Range, alignment: AlignType): void {
    if (!this.editor) return;
    
    // Find the block element containing the selection
    let node: Node | null = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Find the closest block-level element
    const blockElement = this.findBlockElement(node as HTMLElement);
    
    if (blockElement) {
      // Apply alignment
      blockElement.style.textAlign = alignment;
    } else {
      // If no block element, wrap the selection in a div with alignment
      const div = document.createElement('div');
      div.style.textAlign = alignment;
      
      try {
        // Try to surround the selection with a div
        range.surroundContents(div);
      } catch (e) {
        // Handle more complex selections
        const fragment = range.extractContents();
        div.appendChild(fragment);
        range.insertNode(div);
      }
    }
  }
  
  private findBlockElement(element: HTMLElement): HTMLElement | null {
    if (!this.editor) return null;
    
    let current: HTMLElement | null = element;
    
    while (current && current !== this.editor.getContentArea()) {
      const display = window.getComputedStyle(current).display;
      
      // Check if it's a block-level element
      if (display === 'block' || display === 'flex' || display === 'grid' ||
          current.tagName === 'P' || 
          current.tagName === 'DIV' || 
          current.tagName === 'H1' || 
          current.tagName === 'H2' || 
          current.tagName === 'H3' || 
          current.tagName === 'H4' || 
          current.tagName === 'H5' || 
          current.tagName === 'H6' || 
          current.tagName === 'BLOCKQUOTE') {
        return current;
      }
      
      current = current.parentElement;
    }
    
    return null;
  }
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    let currentAlignment: AlignType = 'left'; // Default
    
    // Check if we can use the model adapter
    if (this.supportsDocumentModel() && this.editor.getDocumentModel() && this.editor.getDocumentRange()) {
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        const state = this.modelAdapter.getStateFromModel(model, range);
        if (state && state.alignment) {
          currentAlignment = state.alignment;
        }
      }
    } else {
      // Fall back to DOM-based state detection
      const range = this.editor.getSelectionManager().getRange();
      if (!range) return;
      
      // Find the block element
      let node: Node | null = range.commonAncestorContainer;
      
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      
      const blockElement = this.findBlockElement(node as HTMLElement);
      
      if (blockElement) {
        const textAlign = blockElement.style.textAlign ||
                         window.getComputedStyle(blockElement).textAlign;
        
        if (textAlign === 'left' || textAlign === 'center' ||
            textAlign === 'right' || textAlign === 'justify') {
          currentAlignment = textAlign as AlignType;
        }
      }
    }
    
    // Update button states
    this.alignButtons.forEach((button, type) => {
      button.classList.toggle('active', type === currentAlignment);
    });
  }
  
  destroy(): void {
    document.removeEventListener('selectionchange', this.updateButtonStates);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('selectionupdate', this.updateButtonStates);
    }
    
    super.destroy();
  }
}