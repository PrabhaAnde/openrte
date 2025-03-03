import { DocumentNode, TextNode, ElementNode, Document } from './interfaces';

/**
 * Model Inspector for debugging and analyzing the document model
 */
export class ModelInspector {
  /**
   * Convert a document node to a readable string
   * 
   * @param node The node to convert
   * @param indent Indentation level (for recursion)
   * @returns Formatted string representation
   */
  static nodeToString(node: DocumentNode, indent: number = 0): string {
    const padding = ' '.repeat(indent * 2);
    
    if (node.type === 'text') {
      const textNode = node as TextNode;
      const marksStr = textNode.marks && textNode.marks.length > 0 
        ? ` [${textNode.marks.map(m => m.type).join(', ')}]` 
        : '';
      return `${padding}TEXT: "${textNode.text}"${marksStr}`;
    }
    
    const elementNode = node as ElementNode;
    const attrStr = elementNode.attributes 
      ? ` ${Object.entries(elementNode.attributes)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')}` 
      : '';
    
    let result = `${padding}${node.type.toUpperCase()}${attrStr}\n`;
    
    if (elementNode.children && elementNode.children.length > 0) {
      result += elementNode.children
        .map(child => this.nodeToString(child, indent + 1))
        .join('\n');
    }
    
    return result;
  }
  
  /**
   * Find occurrences of text with specific marks
   * 
   * @param node The node to search in
   * @param markType The mark type to find
   * @returns Array of matching text nodes
   */
  static findTextWithMark(node: DocumentNode, markType: string): TextNode[] {
    const results: TextNode[] = [];
    
    if (node.type === 'text') {
      const textNode = node as TextNode;
      if (textNode.marks && textNode.marks.some(mark => mark.type === markType)) {
        results.push(textNode);
      }
      return results;
    }
    
    const elementNode = node as ElementNode;
    if (elementNode.children) {
      elementNode.children.forEach(child => {
        results.push(...this.findTextWithMark(child, markType));
      });
    }
    
    return results;
  }
  
  /**
   * Count nodes by type
   * 
   * @param node The node to count from
   * @returns Object with counts by node type
   */
  static countNodesByType(node: DocumentNode): Record<string, number> {
    const counts: Record<string, number> = {
      [node.type]: 1
    };
    
    if (node.type !== 'text') {
      const elementNode = node as ElementNode;
      if (elementNode.children) {
        elementNode.children.forEach(child => {
          const childCounts = this.countNodesByType(child);
          Object.entries(childCounts).forEach(([type, count]) => {
            counts[type] = (counts[type] || 0) + count;
          });
        });
      }
    }
    
    return counts;
  }
  
  /**
   * Get statistics about the document
   * 
   * @param document The document to analyze
   * @returns Statistics object
   */
  static getDocumentStats(document: Document): {
    nodeCount: number;
    textNodeCount: number;
    wordCount: number;
    charCount: number;
    formattingCount: Record<string, number>;
  } {
    const nodeCount = this.countTotalNodes(document);
    const textNodes = this.getAllTextNodes(document);
    const textNodeCount = textNodes.length;
    
    // Count words and characters
    let wordCount = 0;
    let charCount = 0;
    
    // Count formatting marks
    const formattingCount: Record<string, number> = {};
    
    textNodes.forEach(node => {
      // Count characters
      charCount += node.text.length;
      
      // Count words (simple split by whitespace)
      wordCount += node.text.trim().split(/\s+/).filter(Boolean).length;
      
      // Count formatting marks
      if (node.marks) {
        node.marks.forEach(mark => {
          formattingCount[mark.type] = (formattingCount[mark.type] || 0) + 1;
        });
      }
    });
    
    return {
      nodeCount,
      textNodeCount,
      wordCount,
      charCount,
      formattingCount
    };
  }
  
  /**
   * Count the total number of nodes in the document
   * 
   * @param node The node to count from
   * @returns Total node count
   */
  private static countTotalNodes(node: DocumentNode): number {
    if (node.type === 'text') {
      return 1;
    }
    
    const elementNode = node as ElementNode;
    let count = 1; // Count this node
    
    if (elementNode.children) {
      elementNode.children.forEach(child => {
        count += this.countTotalNodes(child);
      });
    }
    
    return count;
  }
  
  /**
   * Get all text nodes in the document
   * 
   * @param node The node to search from
   * @returns Array of all text nodes
   */
  private static getAllTextNodes(node: DocumentNode): TextNode[] {
    const results: TextNode[] = [];
    
    if (node.type === 'text') {
      results.push(node as TextNode);
      return results;
    }
    
    const elementNode = node as ElementNode;
    if (elementNode.children) {
      elementNode.children.forEach(child => {
        results.push(...this.getAllTextNodes(child));
      });
    }
    
    return results;
  }
}