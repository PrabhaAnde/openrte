import { Editor } from './core/editor';
export { Editor } from './core/editor';
export { OpenRTE } from './adapters/react';
import './styles/editor.css';
export function createEditor(element) {
    return new Editor(element);
}
