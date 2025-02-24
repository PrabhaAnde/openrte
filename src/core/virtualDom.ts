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
    // Clear event listeners - This requires keeping track of listeners separately
    // as we can't enumerate them directly
  } else {
    // Create new element
    element = document.createElement(vnode.type);
  }
  
  // Apply properties
  Object.entries(vnode.props).forEach(([key, value]) => {
    // Handle special cases
    if (key === 'contenteditable') {
      // element.contentEditable = value;
      element.setAttribute('contenteditable', String(value));
    } 
    // Handle event handlers (props starting with 'on')
    else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase(); // e.g., onclick -> click
      
      // Use a data attribute to mark this handler as applied
      const handlerKey = `data-handler-${eventName}`;
      
      // Remove old handler if one exists (to prevent duplicates)
      const oldHandler = element.getAttribute(handlerKey);
      if (oldHandler) {
        try {
          // This is a hack to store reference, but for now we'll just re-add
          // element.removeEventListener(eventName, window[oldHandler as any]);
          element.removeEventListener(eventName, (element as any)[handlerKey]);
        } catch (e) {
          console.warn('Failed to remove old event listener', e);
        }
      }
      
      // Add the new handler
      element.addEventListener(eventName, value);
      
      // Store a reference (though this is incomplete - we'd need a registry)
      // For now, this at least marks that we've applied a handler
      element.setAttribute(handlerKey, 'applied');
      
      console.log(`Added ${eventName} event listener to`, element);
    } 
    else {
      element.setAttribute(key, value);
    }
  });

  // Handle children - first clear existing content if we're reusing the element
  if (node instanceof Element && node.tagName.toLowerCase() === vnode.type.toLowerCase()) {
    element.innerHTML = '';
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
  
  return element;
}