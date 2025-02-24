import { VNode } from './virtualDom';
export declare class Toolbar {
    private container;
    private buttons;
    constructor(container: HTMLElement);
    addButton(button: VNode): void;
    render(): VNode;
    destroy(): void;
}
