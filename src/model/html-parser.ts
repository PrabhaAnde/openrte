import { DocumentModel } from './document-model';
import { DocumentNode, Mark, ElementNode, TextNode, NodeType } from './interfaces';
import { sanitizeHtml, normalizeHtml } from '../utils/html-utils';

/**
 * Options for HTML parsing
 */
export interface ParserOptions {
  /**
   * Whether to sanitize HTML before parsing
   */
  sanitize?: boolean;
  
  /**
   * Whether to normalize HTML before parsing
   */
  normalize?: boolean;
  
  /**
   * Additional tag mappings
   */
  tagMappings?: Record<string, string>;
  
  /**
   * Whether to preserve whitespace
   */
  preserveWhitespace?: boolean;
  
  /**
   * Whether to add data attributes for node IDs
   */
  includeNodeIds?: boolean;
}

/**
 * HTML Parser for converting HTML to document model
 */
export class HTMLParser {
  /**
   * Default parser options
   */
  private static defaultOptions: ParserOptions = {
    sanitize: true,
    normalize: true,
    preserveWhitespace: false,
    includeNodeIds: false
  };

  /**
   * Parses HTML string to document model
   *
   * @param html HTML string to parse
   * @param documentModel Document model instance
   * @param options Parser options
   * @returns The parsed document node
   */
  static parse(html: string, documentModel: DocumentModel, options: ParserOptions = {}): DocumentNode {
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Process HTML
    let processedHtml = html;
    
    if (mergedOptions.sanitize) {
      processedHtml = sanitizeHtml(processedHtml);
    }
    
    if (mergedOptions.normalize) {
      processedHtml = normalizeHtml(processedHtml);
    }
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = processedHtml;
    
    // Create the document root
    const root = documentModel.createElementNode('root');
    
    // Process all child nodes
    for (let i = 0; i < tempElement.childNodes.length; i++) {
      const childNode = this.processNode(tempElement.childNodes[i], documentModel, mergedOptions);
      if (childNode) {
        root.children.push(childNode);
      }
    }
    
    // If no children were added, add a default paragraph
    if (root.children.length === 0) {
      root.children.push(documentModel.createParagraph());
    }
    
    return root;
  }
  
  /**
   * Process a DOM node into a document node
   *
   * @param domNode DOM node to process
   * @param documentModel Document model instance
   * @param options Parser options
   * @returns Processed document node or null
   */
  private static processNode(domNode: Node, documentModel: DocumentModel, options: ParserOptions): DocumentNode | null {
    // Handle text nodes
    if (domNode.nodeType === Node.TEXT_NODE) {
      const text = domNode.textContent || '';
      // Skip empty text nodes unless preserving whitespace
      if (!text.trim() && !options.preserveWhitespace) return null;
      return documentModel.createTextNode(text);
    }
    
    // Handle element nodes
    if (domNode.nodeType === Node.ELEMENT_NODE) {
      const element = domNode as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      // Map HTML tags to node types, using custom mappings if provided
      const mappedTag = options.tagMappings?.[tagName] || tagName;
      const nodeType = this.mapTagToNodeType(mappedTag);
      
      // Create attributes object
      const attributes: Record<string, string> = {};
      Array.from(element.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
      });
      
      // Add special attributes based on tag type
      if (tagName.match(/^h[1-6]$/)) {
        // Extract heading level from h1-h6 tags
        attributes['level'] = tagName.substring(1);
      } else if (tagName === 'ol') {
        attributes['list-type'] = 'ordered';
      } else if (tagName === 'ul') {
        attributes['list-type'] = 'bullet';
      } else if (tagName === 'a' && element.hasAttribute('href')) {
        attributes['href'] = element.getAttribute('href') || '';
      } else if (tagName === 'img') {
        if (element.hasAttribute('src')) {
          attributes['src'] = element.getAttribute('src') || '';
        }
        if (element.hasAttribute('alt')) {
          attributes['alt'] = element.getAttribute('alt') || '';
        }
      } else if (tagName === 'th') {
        attributes['cell-type'] = 'header';
      }
      
      // Create element node
      const elementNode = documentModel.createElementNode(nodeType, attributes);
      
      // Add node ID as data attribute if requested
      if (options.includeNodeIds) {
        elementNode.attributes = elementNode.attributes || {};
        elementNode.attributes['data-node-id'] = elementNode.id;
      }
      
      // Process child nodes
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = this.processNode(element.childNodes[i], documentModel, options);
        if (childNode) {
          elementNode.children.push(childNode);
        }
      }
      
