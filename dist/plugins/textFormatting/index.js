import { createButton } from '../../ui/button';
export class TextFormattingPlugin {
    constructor(editor) {
        this.editor = editor;
        this.commands = {
            bold: () => this.toggleFormat('strong'),
            italic: () => this.toggleFormat('em'),
            underline: () => this.toggleFormat('u')
        };
    }
    // Add public methods to access protected commands
    executeBold() {
        this.commands.bold();
    }
    executeItalic() {
        this.commands.italic();
    }
    executeUnderline() {
        this.commands.underline();
    }
    init(editor) {
        // Initialize plugin
    }
    createToolbar() {
        return [
            createButton('B', () => this.commands.bold()),
            createButton('I', () => this.commands.italic()),
            createButton('U', () => this.commands.underline())
        ];
    }
    destroy() {
        this.commands = {};
    }
    toggleFormat(tag) {
        const selection = window.getSelection();
        if (!(selection === null || selection === void 0 ? void 0 : selection.rangeCount))
            return;
        const range = selection.getRangeAt(0);
        const element = document.createElement(tag);
        range.surroundContents(element);
    }
}
