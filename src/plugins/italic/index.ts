import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { ItalicModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class ItalicPlugin extends FormattingPlugin {
  private modelAdapter: ItalicModelAdapter;
  
  constructor() {
    super(
      'italic',
      'italic',
      'Italic',
      'openrte-italic-button',
      {
        tagNames: ['I', 'EM'],
        defaultTag: 'em',
        command: 'italic'
      }
    );
    this.modelAdapter = new ItalicModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('italic'));
    return button;
  }
  
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}