import { DocumentNode, TextNode, ElementNode, Mark } from './interfaces';

/**
 * Options for HTML serialization
 */
export interface SerializerOptions {
  /**
   * Whether to pretty-print the HTML
   */
  prettyPrint?: boolean;
  
  /**
   * Whether to include data attributes for node IDs
   */
  includeNodeIds?: boolean;
  
  /**
   * Indentation string for pretty printing
   */
  indentString?: string;
  
  /**
   * Custom element renderers
   */
  customRenderers?: Record<string, (node: ElementNode) => string>;
  
  /**
   * Normalize whitespace in text nodes
   */
  normalizeWhitespace?: boolean;
  
  /**
   * Add breaks to empty blocks
   */
  addBreaksToEmptyBlocks?: boolean;
}

/**
 * Serializes document model to HTML
 */
export class HTMLSerializer {
  /**
   * Default serializer options
   */
  private static defaultOptions: SerializerOptions = {
    prettyPrint: false,
    includeNodeIds: false,
    indentString: '  ',
    normalizeWhitespace: true,
    addBreaksToEmptyBlocks: true
  };
  
  /**
   * Convert document model to HTML
   * 
   * @param document The document node to serialize
   * @param options Serialization options
   * @returns HTML string
   */
  static toHTML(
    document: DocumentNode,
    options: SerializerOptions = {}
  ): string {
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Serialize the document
    return this.serializeNode(document, 0, mergedOptions);
  }
  
  /**
   * Serialize a node to HTML
   * 
   * @param node The node to serialize
   * @param depth Current indentation depth
   * @param options Serialization options
   * @returns HTML string
   */
  private static serializeNode(
    node: DocumentNode, 
    depth: number,
    options: SerializerOptions
  ): string {
    if (node.type === 'text') {
      return this.serializeTextNode(node as TextNode, options);
    } else {
      return this.serializeElementNode(node as ElementNode, depth, options);
    }
  }
  
  /**
   * Serialize a text node to HTML
   * 
   * @param node The text node to serialize
   * @param options Serialization options
   * @returns HTML string
   */
  private static serializeTextNode(
    node: TextNode, 
    options: SerializerOptions
  ): string {
    // Process text content
    let text = node.text;
    
    // Normalize whitespace if requested
    if (options.normalizeWhitespace) {
      // Preserve line breaks but collapse multiple spaces
      text = text.replace(/\s+/g, ' ');
    }
    
    text = this.escapeHTML(text);
    
    // If no marks, return the text directly
    if (!node.marks || node.marks.length === 0) {
      return text;
    }
    
    // Apply marks by wrapping in appropriate elements
    // Sort marks to ensure consistent nesting order
    const orderedMarks = this.orderMarksForOutput(node.marks);
    
    orderedMarks.forEach(mark => {
      text = this.wrapWithMarkElement(text, mark);
    });
    
    return text;
  }
  
  /**
   * Order marks for consistent output
   * 
   * @param marks Marks to order
   * @returns Ordered marks
   */
  private static orderMarksForOutput(marks: Mark[]): Mark[] {
    // Define nesting order for marks
    // This ordering ensures proper HTML nesting and browser compatibility
    const priority: Record<string, number> = {
      'background': 1,  // Background should be outermost
      'color': 2,       // Color comes next
      'code': 3,        // Code is typically a distinct style
      'strikethrough': 4,
      'underline': 5,
      'italic': 6,
      'bold': 7         // Bold should be innermost
    };
    
    return [...marks].sort((a, b) => 
      (priority[a.type] || 0) - (priority[b.type] || 0)
    );
  }
  
  /**
   * Wrap text with a mark element
   * 
   * @param text The text to wrap
   * @param mark The mark to apply
   * @returns HTML string
   */
  private static wrapWithMarkElement(text: string, mark: Mark): string {
    let elementTag: string;
    let attributes = '';
    
    switch (mark.type) {
      case 'bold':
        elementTag = 'strong';
        break;
      case 'italic':
        elementTag = 'em';
        break;
      case 'underline':
        elementTag = 'u';
        break;
      case 'strikethrough':
        elementTag = 's';
        break;
      case 'code':
        elementTag = 'code';
        break;
      case 'color':
        elementTag = 'span';
        attributes = ` style="color: ${mark.value || ''}"`;
        break;
      case 'background':
        elementTag = 'span';
        attributes = ` style="background-color: ${mark.value || ''}"`;
        break;
      default:
        elementTag = 'span';
        attributes = ` data-mark="${mark.type}"`;
        if (mark.value) {
          attributes += ` data-value="${this.escapeHTML(mark.value)}"`;
        }
    }
    
    return `<${elementTag}${attributes}>${text}</${elementTag}>`;
  }
  
