// src/index.ts
import { Editor } from './core/editor';
export { Editor } from './core/editor';
export { OpenRTE } from './adapters/react';
import './styles/editor.css';
export type { ContentModel } from './types/contentModel';

export function createEditor(element: HTMLElement): Editor {
  return new Editor(element);
}