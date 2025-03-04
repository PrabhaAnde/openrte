import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { IconName } from '../../ui/icon';

/**
 * Plugin for undo and redo functionality
 */
export class UndoRedoPlugin extends BasePlugin {
  private undoButton!: HTMLButtonElement;
  private redoButton!: HTMLButtonElement;
  
  /**
   * Constructor
   */
  constructor() {
    super('undo-redo', null, 'Undo/Redo', 'openrte-undo-redo');
  }
  
  /**
   * Initialize the plugin
   * 
   * @param editor Editor instance
   */
  init(editor: Editor): void {
    super.init(editor);
    
    // Listen for undo/redo events to update button states
    if (this.editor) {
      const registry = this.editor.getPluginRegistry();
      registry.on('editor:undo', this.updateButtonStates);
      registry.on('editor:redo', this.updateButtonStates);
      registry.on('editor:modeloperation', this.updateButtonStates);
      registry.on('editor:contentchange', this.updateButtonStates);
    }
  }
  
  /**
   * Create toolbar control
   * 
   * @returns Toolbar element
   */
  createToolbarControl(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'openrte-undo-redo-container';
    
    // Create undo button
    this.undoButton = document.createElement('button');
    this.undoButton.className = 'openrte-button openrte-undo-button';
    this.undoButton.title = 'Undo (Ctrl+Z)';
    this.undoButton.innerHTML = '↩'; // Unicode undo arrow
    this.undoButton.addEventListener('click', this.handleUndo);
    
    // Create redo button
    this.redoButton = document.createElement('button');
    this.redoButton.className = 'openrte-button openrte-redo-button';
    this.redoButton.title = 'Redo (Ctrl+Y)';
    this.redoButton.innerHTML = '↪'; // Unicode redo arrow
    this.redoButton.addEventListener('click', this.handleRedo);
    
    // Add buttons to container
    container.appendChild(this.undoButton);
    container.appendChild(this.redoButton);
    
    // Initialize button states
    this.updateButtonStates();
    
    return container;
  }
  
  /**
   * Handle undo button click
   */
  private handleUndo = (): void => {
    if (this.editor) {
      this.editor.undo();
    }
  };
  
  /**
   * Handle redo button click
   */
  private handleRedo = (): void => {
    if (this.editor) {
      this.editor.redo();
    }
  };
  
  /**
   * Update button states based on history
   */
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    const historyManager = this.editor.getHistoryManager();
    
    // Update undo button
    this.undoButton.disabled = !historyManager.canUndo();
    
    // Update redo button
    this.redoButton.disabled = !historyManager.canRedo();
  };
  
  /**
   * Execute the plugin
   */
  execute(): void {
    // This plugin doesn't have a direct execute action
    // It's controlled via the toolbar buttons
    super.execute();
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    // This plugin doesn't have a DOM-based implementation
    // It uses the editor's undo/redo methods directly
  }
  
  /**
   * Clean up the plugin
   */
  destroy(): void {
    if (this.editor) {
      this.editor.getPluginRegistry().off('editor:undo', this.updateButtonStates);
      this.editor.getPluginRegistry().off('editor:redo', this.updateButtonStates);
      this.editor.getPluginRegistry().off('editor:modeloperation', this.updateButtonStates);
      this.editor.getPluginRegistry().off('editor:contentchange', this.updateButtonStates);
    }
    
    super.destroy();
  }
}