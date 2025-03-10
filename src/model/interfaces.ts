/**
 * Node type enumeration for document model
 */
export type NodeType =
  | 'root'
  | 'paragraph'
  | 'text'
  | 'heading'
  | 'blockquote'  // Add blockquote as a node type
  | 'list'
  | 'list-item'
  | 'link'
  | 'image'
  | 'table'
  | 'table-row'
  | 'table-cell';

/**
 * Base interface for all nodes in the document model
 */
export interface BaseNode {
  /**
   * Type of the node
   */
  type: NodeType;
  
  /**
   * Unique identifier for the node
   */
  id: string;
}

/**
 * Interface for nodes that can have children
 */
export interface ParentNode extends BaseNode {
  /**
   * Child nodes
   */
  children: DocumentNode[];
}

/**
 * Interface for element nodes (blocks, containers)
 */
export interface ElementNode extends ParentNode {
  /**
   * HTML attributes for the element
   */
  attributes?: Record<string, string>;
}

/**
 * Interface for text nodes (leaf nodes containing actual text content)
 */
export interface TextNode extends BaseNode {
  /**
   * Node type, always 'text' for text nodes
   */
  type: 'text';
  
  /**
   * Text content of the node
   */
  text: string;
  
  /**
   * Formatting marks applied to the text
   */
  marks?: Mark[];
}

/**
 * Interface for formatting marks that can be applied to text
 */
export interface Mark {
  /**
   * Type of formatting mark
   */
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'color' | 'background';
  
  /**
   * Optional value for marks that require it (like color)
   */
  value?: string;
}

/**
 * Union type for all document node types
 */
export type DocumentNode = ElementNode | TextNode;

/**
 * Interface for the document root
 */
export interface Document extends ParentNode {
  /**
   * Type is always 'root' for the document
   */
  type: 'root';
}