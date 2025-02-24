export function h(type, props = {}, children = []) {
    return {
        type,
        props,
        children: Array.isArray(children) ? children : [children]
    };
}
export function patch(node, vnode) {
    console.log('Patching:', { node, vnode }); // Debug
    const element = document.createElement(vnode.type);
    // Apply properties
    Object.entries(vnode.props).forEach(([key, value]) => {
        if (key === 'contenteditable') {
            element.contentEditable = value;
        }
        else {
            element.setAttribute(key, value);
        }
    });
    // Append children
    vnode.children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        }
        else {
            element.appendChild(patch(element, child));
        }
    });
    if (node instanceof Element) {
        node.replaceWith(element);
    }
    return element;
}
