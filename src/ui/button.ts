import { h, VNode } from '../core/virtualDom';
import { createIcon } from './icon';

export interface ButtonOptions {
  icon?: string;
  title?: string;
  className?: string;
  active?: boolean;
}

export function createButton(
  label: string, 
  onClick: (e: MouseEvent) => void,
  options: ButtonOptions = {}
): VNode {
  // Create button attributes
  const buttonAttrs = {
    type: 'button',
    class: `openrte-button ${options.className || ''} ${options.active ? 'active' : ''}`,
    title: options.title || label,
    // We need to use the DOM event name format
    onclick: (e: MouseEvent) => {
      // Prevent default to avoid any form submissions
      e.preventDefault();
      console.log(`Button ${label} clicked`, e);
      // Call the actual handler
      onClick(e);
    },
    // Add some styling to ensure it's visible
    style: 'margin: 2px; padding: 4px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer;'
  };
  
  // Button content: icon + label or just one of them
  const buttonContent: VNode[] = [];
  
  // Add icon if specified
  if (options.icon) {
    buttonContent.push(createIcon(options.icon));
  }
  
  // Add label if it should be visible (not just an icon button)
  if (!options.icon || label !== options.icon) {
    // If we have both icon and text, add a small space between them
    if (options.icon) {
      buttonContent.push(h('span', { style: 'margin-left: 4px;' }, [label]));
    } else {
      buttonContent.push(h('span', {}, [label]));
    }
  }
  
  // Create the button with its content
  return h('button', buttonAttrs, buttonContent);
}