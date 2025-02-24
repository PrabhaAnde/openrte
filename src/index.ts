import { Editor } from './core/editor';
export { Editor } from './core/editor';
export { OpenRTE } from './adapters/react';
export { 
  TextFormattingPlugin, 
  ParagraphFormattingPlugin, 
  TextSizePlugin 
} from './plugins';
import './styles/editor.css';
export type { ContentModel } from './types/contentModel';
export type { Plugin } from './core/plugin';

export function createEditor(element: HTMLElement): Editor {
  return new Editor(element);
}