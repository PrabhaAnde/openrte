import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { UnderlineModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

/**
 * Plugin for underline text formatting
 */
export class UnderlinePlugin extends FormattingPlugin {
  /**
   * The model adapter for this plugin
   */
  private modelAdapter: UnderlineModelAdapter;
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'underline', 
      'underline', 
      'Underline', 
      'openrte-underline-button',
      { tagNames: ['U'], defaultTag: 'u' }
    );
    
    // Initialize model adapter
    this.modelAdapter = new UnderlineModelAdapter();
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
    button.appendChild(createIcon('underline'));
    return button;
  }
  
  /**
   * Get the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  /**
   * Handle keyboard shortcut (Ctrl+U / Cmd+U)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+U / Cmd+U
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
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