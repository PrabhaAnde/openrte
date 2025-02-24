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
  const element = document.createElement(vnode.type);
  
  // Apply properties
  Object.entries(vnode.props).forEach(([key, value]) => {
    if (key === 'contenteditable') {
      element.contentEditable = value;
    } 
    // Handle event handlers (props starting with 'on')
    else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase(); // Remove 'on' prefix and convert to lowercase
      element.addEventListener(eventName, value);
    } 
    else {
      element.setAttribute(key, value);
    }
  });

  // Append children
  vnode.children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(patch(element, child));
    }
  });

  if (node instanceof Element) {
    node.replaceWith(element);
  }
  return element;
}