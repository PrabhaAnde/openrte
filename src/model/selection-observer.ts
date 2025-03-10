import { SelectionModel } from './selection-model';
import { Editor } from '../core/editor';

export class SelectionObserver {
  private editor: Editor;
  private selectionModel: SelectionModel;
  private observing: boolean = false;
  
  constructor(editor: Editor, selectionModel: SelectionModel) {
    this.editor = editor;
    this.selectionModel = selectionModel;
  }
  
  /**
   * Start observing selection changes
   */
  startObserving(): void {
    if (this.observing) return;
    
    document.addEventListener('selectionchange', this.handleSelectionChange);
    this.editor.getContentArea().addEventListener('mouseup', this.handleMouseUp);
    this.editor.getContentArea().addEventListener('keyup', this.handleKeyUp);
    
    this.observing = true;
    
    // Initial sync
    this.syncSelectionFromDOM();
  }
  
  /**
   * Stop observing selection changes
   */
  stopObserving(): void {
    if (!this.observing) return;
    
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    this.editor.getContentArea().removeEventListener('mouseup', this.handleMouseUp);
    this.editor.getContentArea().removeEventListener('keyup', this.handleKeyUp);
    
    this.observing = false;
  }
  
  /**
   * Sync DOM selection to model
   */
  private syncSelectionFromDOM(): void {
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      // Get current state before converting to model
      console.log(`Syncing DOM range: ${range.startContainer.nodeName}[${range.startOffset}] to ${range.endContainer.nodeName}[${range.endOffset}]`);
      
      // Always create a fresh model selection
      const result = this.selectionModel.fromDOMRange(range);
      console.log(`DOM->Model sync result: ${result ? 'success' : 'failed'}`);
      
      if (result && this.editor.getPluginRegistry()) {
        this.editor.getPluginRegistry().emit('editor:modelselectionchange', {
          selectionModel: this.selectionModel,
          editor: this.editor
        });
      }
    }
  }
  
  /**
   * Handle selection change event
   */
  private handleSelectionChange = (): void => {
    // Check if selection is in editor
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const contentArea = this.editor.getContentArea();
    
    // Check if selection is within the editor
    let node: Node | null = range.commonAncestorContainer;
    while (node) {
      if (node === contentArea) {
        this.syncSelectionFromDOM();
        return;
      }
      node = node.parentNode;
    }
  };
  
  /**
   * Handle mouse up event
   */
  private handleMouseUp = (): void => {
    // Use setTimeout to ensure selection is complete
    setTimeout(() => {
      this.syncSelectionFromDOM();
    }, 0);
  };
  
  /**
   * Handle key up event
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    // Only sync on navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      this.syncSelectionFromDOM();
    }
  };
}