import { VNode, h } from './virtualDom';

export class Toolbar {
  private container: HTMLElement;
  private buttons: VNode[];

  constructor(container: HTMLElement) {
    this.container = container;
    this.buttons = [];
  }

  addButton(button: VNode): void {
    this.buttons.push(button);
  }

  render(): VNode {
    return h('div', { class: 'openrte-toolbar' }, this.buttons);
  }

  destroy(): void {
    this.buttons = [];
    this.container.innerHTML = '';
  }
}