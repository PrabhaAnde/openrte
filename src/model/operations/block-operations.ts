import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { ElementNode, DocumentNode } from '../interfaces';

/**
 * Operations for block-level formatting in the document model
 */
export class BlockOperations {
  /**
   * Apply alignment to blocks in a range
   */
  static applyAlignment(
    model: DocumentModel,
    range: DocumentRange,
    alignment: 'left' | 'center' | 'right' | 'justify'
  ): void {
    // Find blocks in range
    const blocks = this.getBlocksInRange(model, range);
    
    // Apply alignment to each block
    blocks.forEach(block => {
      // Update block attributes
      if (!block.attributes) {
        block.attributes = {};
      }
      block.attributes['align'] = alignment;
    });
  }
  
  /**
   * Convert blocks to a specific type
   */
  static convertBlocks(
    model: DocumentModel,
    range: DocumentRange,
    blockType: 'paragraph' | 'heading',
    options?: { level?: number }
  ): void {
    // Find blocks in range
    const blocks = this.getBlocksInRange(model, range);
    
    // Convert each block to the specified type
    blocks.forEach(block => {
      // Preserve existing attributes
      const attributes = block.attributes || {};
      
      // Add or update type-specific attributes
      if (blockType === 'heading' && options?.level) {
        attributes['level'] = options.level.toString();
      }
      
      // Create a new block with the same children but new type
      const newBlock: ElementNode = {
        type: blockType,
        id: block.id, // Keep the same ID
        attributes,
        children: block.children
      };
      
      // Replace the old block with the new one
      this.replaceBlock(model, block, newBlock);
    });
  }
  
  /**
   * Apply indentation to blocks
   */
  static applyIndentation(
    model: DocumentModel,
    range: DocumentRange,
    increaseIndent: boolean
  ): void {
    // Find blocks in range
    const blocks = this.getBlocksInRange(model, range);
    
    // Apply indentation to each block
    blocks.forEach(block => {
      // Ensure attributes exist
      if (!block.attributes) {
        block.attributes = {};
      }
      
      // Get current indentation level
      let indentLevel = parseInt(block.attributes['indent'] || '0', 10);
      
      // Increase or decrease indentation
      if (increaseIndent) {
        indentLevel = Math.min(indentLevel + 1, 5); // Maximum indent level of 5
      } else {
        indentLevel = Math.max(indentLevel - 1, 0); // Minimum indent level of 0
      }
      
      // Update indentation attribute
      if (indentLevel > 0) {
        block.attributes['indent'] = indentLevel.toString();
      } else {
        // Remove indent attribute if level is 0
        delete block.attributes['indent'];
      }
    });
  }
  
  /**
   * Apply line spacing to blocks
   */
  static applyLineSpacing(
    model: DocumentModel,
    range: DocumentRange,
    lineSpacing: string
  ): void {
    // Find blocks in range
    const blocks = this.getBlocksInRange(model, range);
    
    // Apply line spacing to each block
    blocks.forEach(block => {
      // Ensure attributes exist
      if (!block.attributes) {
        block.attributes = {};
      }
      
      // Update line spacing attribute
      block.attributes['line-spacing'] = lineSpacing;
    });
  }
  
