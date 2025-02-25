import { Editor } from './core/editor';
import './styles/editor.css';

// Register default plugins
import { 
  // Text formatting plugins
  BoldPlugin, 
  ItalicPlugin, 
  UnderlinePlugin, 
  StrikethroughPlugin,
  TextColorPlugin,
  HighlightPlugin,
  
  // Paragraph formatting plugins
  AlignmentPlugin,
  ListsPlugin,
  IndentationPlugin,
  BlockFormatPlugin,
  LineSpacingPlugin
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
  
  // Register text formatting plugins
  editor.registerPlugin(new BoldPlugin());
  editor.registerPlugin(new ItalicPlugin());
  editor.registerPlugin(new UnderlinePlugin());
  editor.registerPlugin(new StrikethroughPlugin());
  editor.registerPlugin(new TextColorPlugin());
  editor.registerPlugin(new HighlightPlugin());
  
  // Register paragraph formatting plugins
  editor.registerPlugin(new AlignmentPlugin());
  editor.registerPlugin(new ListsPlugin());
  editor.registerPlugin(new IndentationPlugin());
  editor.registerPlugin(new BlockFormatPlugin());
  editor.registerPlugin(new LineSpacingPlugin());
  
  return editor;
}