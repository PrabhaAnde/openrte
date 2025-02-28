/**
 * DOM Utilities for OpenRTE
 * 
 * This module provides standardized DOM manipulation functions
 * to ensure consistent behavior across plugins and browsers.
 */

/**
 * Wraps a range with the specified element
 * 
 * @param range The range to wrap
 * @param tagName The HTML tag to wrap with
 * @returns The newly created wrapper element
 */
export function wrapRangeWithElement(range: Range, tagName: string): HTMLElement {
    const element = document.createElement(tagName);
    
    try {
      range.surroundContents(element);
    } catch (e) {
      // Handle cases where surroundContents fails (e.g., when selection spans multiple nodes)
      const fragment = range.extractContents();
      element.appendChild(fragment);
      range.insertNode(element);
    }
    
    return element;
  }
  
  /**
   * Unwraps an element, preserving its children in the document
   * 
   * @param element The element to unwrap
   */
  export function unwrapElement(element: HTMLElement): void {
    const parent = element.parentNode;
    if (!parent) return;
    
    // Move all children before the element
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    
    // Remove the now-empty element
    parent.removeChild(element);
  }
  
  /**
   * Checks if an element is a block-level element
   * 
   * @param element The element to check
   * @returns True if the element is a block element
   */
  export function isBlockElement(element: HTMLElement): boolean {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'UL', 'OL', 'TABLE', 'TR', 'TD', 'TH'];
    return blockTags.includes(element.tagName);
  }
  
  /**
   * Gets the closest block element parent of a node
   * 
   * @param node The node to find the block parent for
   * @param rootElement The root element to stop the search at
   * @returns The closest block element parent, or null if none found
   */
  export function getBlockParent(node: Node, rootElement: HTMLElement): HTMLElement | null {
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }
    
    let current = node as HTMLElement;
    
    while (current && current !== rootElement) {
      if (isBlockElement(current)) {
        return current;
      }
      
      if (!current.parentNode) break;
      current = current.parentNode as HTMLElement;
    }
    
    return null;
  }
  
  /**
   * Gets all block elements within a range
   * 
   * @param range The range to search within
   * @param rootElement The root element to stop the search at
   * @returns Array of block elements within the range
   */
  export function getBlocksInRange(range: Range, rootElement: HTMLElement): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    
    // If range is collapsed, get the closest block
    if (range.collapsed) {
      const blockParent = getBlockParent(range.startContainer, rootElement);
      if (blockParent) {
        blocks.push(blockParent);
      }
      return blocks;
    }
    
    // For non-collapsed ranges, first try to get all block elements in the range
    // Create a temporary fragment to analyze the range contents
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(range.cloneContents());
    
    // Find all block elements in the fragment
    const blockElements = Array.from(tempDiv.querySelectorAll('*')).filter(
      el => isBlockElement(el as HTMLElement)
    );
    
    if (blockElements.length > 0) {
      blockElements.forEach(el => blocks.push(el as HTMLElement));
    } else {
      // If no blocks found, get the common ancestor if it's a block
      let ancestor = range.commonAncestorContainer;
      if (ancestor.nodeType === Node.TEXT_NODE) {
        ancestor = ancestor.parentNode as Node;
      }
      
      if (ancestor && isBlockElement(ancestor as HTMLElement)) {
        blocks.push(ancestor as HTMLElement);
      } else {
        // Try to get block parent
        const blockParent = getBlockParent(ancestor, rootElement);
        if (blockParent) {
          blocks.push(blockParent);
        }
      }
    }
    
    return blocks;
  }
  
  /**
   * Creates a list from the given block elements
   * 
   * @param blocks The block elements to convert to list items
   * @param listType The type of list to create (ul or ol)
   * @returns The newly created list element
   */
  export function createListFromBlocks(blocks: HTMLElement[], listType: 'ul' | 'ol'): HTMLElement {
    const list = document.createElement(listType);
    
    blocks.forEach(block => {
      const li = document.createElement('li');
      li.innerHTML = block.innerHTML;
      list.appendChild(li);
      
      // Remove the original block if it has a parent
      if (block.parentNode) {
        block.parentNode.removeChild(block);
      }
    });
    
    return list;
  }
  
  /**
   * Converts a list to regular block elements
   * 
   * @param listElement The list element to convert
   * @param blockType The type of block to create (defaults to 'p')
   * @returns Array of the newly created block elements
   */
  export function convertListToBlocks(listElement: HTMLElement, blockType: string = 'p'): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    const listItems = Array.from(listElement.querySelectorAll('li'));
    
    // Create a document fragment to hold the new blocks
    const fragment = document.createDocumentFragment();
    
    listItems.forEach(item => {
      const block = document.createElement(blockType);
      block.innerHTML = item.innerHTML;
      fragment.appendChild(block);
      blocks.push(block);
    });
    
    // Replace the list with the new blocks
    if (listElement.parentNode) {
      listElement.parentNode.insertBefore(fragment, listElement);
      listElement.parentNode.removeChild(listElement);
    }
    
    return blocks;
  }
  
  /**
   * Safely inserts HTML at the current selection or specified range
   * 
   * @param range The range where HTML should be inserted
   * @param html The HTML string to insert
   */
  export function insertHTMLAtRange(range: Range, html: string): void {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Extract fragment with all nodes
    const fragment = document.createDocumentFragment();
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    
    // Clear range contents and insert the fragment
    range.deleteContents();
    range.insertNode(fragment);
    
    // Move selection to the end of the inserted content
    range.collapse(false);
  }
  
  /**
   * Checks if an element contains a range completely
   * 
   * @param element The element to check
   * @param range The range to check
   * @returns True if the element fully contains the range
   */
  export function elementContainsRange(element: HTMLElement, range: Range): boolean {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(element);
      
      return nodeRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0 &&
             nodeRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0;
    } catch (e) {
      console.warn('Error checking if element contains range:', e);
      return false;
    }
  }
  
  /**
   * Gets all nodes of a specific type within a range
   * 
   * @param range The range to search within
   * @param nodeType The type of node to find (e.g., Node.ELEMENT_NODE)
   * @param nodeNames Optional array of tag names to filter by
   * @returns Array of matching nodes
   */
  export function getNodesInRange(
    range: Range, 
    nodeType: number,
    nodeNames?: string[]
  ): Node[] {
    const nodes: Node[] = [];
    
    // Create a NodeIterator to walk through all nodes in the range
    const nodeIterator = document.createNodeIterator(
      range.commonAncestorContainer,
      nodeType,
      {
        acceptNode: function(node) {
          // Check if node is at least partially within range
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          
          const isStartBeforeEnd = nodeRange.compareBoundaryPoints(Range.START_TO_END, range) <= 0;
          const isEndAfterStart = nodeRange.compareBoundaryPoints(Range.END_TO_START, range) >= 0;
          
          if (isStartBeforeEnd && isEndAfterStart) {
            // If nodeNames is provided, check if the node's name is in the list
            if (nodeNames && node.nodeType === Node.ELEMENT_NODE) {
              return nodeNames.includes((node as Element).tagName) ? 
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_SKIP;
        }
      } as NodeFilter
    );
    
    // Collect all matching nodes
    let currentNode;
    while (currentNode = nodeIterator.nextNode()) {
      nodes.push(currentNode);
    }
    
    return nodes;
  }
  
  /**
   * Finds elements with specified tag names within a range
   * 
   * @param range The range to search within
   * @param tagNames Array of tag names to search for
   * @returns Array of matching elements
   */
  export function findElementsInRange(range: Range, tagNames: string[]): HTMLElement[] {
    // Normalize tagNames to uppercase for case-insensitive comparison
    const normalizedTagNames = tagNames.map(tag => tag.toUpperCase());
    console.log(`Finding elements with tags: ${normalizedTagNames.join(', ')}`);
    
    // Method 1: Direct node iteration (most reliable)
    const nodes = getNodesInRange(range, Node.ELEMENT_NODE, normalizedTagNames);
    console.log(`Method 1 found ${nodes.length} nodes`);
    
    // Method 2: Check ancestor elements
    if (nodes.length === 0) {
      const ancestors: HTMLElement[] = [];
      
      // Check start container
      let startNode: Node | null = range.startContainer;
      if (startNode.nodeType === Node.TEXT_NODE) {
        startNode = startNode.parentNode;
      }
      
      while (startNode && startNode !== document.body) {
        if (startNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (startNode as HTMLElement).tagName.toUpperCase();
          if (normalizedTagNames.includes(tagName)) {
            ancestors.push(startNode as HTMLElement);
          }
        }
        startNode = startNode.parentNode;
      }
      
      // Check end container (if different from start)
      let endNode: Node | null = range.endContainer;
      if (endNode.nodeType === Node.TEXT_NODE) {
        endNode = endNode.parentNode;
      }
      
      if (endNode !== range.startContainer) {
        while (endNode && endNode !== document.body) {
          if (endNode.nodeType === Node.ELEMENT_NODE) {
            const tagName = (endNode as HTMLElement).tagName.toUpperCase();
            if (normalizedTagNames.includes(tagName) && 
                !ancestors.includes(endNode as HTMLElement)) {
              ancestors.push(endNode as HTMLElement);
            }
          }
          endNode = endNode.parentNode;
        }
      }
      
      if (ancestors.length > 0) {
        console.log(`Method 2 found ${ancestors.length} ancestor nodes`);
        return ancestors;
      }
    }
    
    // Method 3: Clone contents and search (backup method)
    if (nodes.length === 0) {
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      
      // Check for tags directly
      let foundElements: HTMLElement[] = [];
      normalizedTagNames.forEach(tagName => {
        const elements = tempDiv.getElementsByTagName(tagName);
        if (elements.length > 0) {
          foundElements = [...foundElements, ...Array.from(elements) as HTMLElement[]];
        }
      });
      
      if (foundElements.length > 0) {
        console.log('Found elements using backup method:', foundElements);
        
        // We found elements in the cloned content, now try to find them in the actual DOM
        // Let's check if the common ancestor itself is a formatting element
        let currentNode: Node | null = range.commonAncestorContainer;
        if (currentNode.nodeType === Node.TEXT_NODE) {
          currentNode = currentNode.parentNode;
        }
        
        if (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (currentNode as HTMLElement).tagName.toUpperCase();
          if (normalizedTagNames.includes(tagName)) {
            console.log(`Found common ancestor ${tagName} as formatting element`);
            return [currentNode as HTMLElement];
          }
        }
        
        // If no direct match on the common ancestor, check the nearest ancestors
        // with matching tag names
        const matchingElements: HTMLElement[] = [];
        currentNode = range.commonAncestorContainer;
        
        while (currentNode && currentNode !== document.body) {
          if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const tagName = (currentNode as HTMLElement).tagName.toUpperCase();
            if (normalizedTagNames.includes(tagName)) {
              matchingElements.push(currentNode as HTMLElement);
            }
          }
          
          if (currentNode.parentNode) {
            currentNode = currentNode.parentNode;
          } else {
            break;
          }
        }
        
        if (matchingElements.length > 0) {
          console.log(`Method 3 found ${matchingElements.length} matching elements`);
          return matchingElements;
        }
      }
    }
    
    console.log(`Returning ${nodes.length} found elements`);
    return nodes.map(node => node as HTMLElement);
  }