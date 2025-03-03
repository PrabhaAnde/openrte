import { DocumentPosition, DocumentRange, SerializedPosition, SerializedRange } from './selection-interfaces';
import { DocumentModel } from './document-model';
import { DocumentNode, TextNode, ElementNode } from './interfaces';

export class SelectionModel {
  private documentModel: DocumentModel;
  private anchor: DocumentPosition | null = null;
  private focus: DocumentPosition | null = null;
  
  constructor(documentModel: DocumentModel) {
    this.documentModel = documentModel;
  }
  
  /**
   * Sets the selection
   */
  setSelection(anchor: DocumentPosition, focus: DocumentPosition = anchor): void {
    this.anchor = anchor;
    this.focus = focus;
  }
  
  /**
   * Gets the current selection
   */
  getSelection(): { anchor: DocumentPosition, focus: DocumentPosition } | null {
    if (!this.anchor || !this.focus) return null;
    return { anchor: this.anchor, focus: this.focus };
  }
  
  /**
   * Converts the current selection to a document range
   */
  toDocumentRange(): DocumentRange | null {
    if (!this.anchor || !this.focus) return null;
    
    // Determine start and end based on position comparison
    const isBackward = this.comparePositions(this.focus, this.anchor) < 0;
    
    const start = isBackward ? this.focus : this.anchor;
    const end = isBackward ? this.anchor : this.focus;
    
    return { start, end };
  }
  
  /**
   * Compare two positions to determine their relative order
   * Returns negative if a is before b, positive if a is after b, 0 if same
   */
  private comparePositions(a: DocumentPosition, b: DocumentPosition): number {
    // If positions are in the same node, compare offsets
    if (a.node.id === b.node.id) {
      return a.offset - b.offset;
    }
    
    // Otherwise, we need to determine the document order of the nodes
    // This is a simplified implementation that uses node paths
    const aPath = this.getNodePath(a.node);
    const bPath = this.getNodePath(b.node);
    
    // Compare paths
    const minLength = Math.min(aPath.length, bPath.length);
    for (let i = 0; i < minLength; i++) {
      if (aPath[i] !== bPath[i]) {
        return aPath[i] - bPath[i];
      }
    }
    
    // If one path is a prefix of the other, the shorter path comes first
    return aPath.length - bPath.length;
  }
  
  /**
   * Get the path to a node from the root document
   */
  private getNodePath(node: DocumentNode): number[] {
    // Implementation requires traversing up the node tree
    // This is a placeholder for a more complex implementation
    const path: number[] = [];
    
    // For now we'll use a simplified approach - search the tree
    this.findNodePath(this.documentModel.getDocument(), node, [], path);
    
    return path;
  }
  
  /**
   * Find a node's path by recursively searching the document
   */
  private findNodePath(
    current: DocumentNode, 
    target: DocumentNode, 
    currentPath: number[],
    resultPath: number[]
  ): boolean {
    // If this is the node we're looking for, copy the path and return true
    if (current.id === target.id) {
      resultPath.push(...currentPath);
      return true;
    }
    
    // If this is a text node, it can't contain our target
    if (current.type === 'text') {
      return false;
    }
    
    // Otherwise, search children
    const elementNode = current as ElementNode;
    for (let i = 0; i < elementNode.children.length; i++) {
      // Try this child
      const childPath = [...currentPath, i];
      if (this.findNodePath(elementNode.children[i], target, childPath, resultPath)) {
        return true;
      }
    }
    
    // Not found in this subtree
    return false;
  }
  
  /**
   * Convert a DOM range to document positions
   */
  fromDOMRange(range: Range): boolean {
    try {
      const startPosition = this.domPointToModelPosition(range.startContainer, range.startOffset);
      const endPosition = this.domPointToModelPosition(range.endContainer, range.endOffset);
      
      if (startPosition && endPosition) {
        this.anchor = startPosition;
        this.focus = endPosition;
        return true;
      }
    } catch (e) {
      console.error('Error converting DOM range to model positions:', e);
    }
    
    return false;
  }
  
  /**
   * Convert a DOM point (node + offset) to a model position
   */
  private domPointToModelPosition(node: Node, offset: number): DocumentPosition | null {
    // Get the corresponding model node
    const modelNode = this.findModelNodeForDOM(node);
    if (!modelNode) {
      return null;
    }
    
    // If it's a text node, the offset is straightforward
    if (modelNode.type === 'text') {
      return {
        node: modelNode,
        offset: Math.min(offset, (modelNode as TextNode).text.length)
      };
    }
    
    // For element nodes, we need to find the appropriate child node
    const elementNode = modelNode as ElementNode;
    
    // If offset is at the end, use the last position in the last child
    if (offset >= node.childNodes.length) {
      if (elementNode.children.length === 0) {
        return { node: elementNode, offset: 0 };
      }
      
      const lastChild = elementNode.children[elementNode.children.length - 1];
      
      if (lastChild.type === 'text') {
        return {
          node: lastChild,
          offset: (lastChild as TextNode).text.length
        };
      } else {
        // Recursively find the end of this node
        const lastElement = lastChild as ElementNode;
        if (lastElement.children.length === 0) {
          return { node: lastChild, offset: 0 };
        }
        
        return this.domPointToModelPosition(
          node.childNodes[node.childNodes.length - 1],
          node.childNodes[node.childNodes.length - 1].childNodes.length
        );
      }
    }
    
    // Otherwise, get the position at the start of the child at offset
    const childDOMNode = node.childNodes[offset];
    const childModelNode = this.findModelNodeForDOM(childDOMNode);
    
    if (childModelNode) {
      return { node: childModelNode, offset: 0 };
    }
    
    // Fallback if we couldn't find a matching model node
    return { node: elementNode, offset: 0 };
  }
  
