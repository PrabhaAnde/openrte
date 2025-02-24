import { h, VNode } from '../core/virtualDom';

export function createButton(label: string, onClick: (e: MouseEvent) => void): VNode {
  // Create a unique function name for this handler for debugging
  const handlerName = `onClick_${label}_${Math.floor(Math.random() * 10000)}`;
  
  // Create the button with explicit event handler
  return h('button', { 
    type: 'button',
    class: `openrte-button openrte-button-${label.toLowerCase()}`,
    // We need to use the DOM event name format
    onclick: (e: MouseEvent) => {
      // Prevent default to avoid any form submissions
      e.preventDefault();
      console.log(`Button ${label} clicked`, e);
      // Call the actual handler
      onClick(e);
    },
    // Add some styling directly to ensure it's visible
    style: 'margin: 2px; padding: 4px 8px; border: 1px solid #ccc; background: #f8f8f8; cursor: pointer;'
  }, [label]);
}