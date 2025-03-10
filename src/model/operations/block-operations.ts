import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { ElementNode, DocumentNode } from '../interfaces';

export class BlockOperations {
  static applyAlignment(
    model: DocumentModel,
    range: DocumentRange,
    alignment: 'left' | 'center' | 'right' | 'justify'
  ): void {
    const blocks = this.getBlocksInRange(model, range);
    blocks.forEach(block => {
      if (!block.attributes) {
        block.attributes = {};
      }
      block.attributes['align'] = alignment;
    });
  }

  static convertBlocks(
    model: DocumentModel,
    range: DocumentRange,
    blockType: 'paragraph' | 'heading' | 'blockquote',
    options?: { level?: number }
  ): void {
    const blocks = this.getBlocksInRange(model, range);
    blocks.forEach(block => {
      const attributes = { ...(block.attributes || {}) };
      
      // Clear blockquote attribute when converting to a different type
      if (block.type === 'blockquote' && blockType !== 'blockquote') {
        delete attributes['blockquote'];
      }
      
      // Set heading level if applicable
      if (blockType === 'heading' && options?.level) {
        attributes['level'] = options.level.toString();
      }
      
      const newBlock: ElementNode = {
        type: blockType,
        id: block.id,
        attributes,
        children: [...block.children]
      };
      
      this.replaceBlock(model, block, newBlock);
    });  
  
  }

  static applyIndentation(
    model: DocumentModel,
    range: DocumentRange,
    increaseIndent: boolean
  ): void {
    const blocks = this.getBlocksInRange(model, range);
    blocks.forEach(block => {
      if (!block.attributes) {
        block.attributes = {};
      }
      let indentLevel = parseInt(block.attributes['indent'] || '0', 10);
      if (increaseIndent) {
        indentLevel = Math.min(indentLevel + 1, 5);
      } else {
        indentLevel = Math.max(indentLevel - 1, 0);
      }
      if (indentLevel > 0) {
        block.attributes['indent'] = indentLevel.toString();
      } else {
        delete block.attributes['indent'];
      }
    });
  }

  static applyLineSpacing(
    model: DocumentModel,
    range: DocumentRange,
    lineSpacing: string
  ): void {
    const blocks = this.getBlocksInRange(model, range);
    blocks.forEach(block => {
      if (!block.attributes) {
        block.attributes = {};
      }
      block.attributes['line-spacing'] = lineSpacing;
    });
  }

  static getBlocksInRange(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode[] {
    if (!range || !range.start || !range.end) {
      return [];
    }
    
    const blocks: ElementNode[] = [];
    const document = model.getDocument();
    
    // Handle collapsed selection (cursor only)
    if (range.start.node.id === range.end.node.id && range.start.offset === range.end.offset) {
      let currentNode = range.start.node;
      if (currentNode.type === 'text') {
        const parentBlock = this.findParentBlock(document, currentNode.id);
        if (parentBlock) {
          currentNode = parentBlock;
        }
      }
      if (this.isBlockElement(currentNode)) {
        blocks.push(currentNode as ElementNode);
      }
      return blocks;
    }
    
    // For non-collapsed selections, find all blocks between start and end
    const allBlocks = this.getAllBlocks(document);
    
    // Get start and end blocks
    let startBlock = this.findBlockForNode(document, range.start.node);
    let endBlock = this.findBlockForNode(document, range.end.node);
    
    if (!startBlock || !endBlock) {
      console.warn('Could not find start or end block for range');
      return blocks;
    }
    
    // Find blocks between start and end
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
    
    // If no blocks found, try reverse order (end to start)
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
    
    return blocks;
  }
  
  private static findBlockForNode(root: DocumentNode, node: DocumentNode): ElementNode | null {
    if (this.isBlockElement(node)) {
      return node as ElementNode;
    }
    
    if (node.type === 'text') {
      return this.findParentBlock(root, node.id);
    }
    
    return null;
  }

  static isBlockElement(node: DocumentNode): boolean {
    const blockTypes = ['paragraph', 'heading', 'blockquote', 'list', 'list-item', 'table', 'table-row', 'table-cell'];
    return blockTypes.includes(node.type);
  }

  static findParentBlock(root: DocumentNode, nodeId: string): ElementNode | null {
    if (root.id === nodeId) {
      return this.isBlockElement(root) ? root as ElementNode : null;
    }
    
    if ('children' in root) {
      const elementNode = root as ElementNode;
      for (const child of elementNode.children) {
        if (child.id === nodeId) {
          return this.isBlockElement(elementNode) ? elementNode : null;
        }
      }
      
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

  static replaceBlock(
    model: DocumentModel,
    oldBlock: ElementNode,
    newBlock: ElementNode
  ): void {
    const document = model.getDocument();
    const parent = this.findParentElement(document, oldBlock.id);
    
    if (parent) {
      const index = parent.children.findIndex(child => child.id === oldBlock.id);
      if (index !== -1) {
        parent.children[index] = newBlock;
      }
    }
  }

  static findParentElement(root: DocumentNode, nodeId: string): ElementNode | null {
    if ('children' in root) {
      const elementNode = root as ElementNode;
      for (const child of elementNode.children) {
        if (child.id === nodeId) {
          return elementNode;
        }
      }
      
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