import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { ElementNode, DocumentNode } from '../../model/interfaces';

/**
 * Model adapter for the HorizontalRule plugin
 */
export class HorizontalRuleModelAdapter implements PluginModelAdapter {
  /**
   * Insert a horizontal rule into the document model
   * 
   * @param model Document model
   * @param range Document range where to insert the horizontal rule
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange
  ): void {
    // Create a horizontal rule element
    // Use 'paragraph' type with a special attribute to indicate it's a horizontal rule
    const hr = model.createElementNode('paragraph', {
      'data-type': 'hr',
      'class': 'openrte-hr'
    });
    
    // Find the parent block of the range
    const parentBlock = this.findParentBlock(model, range);
    
    if (parentBlock) {
      // Find the index where to insert the HR
      const index = this.findInsertionIndex(parentBlock, range);
      
      // Insert the HR at the specified index
      parentBlock.children.splice(index, 0, hr);
      
      // Create a new paragraph after the HR if needed
      const p = model.createElementNode('paragraph', {}, [
        model.createTextNode('')
      ]);
      
      // Insert the paragraph after the HR
      parentBlock.children.splice(index + 1, 0, p);
    } else {
      // If no parent block found, insert at the root level
      const document = model.getDocument();
      document.children.push(hr);
      
      // Add a paragraph after the HR
      const p = model.createElementNode('paragraph', {}, [
        model.createTextNode('')
      ]);
      document.children.push(p);
    }
  }
  
  /**
   * Get the current state from the document model
   * (Not applicable for horizontal rule plugin)
   * 
   * @param model Document model
   * @param range Document range
   * @returns Always returns false as this plugin doesn't have a state
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): boolean {
    return false;
  }
  
  /**
   * Find the parent block of a range
   * 
   * @param model Document model
   * @param range Document range
   * @returns The parent block element or null if not found
   */
  private findParentBlock(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode | null {
    // Get the document root
    const document = model.getDocument();
    
    // Start with the range's start node
    let node = range.start.node;
    
    // If it's a text node, we need to find its parent
    if (node.type === 'text') {
      // Find the parent of this text node
      return this.findParentElement(document, node.id);
    }
    
    // If it's already a block element, return it
    if (this.isBlockElement(node)) {
      return node as ElementNode;
    }
    
    return null;
  }
  
  /**
   * Find the parent element of a node
   * 
   * @param root Root node to search in
   * @param nodeId ID of the node to find the parent for
   * @returns The parent element or null if not found
   */
  private findParentElement(root: any, nodeId: string): ElementNode | null {
    // If this is a parent node, search its children
    if ('children' in root) {
      const elementNode = root as ElementNode;
      
      // Check direct children
      for (const child of elementNode.children) {
        if (child.id === nodeId) {
          return elementNode;
        }
      }
      
      // Recursively check children
      for (const child of elementNode.children) {
        if ('children' in child) {
          const result = this.findParentElement(child, nodeId);
          if (result) {
            return result;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Find the index where to insert a new node
   * 
   * @param parent Parent element
   * @param range Document range
   * @returns The index where to insert the new node
   */
  private findInsertionIndex(parent: ElementNode, range: DocumentRange): number {
    // Default to appending at the end
    if (!parent.children || parent.children.length === 0) {
      return 0;
    }
    
    // Try to find the child that contains the range start
    for (let i = 0; i < parent.children.length; i++) {
      if (parent.children[i].id === range.start.node.id) {
        return i + 1; // Insert after this node
      }
    }
    
    // If not found, append at the end
    return parent.children.length;
  }
  
  /**
   * Check if a node is a block element
   * 
   * @param node Node to check
   * @returns True if the node is a block element
   */
  private isBlockElement(node: any): boolean {
    const blockTypes = ['paragraph', 'heading', 'list', 'list-item', 'table', 'table-row', 'table-cell'];
    return blockTypes.includes(node.type);
  }
}