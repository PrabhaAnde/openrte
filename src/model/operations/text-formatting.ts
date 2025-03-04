import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { TextNode, Mark, ElementNode,DocumentNode } from '../interfaces';

/**
 * Operations for text formatting in the document model
 */
export class TextFormattingOperations {
  /**
   * Apply a mark to text in a range
   */
  static applyMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string,
    markValue?: string
  ): void {
    // Get text nodes in range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Apply mark to each text node
    textNodes.forEach(node => {
      const marks = node.marks || [];
      
      // Check if mark already exists
      const existingMarkIndex = marks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        // Add new mark
        marks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        // Update existing mark value
        marks[existingMarkIndex].value = markValue;
      }
      
      node.marks = marks;
    });
  }
  
  /**
   * Remove a mark from text in a range
   */
  static removeMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string
  ): void {
    // Get text nodes in range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Remove mark from each text node
    textNodes.forEach(node => {
      if (!node.marks) return;
      
      node.marks = node.marks.filter(mark => mark.type !== markType);
      
      // If no marks left, remove the marks array
      if (node.marks.length === 0) {
        delete node.marks;
      }
    });
  }
  
  /**
   * Toggle a mark in a range
   */
  static toggleMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string,
    markValue?: string
  ): void {
    // Check if mark exists in range
    const hasMarkInRange = this.hasMarkInRange(model, range, markType);
    
    if (hasMarkInRange) {
      this.removeMark(model, range, markType);
    } else {
      this.applyMark(model, range, markType, markValue);
    }
  }
  
  /**
   * Check if a mark exists in a range
   */
  static hasMarkInRange(
    model: DocumentModel,
    range: DocumentRange,
    markType: string
  ): boolean {
    // Get text nodes in range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Check if any node has the mark
    return textNodes.some(node => 
      node.marks && node.marks.some(mark => mark.type === markType)
    );
  }
  
  /**
   * Get all text nodes in a range
   * Improved implementation that uses range information
   */
  private static getTextNodesInRange(
    model: DocumentModel,
    range: DocumentRange
  ): TextNode[] {
    if (!range || !range.start || !range.end) {
      return [];
    }
    
    // Start with all text nodes in the document
    const allTextNodes = this.collectTextNodes(model.getDocument());
    
    // If we have path-based selection, we can filter more effectively
    // For now, we'll use a simplified approach that leverages node IDs
    
    // Get the start and end node IDs
    const startNodeId = range.start.node.id;
    const endNodeId = range.end.node.id;
    
    // If both start and end are the same text node
    if (startNodeId === endNodeId && range.start.node.type === 'text') {
      return [range.start.node as TextNode];
    }
    
    // Otherwise, we need to find all text nodes between start and end
    // This is a simplified implementation
    let inRange = false;
    const result: TextNode[] = [];
    
    for (const node of allTextNodes) {
      // Start collecting when we find the start node
      if (node.id === startNodeId) {
        inRange = true;
      }
      
      // If we're in range, collect the node
      if (inRange) {
        result.push(node);
      }
      
      // Stop collecting after we find the end node
      if (node.id === endNodeId) {
        inRange = false;
      }
    }
    
    // If we didn't find any nodes, it might mean the range is in a different order
    // Try the reverse order
    if (result.length === 0) {
      inRange = false;
      for (const node of allTextNodes) {
        // Start collecting when we find the end node
        if (node.id === endNodeId) {
          inRange = true;
        }
        
        // If we're in range, collect the node
        if (inRange) {
          result.push(node);
        }
        
        // Stop collecting after we find the start node
        if (node.id === startNodeId) {
          inRange = false;
        }
      }
    }
    
    // If we still didn't find any nodes, fallback to all nodes
    // This ensures we don't break existing functionality
    if (result.length === 0) {
      // As a fallback, if we're dealing with unknown node types,
      // we'll find text nodes that are descendants of the common ancestor
      const startParents = this.getParentChain(range.start.node);
      const endParents = this.getParentChain(range.end.node);
      
      // Find common ancestor
      let commonAncestor = null;
      for (const parent of startParents) {
        if (endParents.includes(parent)) {
          commonAncestor = parent;
          break;
        }
      }
      
      if (commonAncestor) {
        return this.collectTextNodes(commonAncestor);
      }
    }
    
    return result;
  }
  
  /**
   * Get the chain of parent nodes for a node
   */
  private static getParentChain(node: DocumentNode): DocumentNode[] {
    const result: DocumentNode[] = [node];
    
    // This would require keeping parent references in the model
    // which is not implemented here
    
    return result;
  }
  
  /**
   * Collect all text nodes in a document node
   */
  private static collectTextNodes(node: any): TextNode[] {
    if (node.type === 'text') {
      return [node as TextNode];
    }
    
    const result: TextNode[] = [];
    
    if ('children' in node) {
      const elementNode = node as ElementNode;
      elementNode.children.forEach(child => {
        result.push(...this.collectTextNodes(child));
      });
    }
    
    return result;
  }
  
  /**
   * Split a text node at a specific offset
   */
  static splitTextNode(
    model: DocumentModel,
    node: TextNode,
    offset: number
  ): [TextNode, TextNode] {
    if (offset <= 0 || offset >= node.text.length) {
      return [node, node]; // No need to split
    }
    
    // Create two new text nodes
    const leftText = node.text.substring(0, offset);
    const rightText = node.text.substring(offset);
    
    const leftNode = model.createTextNode(leftText, node.marks);
    const rightNode = model.createTextNode(rightText, node.marks);
    
    return [leftNode, rightNode];
  }
  
  /**
   * Apply a mark to a specific portion of a text node
   */
  static applyMarkToTextNodeRange(
    model: DocumentModel,
    node: TextNode,
    start: number,
    end: number,
    markType: string,
    markValue?: string
  ): TextNode[] {
    // Ensure valid range
    start = Math.max(0, start);
    end = Math.min(node.text.length, end);
    
    if (start >= end) {
      return [node]; // Nothing to do
    }
    
    // If the range covers the entire node, apply the mark directly
    if (start === 0 && end === node.text.length) {
      const marks = node.marks || [];
      const existingMarkIndex = marks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        marks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        marks[existingMarkIndex].value = markValue;
      }
      
      node.marks = marks;
      return [node];
    }
    
    // Otherwise, split the node and apply the mark to the middle part
    const result: TextNode[] = [];
    
    // Split at the start if needed
    if (start > 0) {
      const [left, right] = this.splitTextNode(model, node, start);
      result.push(left);
      
      // Apply mark to the right part up to end - start
      const rightMarks = right.marks || [];
      const existingMarkIndex = rightMarks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        rightMarks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        rightMarks[existingMarkIndex].value = markValue;
      }
      
      right.marks = rightMarks;
      
      // Split the right part if needed
      if (end < node.text.length) {
        const [middle, far] = this.splitTextNode(model, right, end - start);
        result.push(middle);
        result.push(far);
      } else {
        result.push(right);
      }
    } else {
      // Start is 0, so split at end
      const [left, right] = this.splitTextNode(model, node, end);
      
      // Apply mark to the left part
      const leftMarks = left.marks || [];
      const existingMarkIndex = leftMarks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        leftMarks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        leftMarks[existingMarkIndex].value = markValue;
      }
      
      left.marks = leftMarks;
      
      result.push(left);
      result.push(right);
    }
    
    return result;
  }
}