      // Process marks for text formatting
      if (this.isTextFormattingElement(tagName)) {
        // Handle marks by converting element to a mark on its text children
        this.applyMarkToChildren(elementNode, tagName, documentModel);
        return null; // The element itself is removed, its children processed with marks
      }
      
      return elementNode;
    }
    
    return null;
  }
  
  /**
   * Map HTML tag to node type
   * 
   * @param tagName HTML tag name
   * @returns Corresponding node type
   */
  private static mapTagToNodeType(tagName: string): NodeType {
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
   * Check if element is for text formatting
   * 
   * @param tagName HTML tag name
   * @returns True if it's a text formatting element
   */
  private static isTextFormattingElement(tagName: string): boolean {
    const formattingTags = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'code'];
    return formattingTags.includes(tagName);
  }
  
  /**
   * Apply a mark to all text children of an element
   *
   * @param element Element node containing text to mark
   * @param tagName HTML tag name
   * @param documentModel Document model instance
   */
  private static applyMarkToChildren(
    element: ElementNode,
    tagName: string,
    documentModel: DocumentModel
  ): void {
    // Map tag to mark type (initially)
    let markType = this.mapTagToMarkType(tagName);
    
    // Extract mark value if applicable
    let markValue: string | undefined;
    
    // Handle special cases for marks with values
    if (tagName === 'span' && element.attributes) {
      const style = element.attributes['style'] || '';
      
      // Extract color value
      const colorMatch = style.match(/color:\s*([^;]+)/i);
      if (colorMatch) {
        markType = 'color';
        markValue = colorMatch[1].trim();
      }
      
      // Extract background color value
      const bgMatch = style.match(/background-color:\s*([^;]+)/i);
      if (bgMatch) {
        markType = 'background';
        markValue = bgMatch[1].trim();
      }
    }
    
    // Process all children, adding the mark to text nodes
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i];
      
      if (child.type === 'text') {
        const textNode = child as TextNode;
        const marks = textNode.marks || [];
        marks.push({
          type: markType,
          value: markValue
        });
        textNode.marks = marks;
      }
    }
  }
  
  /**
   * Map HTML tag to mark type
   * 
   * @param tagName HTML tag name
   * @returns Corresponding mark type
   */
  private static mapTagToMarkType(tagName: string): Mark['type'] {
    switch (tagName) {
      case 'b':
      case 'strong':
        return 'bold';
      case 'i':
      case 'em':
        return 'italic';
      case 'u':
        return 'underline';
      case 's':
      case 'strike':
      case 'del':
        return 'strikethrough';
      case 'code':
        return 'code';
      default:
        return 'bold'; // Default fallback
    }
  }
  
  /**
   * Parse sanitized and normalized HTML to document model
   *
   * @param html Raw HTML string
   * @param documentModel Document model instance
   * @param options Parser options (sanitize and normalize will be forced to true)
   * @returns The parsed document node
   */
  static parseProcessedHtml(html: string, documentModel: DocumentModel, options: ParserOptions = {}): DocumentNode {
    // Create options with forced sanitize and normalize
    const processOptions: ParserOptions = {
      ...options,
      sanitize: true,
      normalize: true
    };
    
    // Parse with processing options
    return this.parse(html, documentModel, processOptions);
  }
}