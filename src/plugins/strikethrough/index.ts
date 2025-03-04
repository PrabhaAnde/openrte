import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { StrikethroughModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

/**
 * Plugin for strikethrough text formatting
 */
export class StrikethroughPlugin extends FormattingPlugin {
  /**
   * The model adapter for this plugin
   */
  private modelAdapter: StrikethroughModelAdapter;
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'strikethrough', 
      'strikethrough', 
      'Strikethrough', 
      'openrte-strikethrough-button',
      { tagNames: ['S', 'STRIKE', 'DEL'], defaultTag: 's' }
    );
    
    // Initialize model adapter
    this.modelAdapter = new StrikethroughModelAdapter();
  }
  
  /**
   * Initialize the plugin
   */
  init(editor: Editor): void {
    super.init(editor);
    
    // Add keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Create toolbar button
   */
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('strikethrough'));
    return button;
  }
  
  /**
   * Get the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * Handle keyboard shortcut (Ctrl+Shift+S)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+Shift+S shortcut
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
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