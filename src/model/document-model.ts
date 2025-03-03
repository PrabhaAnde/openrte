import { Document, DocumentNode, NodeType, TextNode, ElementNode, Mark } from './interfaces';
import { createUniqueId } from '../utils/html-utils';

/**
 * Document Model class for managing the document structure
 */
export class DocumentModel {
  /**
   * The document root node
   */
  private document: Document;
  
  /**
   * Constructor
   */
  constructor() {
    this.document = {
      type: 'root',
      id: createUniqueId(),
      children: []
    };
  }
  
  /**
   * Gets the document root node
   * 
   * @returns The document root node
   */
  getDocument(): Document {
    return this.document;
  }
  
  /**
   * Sets the document structure
   * 
   * @param document The document to set
   */
  setDocument(document: Document): void {
    this.document = document;
  }
  
  /**
   * Creates a new text node
   * 
   * @param text Text content
   * @param marks Optional formatting marks
   * @returns A new text node
   */
  createTextNode(text: string, marks?: Mark[]): TextNode {
    return {
      type: 'text',
      id: createUniqueId(),
      text,
      marks
    };
  }
  
  /**
   * Creates a new element node
   * 
   * @param type Node type
   * @param attributes Optional HTML attributes
   * @param children Optional child nodes
   * @returns A new element node
   */
  createElementNode(type: NodeType, attributes?: Record<string, string>, children: DocumentNode[] = []): ElementNode {
    return {
      type,
      id: createUniqueId(),
      attributes,
      children
    };
  }

  /**
   * Finds a node by ID
   * 
   * @param id The node ID to find
   * @returns The found node or null
   */
  findNodeById(id: string): DocumentNode | null {
    return this.findNodeByIdInternal(this.document, id);
  }
  
  /**
   * Internal recursive method to find a node by ID
   * 
   * @param node The current node to check
   * @param id The node ID to find
   * @returns The found node or null
   */
  private findNodeByIdInternal(node: DocumentNode, id: string): DocumentNode | null {
    if (node.id === id) {
      return node;
    }
    
    // If this is a parent node, search its children
    if ('children' in node) {
      for (const child of node.children) {
        const found = this.findNodeByIdInternal(child, id);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Gets all nodes of a specific type
   * 
   * @param type The node type to find
   * @returns Array of matching nodes
   */
  getNodesByType(type: NodeType): DocumentNode[] {
    const result: DocumentNode[] = [];
    this.collectNodesByType(this.document, type, result);
    return result;
  }
  
  /**
   * Internal recursive method to collect nodes by type
   * 
   * @param node The current node to check
   * @param type The node type to find
   * @param result Array to collect matching nodes
   */
  private collectNodesByType(node: DocumentNode, type: NodeType, result: DocumentNode[]): void {
    if (node.type === type) {
      result.push(node);
    }
    
    // If this is a parent node, search its children
    if ('children' in node) {
      for (const child of node.children) {
        this.collectNodesByType(child, type, result);
      }
    }
  }
  
  /**
   * Creates an empty paragraph node
   * 
   * @returns A new paragraph node with an empty text node
   */
  createParagraph(): ElementNode {
    return this.createElementNode('paragraph', {}, [
      this.createTextNode('')
    ]);
  }
  
  /**
   * Creates a heading node
   * 
   * @param level Heading level (1-6)
   * @param text Initial text content
   * @returns A new heading node
   */
  createHeading(level: number, text: string = ''): ElementNode {
    return this.createElementNode('heading', { level: level.toString() }, [
      this.createTextNode(text)
    ]);
  }
  
  /**
   * Appends a node to the document root
   * 
   * @param node The node to append
   */
  appendChild(node: DocumentNode): void {
    this.document.children.push(node);
  }
  
  /**
   * Creates an empty document with a single paragraph
   */
  createEmptyDocument(): void {
    this.document = {
      type: 'root',
      id: createUniqueId(),
      children: [
        this.createParagraph()
      ]
    };
  }
}