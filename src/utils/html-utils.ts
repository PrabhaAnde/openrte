/**
 * HTML Utilities for OpenRTE
 * 
 * This module provides utilities for HTML processing, sanitization,
 * and normalization across browsers.
 */

/**
 * Basic HTML sanitization to prevent XSS
 * 
 * @param html HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Remove potentially dangerous elements and attributes
    const dangerousElements = ['script', 'iframe', 'object', 'embed', 'base'];
    const dangerousAttributes = ['onerror', 'onload', 'onclick', 'onmouseover'];
    
    // Remove dangerous elements
    dangerousElements.forEach(tagName => {
      const elements = tempElement.getElementsByTagName(tagName);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].parentNode?.removeChild(elements[i]);
      }
    });
    
    // Remove dangerous attributes
    const allElements = tempElement.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      
      dangerousAttributes.forEach(attrName => {
        if (element.hasAttribute(attrName)) {
          element.removeAttribute(attrName);
        }
      });
      
      // Clean up href attributes that might contain javascript:
      if (element.hasAttribute('href')) {
        const href = element.getAttribute('href');
        if (href && href.toLowerCase().trim().startsWith('javascript:')) {
          element.setAttribute('href', '#');
        }
      }
      
      // Clean up src attributes
      if (element.hasAttribute('src')) {
        const src = element.getAttribute('src');
        if (src && src.toLowerCase().trim().startsWith('javascript:')) {
          element.removeAttribute('src');
        }
      }
    }
    
    return tempElement.innerHTML;
  }
  
  /**
   * Normalizes HTML to handle browser inconsistencies
   * 
   * @param html HTML string to normalize
   * @returns Normalized HTML string
   */
  export function normalizeHtml(html: string): string {
    if (!html) return '';
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Fix empty paragraphs
    const paragraphs = tempElement.getElementsByTagName('p');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      if (!p.textContent?.trim()) {
        p.innerHTML = '<br>';
      }
    }
    
    // Fix nested block elements
    const blockElements = tempElement.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6');
    
    for (let i = 0; i < blockElements.length; i++) {
      const element = blockElements[i];
      const nestedBlocks = element.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6');
      
      if (nestedBlocks.length > 0) {
        // Only fix if this is a direct nesting issue
        for (let j = 0; j < nestedBlocks.length; j++) {
          const nestedBlock = nestedBlocks[j];
          if (nestedBlock.parentNode === element) {
            // Move nested block after the current block
            if (element.nextSibling) {
              element.parentNode?.insertBefore(nestedBlock, element.nextSibling);
            } else {
              element.parentNode?.appendChild(nestedBlock);
            }
          }
        }
      }
    }
    
    // Normalize list structures
    const lists = tempElement.querySelectorAll('ul, ol');
    for (let i = 0; i < lists.length; i++) {
      const list = lists[i];
      const children = Array.from(list.children);
      
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        // Ensure only li elements are direct children of lists
        if (child.tagName !== 'LI') {
          const li = document.createElement('li');
          li.appendChild(child.cloneNode(true));
          list.replaceChild(li, child);
        }
      }
    }
    
    // Fix table structures
    const tables = tempElement.getElementsByTagName('table');
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      
      // Ensure tables have tbody
      if (table.getElementsByTagName('tbody').length === 0) {
        const rows = table.getElementsByTagName('tr');
        if (rows.length > 0) {
          const tbody = document.createElement('tbody');
          for (let j = rows.length - 1; j >= 0; j--) {
            tbody.insertBefore(rows[j], tbody.firstChild);
          }
          table.appendChild(tbody);
        }
      }
    }
    
    return tempElement.innerHTML;
  }
  
  /**
   * Converts HTML to plain text
   * 
   * @param html HTML string to convert
   * @returns Plain text representation
   */
  export function htmlToPlainText(html: string): string {
    if (!html) return '';
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Replace <br> and block elements with newlines
    const blockElements = tempElement.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote, li');
    for (let i = 0; i < blockElements.length; i++) {
      blockElements[i].appendChild(document.createTextNode('\n'));
    }
    
    // Replace <br> elements with newlines
    const brElements = tempElement.querySelectorAll('br');
    for (let i = 0; i < brElements.length; i++) {
      brElements[i].parentNode?.replaceChild(document.createTextNode('\n'), brElements[i]);
    }
    
    return tempElement.textContent || '';
  }
  
  /**
   * Normalizes whitespace in HTML
   * 
   * @param html HTML string to process
   * @returns HTML with normalized whitespace
   */
  export function normalizeWhitespace(html: string): string {
    if (!html) return '';
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Function to process text nodes
    function processNode(node: Node): void {
      if (node.nodeType === Node.TEXT_NODE) {
        // Normalize whitespace in text nodes
        node.textContent = node.textContent?.replace(/\s+/g, ' ') || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i]);
        }
      }
    }
    
    // Process all nodes
    for (let i = 0; i < tempElement.childNodes.length; i++) {
      processNode(tempElement.childNodes[i]);
    }
    
    return tempElement.innerHTML;
  }
  
  /**
   * Extracts text from a node with formatting
   * 
   * @param node The node to extract text from
   * @returns Plain text content with basic formatting
   */
  export function extractTextWithFormatting(node: Node): string {
    if (!node) return '';
    
    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      let output = '';
      
      // Add appropriate formatting based on element type
      switch (element.tagName) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          output += '\n# ';
          break;
        case 'P':
          output += '\n';
          break;
        case 'BR':
          output += '\n';
          break;
        case 'LI':
          output += '\n• ';
          break;
        case 'STRONG':
        case 'B':
          output += '*';
          break;
        case 'EM':
        case 'I':
          output += '_';
          break;
      }
      
      // Process child nodes
      for (let i = 0; i < element.childNodes.length; i++) {
        output += extractTextWithFormatting(element.childNodes[i]);
      }
      
      // Close formatting if needed
      switch (element.tagName) {
        case 'STRONG':
        case 'B':
          output += '*';
          break;
        case 'EM':
        case 'I':
          output += '_';
          break;
        case 'P':
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          output += '\n';
          break;
      }
      
      return output;
    }
    
    return '';
  }
  
  /**
   * Gets the outer HTML of a range
   * 
   * @param range Range to get HTML from
   * @returns HTML string representation of the range
   */
  export function getRangeHtml(range: Range): string {
    if (!range) return '';
    
    const tempElement = document.createElement('div');
    tempElement.appendChild(range.cloneContents());
    return tempElement.innerHTML;
  }
  
  /**
   * Creates a unique string that can be used as an ID
   * 
   * @returns Unique string ID
   */
  export function createUniqueId(): string {
    return 'openrte-' + Math.random().toString(36).substring(2, 9);
  }