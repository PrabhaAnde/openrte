import { Editor } from './editor';

export interface Plugin {
  init(editor: Editor): void;
  destroy(): void;
}