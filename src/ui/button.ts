import { h, VNode } from '../core/virtualDom';

export function createButton(label: string, onClick: (e: MouseEvent) => void, title?: string): VNode {
  // Create a unique identifier for this button
  const buttonId = `btn_${label}_${Math.floor(Math.random() * 10000)}`;
  
  // Determine command name from label (lowercase)
  const command = typeof label === 'string' ? label.toLowerCase() : '';
  
  // Create the button with explicit event handler
  return h('button', { 
    type: 'button',
    class: `openrte-button openrte-button-${command}`,
    title: title || label, // Add tooltip
    'data-command': command, // Add data attribute for command identification
    id: buttonId, // Add unique ID for debugging
    // We need to use the DOM event name format
    onclick: (e: MouseEvent) => {
      // Prevent default to avoid any form submissions
      e.preventDefault();
      console.log(`Button ${label} clicked`, e);
      // Call the actual handler
      onClick(e);
    },
    // Add some styling directly to ensure it's visible
    style: `
      margin: 2px; 
      padding: 4px 8px; 
      border: 1px solid #ccc; 
      background: #fff; 
      color: #333;
      cursor: pointer;
      border-radius: 3px;
      font-weight: bold;
      min-width: 30px;
    `
  }, [label]);
}