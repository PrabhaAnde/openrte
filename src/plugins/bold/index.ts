import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { BoldModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

/**
 * Plugin for bold text formatting
 */
export class BoldPlugin extends FormattingPlugin {
  /**
   * The model adapter for this plugin
   */
  private modelAdapter: BoldModelAdapter;
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'bold', 
      'bold', 
      'Bold', 
      'openrte-bold-button',
      { tagNames: ['B', 'STRONG'], defaultTag: 'strong' }
    );
    
    // Initialize model adapter
    this.modelAdapter = new BoldModelAdapter();
  }
  
  /**
   * Initialize the plugin
   * 
   * @param editor Editor instance
   */
  init(editor: Editor): void {
    super.init(editor);
    
    // Add keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Create toolbar button
   * 
   * @returns Toolbar button element
   */
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('bold'));
    return button;
  }
  
  /**
   * Get the model adapter for this plugin
   * 
   * @returns Model adapter
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * Handle keyboard shortcut (Ctrl+B / Cmd+B)
   * 
   * @param event Keyboard event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+B / Cmd+B
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.execute();
    }
  };
  
  /**
   * Clean up resources
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}