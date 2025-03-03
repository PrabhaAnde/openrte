import { DocumentNode, TextNode, ElementNode } from './interfaces';
import { Mark } from './interfaces';

export class DocumentRenderer {
  /**
   * Render a document node to DOM
   */
  static renderNode(node: DocumentNode): Node {
    if (node.type === 'text') {
      return this.renderTextNode(node as TextNode);
    } else {
      return this.renderElementNode(node as ElementNode);
    }
  }
  
  /**
   * Render a text node
   */
  private static renderTextNode(node: TextNode): Text | Node {
    const textNode = document.createTextNode(node.text);
    
    // If no marks, return the text node directly
    if (!node.marks || node.marks.length === 0) {
      return textNode;
    }
    
    // Apply marks by wrapping in appropriate elements
    let result: Node = textNode;
    
    // Apply marks in a specific order
    const orderedMarks = this.orderMarks(node.marks);
    
    orderedMarks.forEach(mark => {
      const wrapper = this.createMarkElement(mark);
      wrapper.appendChild(result);
      result = wrapper;
    });
    
    return result;
  }
  
  /**
   * Order marks to ensure consistent nesting
   */
  private static orderMarks(marks: Mark[]): Mark[] {
    // Define priority order
    const priority: Record<string, number> = {
      'bold': 1,
      'italic': 2,
      'underline': 3,
      'strikethrough': 4,
      'code': 5,
      'color': 6,
      'background': 7
    };
    
    return [...marks].sort((a, b) => 
      (priority[a.type] || 100) - (priority[b.type] || 100)
    );
  }
  
  /**
   * Create an element for a mark
   */
  private static createMarkElement(mark: Mark): HTMLElement {
    let element: HTMLElement;
    
    switch (mark.type) {
      case 'bold':
        element = document.createElement('strong');
        break;
      case 'italic':
        element = document.createElement('em');
        break;
      case 'underline':
        element = document.createElement('u');
        break;
      case 'strikethrough':
        element = document.createElement('s');
        break;
      case 'code':
        element = document.createElement('code');
        break;
      case 'color':
        element = document.createElement('span');
        element.style.color = mark.value || '';
        break;
      case 'background':
        element = document.createElement('span');
        element.style.backgroundColor = mark.value || '';
        break;
      default:
        element = document.createElement('span');
    }
    
    element.setAttribute('data-mark', mark.type);
    if (mark.value) {
      element.setAttribute('data-value', mark.value);
    }
    
    return element;
  }
  
  /**
   * Render an element node
   */
  private static renderElementNode(node: ElementNode): HTMLElement {
    // Map node type to HTML element
    const element = this.createElementForType(node);
    
    // Add custom attribute for node identification
    element.setAttribute('data-node-id', node.id);
    element.setAttribute('data-node-type', node.type);
    
    // Apply attributes
    if (node.attributes) {
      Object.entries(node.attributes).forEach(([key, value]) => {
        // Handle special attributes
        if (key === 'level' && node.type === 'heading') {
          // Don't set level as attribute, it's handled by the element type
        } else if (key === 'list-type') {
          // Don't set list-type as attribute, it's handled by the element type
        } else if (key === 'cell-type') {
          // Don't set cell-type as attribute, it's handled by the element type
        } else {
          element.setAttribute(key, value);
        }
      });
    }
    
    // Render children
    if (node.children) {
      node.children.forEach(child => {
        element.appendChild(this.renderNode(child));
      });
    }
    
    return element;
  }
  
  /**
   * Create an HTML element for a node type
   */
  private static createElementForType(node: ElementNode): HTMLElement {
    const type = node.type;
    const attributes = node.attributes || {};
    
    switch (type) {
      case 'root':
        return document.createElement('div');
      case 'paragraph':
        return document.createElement('p');
      case 'heading': {
        const level = attributes.level ? parseInt(attributes.level, 10) : 2;
        const validLevel = Math.max(1, Math.min(6, level)); // Ensure level is between 1-6
        return document.createElement(`h${validLevel}`);
      }
      case 'list': {
        const listType = attributes['list-type'] || 'bullet';
        return document.createElement(listType === 'ordered' ? 'ol' : 'ul');
      }
      case 'list-item':
        return document.createElement('li');
      case 'link': {
        const a = document.createElement('a');
        if (attributes.href) {
          a.href = attributes.href;
        }
        return a;
      }
      case 'image': {
        const img = document.createElement('img');
        if (attributes.src) {
          img.src = attributes.src;
        }
        if (attributes.alt) {
          img.alt = attributes.alt;
        }
        return img;
      }
      case 'table':
        return document.createElement('table');
      case 'table-row':
        return document.createElement('tr');
      case 'table-cell': {
        const cellType = attributes['cell-type'] || 'data';
        return document.createElement(cellType === 'header' ? 'th' : 'td');
      }
      default:
        return document.createElement('div');
    }
  }
  
  /**
   * Render the entire document to a container
   */
  static renderDocument(document: DocumentNode, container: HTMLElement): void {
    // Clear container first
    container.innerHTML = '';
    
    // If the document is the root, render its children directly
    if (document.type === 'root') {
      const elementNode = document as ElementNode;
      elementNode.children.forEach(child => {
        container.appendChild(this.renderNode(child));
      });
    } else {
      // Otherwise render the document directly
      container.appendChild(this.renderNode(document));
    }
  }
}