  /**
   * Get block elements in a range
   */
  static getBlocksInRange(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode[] {
    if (!range || !range.start || !range.end) {
      return [];
    }
    
    const blocks: ElementNode[] = [];
    const document = model.getDocument();
    
    // If range is collapsed, get the closest block
    if (range.start.node.id === range.end.node.id && range.start.offset === range.end.offset) {
      let currentNode = range.start.node;
      
      // If it's a text node, find its parent block
      if (currentNode.type === 'text') {
        const parentBlock = this.findParentBlock(document, currentNode.id);
        if (parentBlock) {
          currentNode = parentBlock;
        }
      }
      
      // If it's a block element, add it
      if (this.isBlockElement(currentNode)) {
        blocks.push(currentNode as ElementNode);
      }
      
      return blocks;
    }
    
    // For non-collapsed ranges, find all blocks between start and end
    // This is a simplified implementation that gets all blocks in the document
    // A more sophisticated implementation would traverse the tree and find only blocks in the range
    const allBlocks = this.getAllBlocks(document);
    
    // Get the start and end node IDs
    const startNodeId = range.start.node.id;
    const endNodeId = range.end.node.id;
    
    // Find the start and end blocks
    let startBlock: ElementNode | null = null;
    let endBlock: ElementNode | null = null;
    
    if (range.start.node.type === 'text') {
      startBlock = this.findParentBlock(document, startNodeId);
    } else if (this.isBlockElement(range.start.node)) {
      startBlock = range.start.node as ElementNode;
    }
    
    if (range.end.node.type === 'text') {
      endBlock = this.findParentBlock(document, endNodeId);
    } else if (this.isBlockElement(range.end.node)) {
      endBlock = range.end.node as ElementNode;
    }
    
    if (startBlock && endBlock) {
      // Find all blocks between start and end
      let inRange = false;
      
      for (const block of allBlocks) {
        if (block.id === startBlock.id) {
          inRange = true;
        }
        
        if (inRange) {
          blocks.push(block);
        }
        
        if (block.id === endBlock.id) {
          inRange = false;
        }
      }
      
      // If we didn't find any blocks, try the reverse order
      if (blocks.length === 0) {
        inRange = false;
        
        for (const block of allBlocks) {
          if (block.id === endBlock.id) {
            inRange = true;
          }
          
          if (inRange) {
            blocks.push(block);
          }
          
          if (block.id === startBlock.id) {
            inRange = false;
          }
        }
      }
    }
    
    // If we still didn't find any blocks, return an empty array
    return blocks;
  }
  
  /**
   * Check if a node is a block element
   */
  static isBlockElement(node: DocumentNode): boolean {
    const blockTypes = ['paragraph', 'heading', 'list', 'list-item', 'table', 'table-row', 'table-cell'];
    return blockTypes.includes(node.type);
  }
  
  /**
   * Find the parent block of a node
   */
  static findParentBlock(root: DocumentNode, nodeId: string): ElementNode | null {
    // If the root is the node we're looking for
    if (root.id === nodeId) {
      return null;
    }
    
    // If this is a parent node, search its children
    if ('children' in root) {
      const elementNode = root as ElementNode;
      
      // Check direct children
      for (const child of elementNode.children) {
        if (child.id === nodeId) {
          return this.isBlockElement(elementNode) ? elementNode : null;
        }
      }
      
      // Recursively check children
      for (const child of elementNode.children) {
        if ('children' in child) {
          const result = this.findParentBlock(child, nodeId);
          if (result) {
            return result;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get all block elements in the document
   */
  static getAllBlocks(root: DocumentNode): ElementNode[] {
    const blocks: ElementNode[] = [];
    
    if (this.isBlockElement(root)) {
      blocks.push(root as ElementNode);
    }
    
    if ('children' in root) {
      const elementNode = root as ElementNode;
      
      for (const child of elementNode.children) {
        blocks.push(...this.getAllBlocks(child));
      }
    }
    
    return blocks;
  }
  
  /**
   * Replace a block with a new one
   */
  static replaceBlock(
    model: DocumentModel,
    oldBlock: ElementNode,
    newBlock: ElementNode
  ): void {
    // Find the parent of the old block
    const document = model.getDocument();
    const parent = this.findParentElement(document, oldBlock.id);
    
    if (parent) {
      // Find the index of the old block
      const index = parent.children.findIndex(child => child.id === oldBlock.id);
      
      if (index !== -1) {
        // Replace the old block with the new one
        parent.children[index] = newBlock;
      }
    }
  }
  
  /**
   * Find the parent element of a node
   */
  static findParentElement(root: DocumentNode, nodeId: string): ElementNode | null {
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
}