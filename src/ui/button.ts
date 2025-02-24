import { h, VNode } from '../core/virtualDom';

export function createButton(label: string, onClick: () => void): VNode {
  return h('button', { onclick: onClick }, [label]);
}