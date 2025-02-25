import { Editor } from './core/editor';
import './styles/editor.css';

// Import all plugins
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
  LineSpacingPlugin,
  
  // Insert features plugins
  LinkPlugin,
  ImagePlugin,
  TablePlugin,
  HorizontalRulePlugin,
  PageBreakPlugin,
  
  // Advanced features plugins
  FontFamilyPlugin,
  FontSizePlugin,
  UndoRedoPlugin,
  ClipboardPlugin,
  SpecialCharactersPlugin
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
  
  // Register insert features plugins
  editor.registerPlugin(new LinkPlugin());
  editor.registerPlugin(new ImagePlugin());
  editor.registerPlugin(new TablePlugin());
  editor.registerPlugin(new HorizontalRulePlugin());
  editor.registerPlugin(new PageBreakPlugin());
  
  // Register advanced features plugins
  editor.registerPlugin(new FontFamilyPlugin());
  editor.registerPlugin(new FontSizePlugin());
  editor.registerPlugin(new UndoRedoPlugin());
  editor.registerPlugin(new ClipboardPlugin());
  editor.registerPlugin(new SpecialCharactersPlugin());
  
  return editor;
}