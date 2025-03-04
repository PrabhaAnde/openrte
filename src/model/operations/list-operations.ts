import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { ElementNode, DocumentNode } from '../interfaces';

export class ListOperations {
  /**
   * Create a list from blocks
   */
  static createList(
    model: DocumentModel,
    range: DocumentRange,
    listType: 'bullet' | 'ordered'
  ): void {
    // Find blocks in range
    const blocks = this.getBlocksInRange(model, range);
    
    // Convert blocks to list
    if (blocks.length > 0) {
      // Create list element
      const list = model.createElementNode(
        'list',
        { 'list-type': listType },
        []
      );
      
      // Convert blocks to list items
      blocks.forEach(block => {
        // Convert block to list item
        const item = this.blockToListItem(model, block);
        list.children.push(item);
        
        // Remove original block
        this.removeNodeFromParent(model, block);
      });
      
      // Insert list at position of first block
      this.insertNodeAtPosition(model, list, blocks[0]);
    }
  }
  
  /**
   * Convert a list to blocks
   */
  static listToBlocks(
    model: DocumentModel,
    range: DocumentRange
  ): void {
    // Find lists in range
    const lists = this.getListsInRange(model, range);
    
    lists.forEach(list => {
      const parent = this.findParentNode(model, list);
      if (!parent) return;
      
      const listIndex = parent.children.indexOf(list);
      if (listIndex === -1) return;
      
      // Convert each list item to a paragraph
      const paragraphs: ElementNode[] = [];
      list.children.forEach(item => {
        if (item.type === 'list-item') {
          const paragraph = model.createElementNode('paragraph', {}, item.children);
          paragraphs.push(paragraph);
        }
      });
      
      // Replace list with paragraphs
      parent.children.splice(listIndex, 1, ...paragraphs);
    });
  }
  
  /**
   * Change list type
   */
  static changeListType(
    model: DocumentModel,
    range: DocumentRange,
    listType: 'bullet' | 'ordered'
  ): void {
    // Find lists in range
    const lists = this.getListsInRange(model, range);
    
    // Update list type attribute
    lists.forEach(list => {
      if (!list.attributes) {
        list.attributes = {};
      }
      list.attributes['list-type'] = listType;
    });
  }
  
