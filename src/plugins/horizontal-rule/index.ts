import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { HorizontalRuleModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class HorizontalRulePlugin extends BasePlugin {
  private modelAdapter: HorizontalRuleModelAdapter;
  constructor() {
    super('horizontalRule', 'horizontalRule', 'Insert Horizontal Rule', 'openrte-horizontal-rule-button');
    
    // Initialize model adapter
    this.modelAdapter = new HorizontalRuleModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    // Clear any existing content and add the icon
    button.innerHTML = '';
    button.appendChild(createIcon('horizontalRule'));
    return button;
  }
  
  execute(): void {
    super.execute();
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    if (!this.editor) return;
    
    const hr = document.createElement('hr');
    const range = this.editor.getSelectionManager().getRange();
    if (range) {
      range.deleteContents();
      range.insertNode(hr);
      // Update the range
      range.setStartAfter(hr);
      range.collapse(true);
      // Update selection with this range
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  
  /**
   * Get the model adapter for this plugin
   *
   * @returns The model adapter
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  destroy(): void {
    super.destroy();
  }
}