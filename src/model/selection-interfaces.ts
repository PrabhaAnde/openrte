import { DocumentNode } from './interfaces';

/**
 * Represents a position within the document model
 */
export interface DocumentPosition {
  /**
   * The node containing this position
   */
  node: DocumentNode;
  
  /**
   * The offset within the node
   */
  offset: number;
}

/**
 * Represents a range within the document model
 */
export interface DocumentRange {
  /**
   * The start position of the range
   */
  start: DocumentPosition;
  
  /**
   * The end position of the range
   */
  end: DocumentPosition;
}

/**
 * Serializable position for storage
 */
export interface SerializedPosition {
  /**
   * Path to the node from the document root
   */
  path: number[];
  
  /**
   * Offset within the node
   */
  offset: number;
}

/**
 * Serializable range for storage
 */
export interface SerializedRange {
  /**
   * The start position
   */
  start: SerializedPosition;
  
  /**
   * The end position
   */
  end: SerializedPosition;
}