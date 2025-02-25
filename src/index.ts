import { Editor } from './core/editor';
import './styles/editor.css';
 // Register default plugins
 import { 
  BoldPlugin, 
  ItalicPlugin, 
  UnderlinePlugin, 
  StrikethroughPlugin,
  TextColorPlugin,
  HighlightPlugin
} from './plugins';

// Re-export core classes
export { Editor } from './core/editor';
export { Plugin } from './types/plugin';
export { BasePlugin } from './plugins/base-plugin';
export { SelectionManager } from './core/selection-manager';

// Export plugins
export * from './plugins';

// Create and return editor instance with default plugins
export function createEditor(element: HTMLElement): Editor {
  const editor = new Editor(element);
  
 
  
  editor.registerPlugin(new BoldPlugin());
  editor.registerPlugin(new ItalicPlugin());
  editor.registerPlugin(new UnderlinePlugin());
  editor.registerPlugin(new StrikethroughPlugin());
  editor.registerPlugin(new TextColorPlugin());
  editor.registerPlugin(new HighlightPlugin());
  
  return editor;
}