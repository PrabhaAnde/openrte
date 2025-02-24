import { h, VNode } from '../core/virtualDom';

export function createButton(label: string, onClick: (e: MouseEvent) => void): VNode {
  return h('button', { 
    type: 'button',  // Explicitly set type to prevent form submission
    onclick: onClick,
    class: `openrte-button openrte-button-${label.toLowerCase()}` 
  }, [label]);
}