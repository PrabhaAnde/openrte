import { h, VNode } from '../core/virtualDom';

// Stored event handlers to prevent garbage collection
const buttonHandlers: {[key: string]: (e: MouseEvent) => void} = {};

export function createButton(label: string, onClick: (e: MouseEvent) => void): VNode {
  // Create a unique key for this handler
  const handlerId = `btn_${label}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  // Store the handler in our global object to prevent garbage collection
  buttonHandlers[handlerId] = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Button ${label} clicked`, e);
    onClick(e);
  };
  
  // Add an attribute to help with debugging
  return h('button', { 
    type: 'button',
    class: `openrte-button openrte-button-${label.toLowerCase()}`,
    'data-handler-id': handlerId,
    // Set up the click handler
    onclick: buttonHandlers[handlerId],
    // Add inline styles to ensure button is visible
    style: `
      margin: 4px;
      padding: 6px 10px;
      border: 1px solid #ccc;
      background-color: #f0f0f0;
      cursor: pointer;
      border-radius: 3px;
      font-weight: bold;
      min-width: 30px;
      color: #333;
      font-size: 14px;
    `
  }, [label]);
}