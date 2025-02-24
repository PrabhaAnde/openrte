import { ContentModel } from '../types/contentModel';
export declare class Editor {
    private container;
    private vdom;
    private content;
    private plugins;
    private selectionManager;
    private formattingPlugin;
    private eventListeners;
    constructor(element: HTMLElement);
    private initializeEventListeners;
    private addEventHandler;
    private createEditorDOM;
    private createToolbar;
    private createContentArea;
    private handleKeyDown;
    private handleInput;
    private render;
    setContent(content: ContentModel): void;
    getContent(): ContentModel;
    destroy(): void;
}
