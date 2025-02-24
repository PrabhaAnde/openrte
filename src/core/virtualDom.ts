export interface VNode {
  type: string;
  props: { [key: string]: any };
  children: (VNode | string)[];
}

export function h(type: string, props: { [key: string]: any } = {}, children: (VNode | string)[] = []): VNode {
  return { 
    type, 
    props, 
    children: Array.isArray(children) ? children : [children] 
  };
}

// Helper function to apply style string
function applyStyles(element: HTMLElement, styleString: string): void {
  const styles = styleString.split(';').filter(s => s.trim());
  
  styles.forEach(style => {
    const [property, value] = style.split(':').map(s => s.trim());
    if (property && value) {
      (element.style as any)[property] = value;
    }
  });
}

export function patch(node: Element | VNode, vnode: VNode): Element {
  console.log('Patching:', { node, vnode }); // Debug
  
  // If the node is already an element and we're recreating the same type of element
  // We can reuse it instead of creating a new one (this helps preserve focus)
  let element: Element;
  
  if (node instanceof Element && node.tagName.toLowerCase() === vnode.type.toLowerCase()) {
    // Reuse existing element
    element = node;
    // Clear existing attributes
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
    }
  } else {
    // Create new element
    element = document.createElement(vnode.type);
  }
  
  // Apply properties
  Object.entries(vnode.props).forEach(([key, value]) => {
    // Handle special cases
    if (key === 'contenteditable') {
      element.setAttribute('contenteditable', value);
    }
    // Handle style property specially to ensure it's applied
    else if (key === 'style' && typeof value === 'string') {
      applyStyles(element as HTMLElement, value);
    }
    // Handle event handlers (props starting with 'on')
    else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase(); // e.g., onclick -> click
      
      // Add the event listener
      element.addEventListener(eventName, value);
      console.log(`Added ${eventName} event listener to`, element);
      
      // Mark this element to help debug
      element.setAttribute('data-has-event', eventName);
    } 
    else {
      element.setAttribute(key, value);
    }
  });

  // Handle children - first clear existing content if we're reusing the element
  if (node instanceof Element && node.tagName.toLowerCase() === vnode.type.toLowerCase()) {
    // Clear existing children
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  // Append children
  vnode.children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      // Recursively create children elements
      const childElement = patch(document.createElement(child.type), child);
      element.appendChild(childElement);
    }
  });

  // Replace the node if needed
  if (node instanceof Element && node !== element) {
    node.replaceWith(element);
  }
  
  // Fix content area text coloring
  if (element.classList.contains('openrte-content')) {
    console.log('Content element created/updated with styles:', (element as HTMLElement).style.cssText);
    
    // Force some critical styles directly
    (element as HTMLElement).style.minHeight = '200px';
    (element as HTMLElement).style.height = '300px';
    (element as HTMLElement).style.padding = '16px';
    (element as HTMLElement).style.backgroundColor = 'white';
    (element as HTMLElement).style.color = '#333';
    
    // Set up a MutationObserver to fix any newly added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = '#333';
            }
          });
        }
      });
    });
    
    observer.observe(element, { childList: true, subtree: true });
  }
  
  return element;
}