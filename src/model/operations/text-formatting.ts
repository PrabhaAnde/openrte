import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { TextNode, Mark, ElementNode } from '../interfaces';

/**
 * Operations for text formatting in the document model
 */
export class TextFormattingOperations {
  /**
   * Apply a mark to text in a range
   * 
   * @param model Document model
   * @param range Document range to apply mark to
   * @param markType Type of mark to apply
   * @param markValue Optional mark value
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
   * 
   * @param model Document model
   * @param range Document range to remove mark from
   * @param markType Type of mark to remove
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
   * 
   * @param model Document model
   * @param range Document range to toggle mark in
   * @param markType Type of mark to toggle
   * @param markValue Optional mark value
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
   * 
   * @param model Document model
   * @param range Document range to check
   * @param markType Type of mark to check for
   * @returns True if mark exists in range
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
   * 
   * @param model Document model
   * @param range Document range
   * @returns Array of text nodes in the range
   */
  private static getTextNodesInRange(
    model: DocumentModel,
    range: DocumentRange
  ): TextNode[] {
    // This is a simplified implementation
    // A more robust implementation would use range information to find nodes
    
    // For now, we'll collect all text nodes in the document as a starting point
    const allTextNodes = this.collectTextNodes(model.getDocument());
    
    // In a proper implementation, we would filter these text nodes based on the range
    // For simplicity, we'll just return all text nodes
    return allTextNodes;
  }
  
  /**
   * Collect all text nodes in a document node
   * 
   * @param node Document node
   * @returns Array of text nodes
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
}