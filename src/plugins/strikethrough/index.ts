import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { StrikethroughModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class StrikethroughPlugin extends FormattingPlugin {
  private modelAdapter: StrikethroughModelAdapter;
  
  constructor() {
    super(
      'strikethrough',
      'strikethrough',
      'Strikethrough',
      'openrte-strikethrough-button',
      {
        tagNames: ['S', 'STRIKE', 'DEL'],
        defaultTag: 's',
        command: 'strikeThrough'  // Note: camelCase for this command
      }
    );
    this.modelAdapter = new StrikethroughModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('strikethrough'));
    return button;
  }
  
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}