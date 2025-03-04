import { DocumentNode, ElementNode, TextNode } from '../interfaces';

/**
 * Base interface for all operations
 */
export interface Operation {
  type: string;
}

/**
 * Insert text operation
 */
export interface InsertTextOperation extends Operation {
  type: 'insertText';
  path: number[]; // Path to the text node
  offset: number; // Offset in the text
  text: string;   // Text to insert
}

/**
 * Delete text operation
 */
export interface DeleteTextOperation extends Operation {
  type: 'deleteText';
  path: number[]; // Path to the text node
  offset: number; // Offset in the text
  count: number;  // Number of characters to delete
  text?: string;  // Deleted text (for undo)
}

/**
 * Apply mark operation
 */
export interface ApplyMarkOperation extends Operation {
  type: 'applyMark';
  path: number[]; // Path to the text node
  mark: { type: string; value?: string }; // Mark to apply
  range: [number, number]; // Range in text to apply mark
}

/**
 * Remove mark operation
 */
export interface RemoveMarkOperation extends Operation {
  type: 'removeMark';
  path: number[]; // Path to the text node
  mark: { type: string; value?: string }; // Mark to remove
  range: [number, number]; // Range in text to remove mark
}

/**
 * Insert node operation
 */
export interface InsertNodeOperation extends Operation {
  type: 'insertNode';
  path: number[]; // Path to parent
  index: number;  // Index to insert at
  node: DocumentNode; // Node to insert
}

/**
 * Remove node operation
 */
export interface RemoveNodeOperation extends Operation {
  type: 'removeNode';
  path: number[]; // Path to parent
  index: number;  // Index to remove
  node?: DocumentNode; // Removed node (for undo)
}

/**
 * Set node operation
 */
export interface SetNodeOperation extends Operation {
  type: 'setNode';
  path: number[]; // Path to node
  properties: Partial<ElementNode | TextNode>; // Properties to set
  oldProperties?: Partial<ElementNode | TextNode>; // Old properties (for undo)
}

/**
 * Merge nodes operation
 */
export interface MergeNodesOperation extends Operation {
  type: 'mergeNodes';
  path: number[]; // Path to node
  position: number; // Position to merge
  properties?: any; // Additional properties
}

/**
 * Split node operation
 */
export interface SplitNodeOperation extends Operation {
  type: 'splitNode';
  path: number[]; // Path to node
  position: number; // Position to split
  properties?: any; // Additional properties
}

/**
 * Move node operation
 */
export interface MoveNodeOperation extends Operation {
  type: 'moveNode';
  path: number[]; // Original path
  newPath: number[]; // New path
}

/**
 * Union of all operation types
 */
export type AnyOperation = 
  | InsertTextOperation
  | DeleteTextOperation
  | ApplyMarkOperation
  | RemoveMarkOperation
  | InsertNodeOperation
  | RemoveNodeOperation
  | SetNodeOperation
  | MergeNodesOperation
  | SplitNodeOperation
  | MoveNodeOperation;