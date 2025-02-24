import { h } from './virtualDom';
export class Toolbar {
    constructor(container) {
        this.container = container;
        this.buttons = [];
    }
    addButton(button) {
        this.buttons.push(button);
    }
    render() {
        return h('div', { class: 'openrte-toolbar' }, this.buttons);
    }
    destroy() {
        this.buttons = [];
        this.container.innerHTML = '';
    }
}