  /**
   * Increase list item indentation
   */
  static increaseListIndent(
    model: DocumentModel,
    range: DocumentRange
  ): void {
    // Find list items in range
    const items = this.getListItemsInRange(model, range);
    
    // Process items from end to start to avoid index issues
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const parent = this.findParentNode(model, item);
      if (!parent || parent.type !== 'list') continue;
      
      const itemIndex = parent.children.indexOf(item);
      if (itemIndex <= 0) continue; // Can't indent first item
      
      const prevItem = parent.children[itemIndex - 1] as ElementNode;
      if (!prevItem || prevItem.type !== 'list-item') continue;
      
      // Check if previous item has a nested list
      let nestedList = prevItem.children.find(
        child => child.type === 'list'
      ) as ElementNode | undefined;
      
      // If no nested list, create one
      if (!nestedList) {
        nestedList = model.createElementNode(
          'list',
          { 'list-type': parent.attributes?.['list-type'] || 'bullet' },
          []
        );
        prevItem.children.push(nestedList);
      }
      
      // Move current item to nested list
      parent.children.splice(itemIndex, 1);
      nestedList.children.push(item);
    }
  }
  
  /**
   * Decrease list item indentation
   */
  static decreaseListIndent(
    model: DocumentModel,
    range: DocumentRange
  ): void {
    // Find nested list items in range
    const items = this.getNestedListItemsInRange(model, range);
    
    // Process items from end to start to avoid index issues
    for (let i = items.length - 1; i >= 0; i--) {
      const { item, parentList, grandparentItem, greatGrandparentList } = items[i];
      
      if (!parentList || !grandparentItem || !greatGrandparentList) continue;
      
      const itemIndex = parentList.children.indexOf(item);
      const grandparentIndex = greatGrandparentList.children.indexOf(grandparentItem);
      
      if (itemIndex === -1 || grandparentIndex === -1) continue;
      
      // Remove item from nested list
      parentList.children.splice(itemIndex, 1);
      
      // Insert after grandparent item in the parent list
      greatGrandparentList.children.splice(grandparentIndex + 1, 0, item);
      
      // If nested list is now empty, remove it
      if (parentList.children.length === 0) {
        const nestedListIndex = grandparentItem.children.indexOf(parentList);
        if (nestedListIndex !== -1) {
          grandparentItem.children.splice(nestedListIndex, 1);
        }
      }
    }
  }
  
  /**
   * Convert a block to a list item
   */
  private static blockToListItem(
    model: DocumentModel,
    block: ElementNode
  ): ElementNode {
    // Create list item with block's children
    return model.createElementNode('list-item', {}, [...block.children]);
  }
  
  /**
   * Get block elements in a range
   */
  private static getBlocksInRange(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode[] {
    // Implementation to find block elements in range
    const blocks: ElementNode[] = [];
    
    // Get root element
    const root = model.getDocument();
    if (!root) return blocks;
    
    // Helper function to recursively find blocks
    const findBlocks = (node: ElementNode, inRange: boolean) => {
      if (node.type === 'paragraph' || node.type === 'heading') {
        // Check if block is in range
        if (inRange || this.isNodeInRange(model, node, range)) {
          blocks.push(node);
        }
      } else {
        // Recursively check children
        node.children.forEach(child => {
          if ('children' in child) {
            findBlocks(child as ElementNode, inRange);
          }
        });
      }
    };
    
    findBlocks(root, false);
    return blocks;
  }
  
  /**
   * Get lists in a range
   */
  private static getListsInRange(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode[] {
    const lists: ElementNode[] = [];
    
    // Get root element
    const root = model.getDocument();
    if (!root) return lists;
    
    // Helper function to recursively find lists
    const findLists = (node: ElementNode) => {
      if (node.type === 'list') {
        // Check if list is in range
        if (this.isNodeInRange(model, node, range)) {
          lists.push(node);
        }
      }
      
      // Recursively check children
      node.children.forEach(child => {
        if ('children' in child) {
          findLists(child as ElementNode);
        }
      });
    };
    
    findLists(root);
    return lists;
  }
  
  /**
   * Get list items in a range
   */
  private static getListItemsInRange(
    model: DocumentModel,
    range: DocumentRange
  ): ElementNode[] {
    const items: ElementNode[] = [];
    
    // Get lists in range
    const lists = this.getListsInRange(model, range);
    
    // Get items from lists
    lists.forEach(list => {
      list.children.forEach(child => {
        if (child.type === 'list-item') {
          if (this.isNodeInRange(model, child as ElementNode, range)) {
            items.push(child as ElementNode);
          }
        }
      });
    });
    
    return items;
  }
  
  /**
   * Get nested list items in a range
   */
  private static getNestedListItemsInRange(
    model: DocumentModel,
    range: DocumentRange
  ): Array<{
    item: ElementNode;
    parentList: ElementNode;
    grandparentItem: ElementNode;
    greatGrandparentList: ElementNode;
  }> {
    const result: Array<{
      item: ElementNode;
      parentList: ElementNode;
      grandparentItem: ElementNode;
      greatGrandparentList: ElementNode;
    }> = [];
    
    // Get root element
    const root = model.getDocument();
    if (!root) return result;
    
    // Helper function to find nested list items
    const findNestedItems = (
      node: ElementNode,
      ancestors: ElementNode[] = []
    ) => {
      if (node.type === 'list-item' && ancestors.length >= 2) {
        const parentList = ancestors[0];
        const grandparentItem = ancestors[1];
        
        if (ancestors.length >= 3 &&
            parentList.type === 'list' &&
            grandparentItem.type === 'list-item') {
          const greatGrandparentList = ancestors[2];
          
          if (greatGrandparentList.type === 'list' &&
              this.isNodeInRange(model, node, range)) {
            result.push({
              item: node,
              parentList,
              grandparentItem,
              greatGrandparentList
            });
          }
        }
      }
      
      // Recursively check children
      node.children.forEach(child => {
        if ('children' in child) {
          findNestedItems(child as ElementNode, [node, ...ancestors]);
        }
      });
    };
    
    findNestedItems(root);
    return result;
  }
  
  /**
   * Check if a node is in a range
   */
  private static isNodeInRange(
    model: DocumentModel,
    node: ElementNode,
    range: DocumentRange
  ): boolean {
    // Simple implementation - in a real editor, this would be more complex
    // and would use node paths or positions
    return true; // Placeholder
  }
  
  /**
   * Find parent node of a given node
   */
  private static findParentNode(
    model: DocumentModel,
    node: ElementNode
  ): ElementNode | null {
    // Get root element
    const root = model.getDocument();
    if (!root) return null;
    
    // Helper function to find parent
    const findParent = (
      current: ElementNode,
      target: ElementNode
    ): ElementNode | null => {
      for (const child of current.children) {
        if (child === target) {
          return current;
        }
        
        if ('children' in child) {
          const result = findParent(child as ElementNode, target);
          if (result) return result;
        }
      }
      
      return null;
    };
    
    return findParent(root, node);
  }
  
  /**
   * Remove a node from its parent
   */
  private static removeNodeFromParent(
    model: DocumentModel,
    node: ElementNode
  ): void {
    const parent = this.findParentNode(model, node);
    if (!parent) return;
    
    const index = parent.children.indexOf(node);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
  }
  
  /**
   * Insert a node at the position of a reference node
   */
  private static insertNodeAtPosition(
    model: DocumentModel,
    newNode: ElementNode,
    referenceNode: ElementNode
  ): void {
    const parent = this.findParentNode(model, referenceNode);
    if (!parent) return;
    
    const index = parent.children.indexOf(referenceNode);
    if (index !== -1) {
      parent.children.splice(index, 0, newNode);
    }
  }
}