  /**
   * Serialize an element node to HTML
   * 
   * @param node The element node to serialize
   * @param depth Current indentation depth
   * @param options Serialization options
   * @returns HTML string
   */
  private static serializeElementNode(
    node: ElementNode, 
    depth: number,
    options: SerializerOptions
  ): string {
    // Check for custom renderer
    if (options.customRenderers && options.customRenderers[node.type]) {
      return options.customRenderers[node.type](node);
    }
    
    // Map node type to HTML element
    const tagName = this.mapNodeTypeToTag(node);
    
    // Skip the root element
    if (node.type === 'root') {
      return node.children
        .map(child => this.serializeNode(child, depth, options))
        .join(options.prettyPrint ? '\n' : '');
    }
    
    // Prepare attributes
    let attributesStr = '';
    
    if (node.attributes) {
      const attributes = this.mapModelAttributesToHTML(node);
      
      attributesStr = Object.entries(attributes)
        .map(([key, value]) => ` ${key}="${this.escapeHTML(value)}"`)
        .join('');
    }
    
    // Add node ID if requested
    if (options.includeNodeIds) {
      attributesStr += ` data-node-id="${node.id}" data-node-type="${node.type}"`;
    }
    
    // Handle self-closing tags
    if (node.type === 'image' || tagName === 'img' || tagName === 'hr' || tagName === 'br') {
      return `<${tagName}${attributesStr}>`;
    }
    
    // Determine indentation
    const indent = options.prettyPrint ? 
      '\n' + options.indentString!.repeat(depth + 1) : '';
    
    const closeIndent = options.prettyPrint ? 
      '\n' + options.indentString!.repeat(depth) : '';
    
    // Check if node has children
    if (!node.children || node.children.length === 0) {
      // For empty block elements, add a break to maintain proper display
      if (options.addBreaksToEmptyBlocks && this.isBlockElement(tagName)) {
        return `<${tagName}${attributesStr}><br></${tagName}>`;
      }
      return `<${tagName}${attributesStr}></${tagName}>`;
    }
    
    // Serialize children
    const childrenStr = node.children
      .map(child => this.serializeNode(child, depth + 1, options))
      .join(options.prettyPrint ? '\n' + options.indentString!.repeat(depth + 1) : '');
    
    return `<${tagName}${attributesStr}>${indent}${childrenStr}${closeIndent}</${tagName}>`;
  }
  
  /**
   * Check if a tag represents a block element
   * 
   * @param tagName HTML tag name
   * @returns True if the tag is a block element
   */
  private static isBlockElement(tagName: string): boolean {
    const blockTags = [
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'blockquote', 'pre', 'section', 'article'
    ];
    return blockTags.includes(tagName.toLowerCase());
  }
  
  /**
   * Map node type to HTML tag
   * 
   * @param node The element node
   * @returns HTML tag name
   */
  private static mapNodeTypeToTag(node: ElementNode): string {
    const type = node.type;
    const attributes = node.attributes || {};
    
    switch (type) {
      case 'paragraph':
        return 'p';
      case 'heading': {
        const level = attributes.level ? parseInt(attributes.level, 10) : 2;
        const validLevel = Math.max(1, Math.min(6, level)); // Ensure level is between 1-6
        return `h${validLevel}`;
      }
      case 'list': {
        const listType = attributes['list-type'] || 'bullet';
        return listType === 'ordered' ? 'ol' : 'ul';
      }
      case 'list-item':
        return 'li';
      case 'link':
        return 'a';
      case 'image':
        return 'img';
      case 'table':
        return 'table';
      case 'table-row':
        return 'tr';
      case 'table-cell': {
        const cellType = attributes['cell-type'] || 'data';
        return cellType === 'header' ? 'th' : 'td';
      }
      default:
        return 'div';
    }
  }
  
  /**
   * Map model attributes to HTML attributes
   * 
   * @param node The element node
   * @returns Map of HTML attributes
   */
  private static mapModelAttributesToHTML(node: ElementNode): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (!node.attributes) return result;
    
    // Handle specific node types
    switch (node.type) {
      case 'link':
        // Ensure href attribute is present for links
        if (node.attributes.href) {
          result.href = node.attributes.href;
        }
        // Add target attribute for external links if specified
        if (node.attributes.target) {
          result.target = node.attributes.target;
        }
        break;
        
      case 'image':
        // Handle src and alt for images
        if (node.attributes.src) {
          result.src = node.attributes.src;
        }
        if (node.attributes.alt) {
          result.alt = node.attributes.alt;
        }
        // Add other image attributes
        ['width', 'height', 'title'].forEach(attr => {
          if (node.attributes && node.attributes[attr]) {
            result[attr] = node.attributes[attr];
          }
        });        break;
        
      case 'table':
      case 'table-row':
      case 'table-cell':
        // Add standard table attributes
        ['width', 'height', 'colspan', 'rowspan', 'align', 'valign'].forEach(attr => {
          if (node.attributes && node.attributes[attr]) {
            result[attr] = node.attributes[attr];
          }
        });        break;
        
      default:
        // For other nodes, handle common attributes
        break;
    }
    
    // Copy remaining attributes except for special ones that are mapped to element types
    Object.entries(node.attributes).forEach(([key, value]) => {
      // Skip special attributes that are mapped to element types
      if (key === 'level' || key === 'list-type' || key === 'cell-type') {
        return;
      }
      
      // Skip attributes already processed
      if (result[key]) {
        return;
      }
      
      // Handle style attribute specially to ensure it's valid
      if (key === 'style') {
        // Ensure style attribute ends with semicolon
        result.style = value.endsWith(';') ? value : `${value};`;
      } else {
        result[key] = value;
      }
    });
    
    return result;
  }
  
  /**
   * Escape HTML special characters
   * 
   * @param str The string to escape
   * @returns Escaped string
   */
  private static escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Convert document model to normalized HTML
   * 
   * @param document The document node to serialize
   * @returns Normalized HTML string
   */
  static toNormalizedHTML(document: DocumentNode): string {
    // Use standard options for normalized output
    const options: SerializerOptions = {
      prettyPrint: false,
      includeNodeIds: false,
      normalizeWhitespace: true,
      addBreaksToEmptyBlocks: true
    };
    
    // Serialize to HTML
    return this.toHTML(document, options);
  }
}