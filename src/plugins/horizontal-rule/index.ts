import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class HorizontalRulePlugin extends BasePlugin {
  constructor() {
    super('horizontalRule', 'horizontalRule', 'Insert Horizontal Rule', 'openrte-horizontal-rule-button');
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
  
  destroy(): void {
    super.destroy();
  }
}