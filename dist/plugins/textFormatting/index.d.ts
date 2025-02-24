import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { VNode } from '../../core/virtualDom';
export declare class TextFormattingPlugin implements Plugin {
    protected commands: {
        [key: string]: () => void;
    };
    private editor;
    constructor(editor: HTMLElement);
    executeBold(): void;
    executeItalic(): void;
    executeUnderline(): void;
    init(editor: Editor): void;
    createToolbar(): VNode[];
    destroy(): void;
    private toggleFormat;
}
