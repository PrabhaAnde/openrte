import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { ItalicModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

/**
 * Plugin for italic text formatting
 */
export class ItalicPlugin extends FormattingPlugin {
  /**
   * The model adapter for this plugin
   */
  private modelAdapter: ItalicModelAdapter;
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'italic', 
      'italic', 
      'Italic', 
      'openrte-italic-button',
      { tagNames: ['I', 'EM'], defaultTag: 'em' }
    );
    
    // Initialize model adapter
    this.modelAdapter = new ItalicModelAdapter();
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
    button.appendChild(createIcon('italic'));
    return button;
  }
  
  /**
   * Get the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * Handle keyboard shortcut (Ctrl+I / Cmd+I)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+I / Cmd+I
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
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