  /**
   * Find the corresponding model node for a DOM node
   */
  private findModelNodeForDOM(node: Node): DocumentNode | null {
    // This is a placeholder for a more robust implementation
    // A real implementation would maintain a mapping between DOM nodes and model nodes
    
    // If this is a text node, find the parent element first
    const element = node.nodeType === Node.TEXT_NODE 
      ? node.parentElement 
      : node as Element;
      
    if (!element) return null;
    
    // Try to find node by ID attribute
    const nodeId = element.getAttribute('data-node-id');
    if (nodeId) {
      return this.documentModel.findNodeById(nodeId);
    }
    
    // If we're looking for a text node, find the parent and then the text child
    if (node.nodeType === Node.TEXT_NODE) {
      const parentModelNode = this.findModelNodeForElement(element);
      if (parentModelNode && parentModelNode.type !== 'text') {
        const parentElement = parentModelNode as ElementNode;
        
        // Find which child text node this is
        const textNodes = Array.from(element.childNodes)
          .filter(child => child.nodeType === Node.TEXT_NODE);
        
        const textNodeIndex = textNodes.indexOf(node as ChildNode);
        
        if (textNodeIndex >= 0) {
          // Find the corresponding text node in the model
          const modelTextNodes = parentElement.children
            .filter(child => child.type === 'text');
          
          if (textNodeIndex < modelTextNodes.length) {
            return modelTextNodes[textNodeIndex];
          }
        }
      }
    }
    
    // Fall back to element matching
    return this.findModelNodeForElement(element);
  }  
  /**
   * Find model node for an element based on structure
   */
  private findModelNodeForElement(element: Element): DocumentNode | null {
    // This is a simplified heuristic approach
    // A more robust implementation would use node IDs or a bidirectional mapping
    
    const tagName = element.tagName.toLowerCase();
    const nodeType = this.mapTagToNodeType(tagName);
    
    // Find nodes of this type in the document
    const candidateNodes = this.findNodesOfType(this.documentModel.getDocument(), nodeType);
    
    // If there's only one node of this type, use it
    if (candidateNodes.length === 1) {
      return candidateNodes[0];
    }
    
    // Otherwise, try to match by content and position
    // This is just a placeholder for a more sophisticated matching algorithm
    return candidateNodes[0];
  }
  
  /**
   * Find all nodes of a specific type in the document
   */
  private findNodesOfType(node: DocumentNode, type: string): DocumentNode[] {
    const result: DocumentNode[] = [];
    
    if (node.type === type) {
      result.push(node);
    }
    
    if (node.type !== 'text') {
      const elementNode = node as ElementNode;
      elementNode.children.forEach(child => {
        result.push(...this.findNodesOfType(child, type));
      });
    }
    
    return result;
  }
  
  /**
   * Map an HTML tag to a node type
   */
  private mapTagToNodeType(tagName: string): string {
    switch (tagName) {
      case 'p': return 'paragraph';
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return 'heading';
      case 'ul':
      case 'ol':
        return 'list';
      case 'li':
        return 'list-item';
      case 'a':
        return 'link';
      case 'img':
        return 'image';
      case 'table':
        return 'table';
      case 'tr':
        return 'table-row';
      case 'td':
      case 'th':
        return 'table-cell';
      default:
        return 'paragraph'; // Default fallback
    }
  }
  
  /**
   * Serialize the current selection to a serializable format
   */
  serialize(): SerializedRange | null {
    const range = this.toDocumentRange();
    if (!range) return null;
    
    return {
      start: this.serializePosition(range.start),
      end: this.serializePosition(range.end)
    };
  }
  
  /**
   * Deserialize a serialized range
   */
  deserialize(serialized: SerializedRange): boolean {
    try {
      const start = this.deserializePosition(serialized.start);
      const end = this.deserializePosition(serialized.end);
      
      if (start && end) {
        this.anchor = start;
        this.focus = end;
        return true;
      }
    } catch (e) {
      console.error('Error deserializing range:', e);
    }
    
    return false;
  }
  
  /**
   * Serialize a position to a path-based format
   */
  private serializePosition(position: DocumentPosition): SerializedPosition {
    const path = this.getNodePath(position.node);
    return {
      path,
      offset: position.offset
    };
  }
  
  /**
   * Deserialize a path-based position
   */
  private deserializePosition(serialized: SerializedPosition): DocumentPosition | null {
    const node = this.getNodeAtPath(serialized.path);
    if (!node) return null;
    
    return {
      node,
      offset: serialized.offset
    };
  }
  
  /**
   * Get the node at a specific path
   */
  private getNodeAtPath(path: number[]): DocumentNode | null {
    let current: DocumentNode = this.documentModel.getDocument();
    
    for (const index of path) {
      if (current.type === 'text') {
        // Can't navigate into a text node
        return null;
      }
      
      if (current.type !== 'root' && !['paragraph', 'heading', 'list', 'list-item', 'link', 'image', 'table', 'table-row', 'table-cell'].includes(current.type)) {
        // Can't navigate into non-root and non-element nodes
        return null;
      }
      
      const elementNode = current as ElementNode;
      if (index >= elementNode.children.length) {
        // Path index out of bounds
        return null;
      }
      
      current = elementNode.children[index];
    }
    
    return current;
  }

}