import { h } from '../core/virtualDom';
export function createButton(label, onClick) {
    return h('button', { onclick: onClick }, [label]);
}
