export interface Node {
    type: string;
    parent: Node | null;
    children: Node[];
  }
  
  export interface Document extends Node {
    type: 'document';
  }
  
  export interface Paragraph extends Node {
    type: 'paragraph';
  }

  export interface ToolbarButton {
    command: string;
    icon?: string;
    label: string;
    action: () => void;
  }
  
  export interface EditorConfig {
    toolbar: ToolbarButton[];
    container: HTMLElement;
  }
  
  
  export interface TextRun extends Node {
    type: 'text';
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }

  
export interface TextNode {
  type: 'text';
  text: string;
  parent: ContentNode | null;
  children: TextNode[];
  bold?: boolean;
}

export interface ContentNode {
  type: string;
  parent: ContentNode | null;
  children: Array<TextNode | ContentNode>;
}
  
  export type ContentModel = Document;