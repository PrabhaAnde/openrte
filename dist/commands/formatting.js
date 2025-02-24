import { SelectionManager } from '../core/selection';
export class FormattingCommands {
    constructor(editor) {
        this.selectionManager = new SelectionManager(editor);
    }
    bold() {
        const range = this.selectionManager.getRange();
        if (!range)
            return;
        if (this.isFormatActive('strong')) {
            this.unwrapTag(range, 'strong');
        }
        else {
            this.wrapSelection(range, 'strong');
        }
    }
    isFormatActive(tagName) {
        const range = this.selectionManager.getRange();
        if (!range)
            return false;
        let node = range.commonAncestorContainer;
        while (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }
        return (node === null || node === void 0 ? void 0 : node.nodeName.toLowerCase()) === tagName;
    }
    wrapSelection(range, tagName) {
        const newNode = document.createElement(tagName);
        range.surroundContents(newNode);
    }
    unwrapTag(range, tagName) {
        var _a, _b;
        const parent = range.commonAncestorContainer.parentElement;
        if ((parent === null || parent === void 0 ? void 0 : parent.nodeName.toLowerCase()) === tagName) {
            while (parent.firstChild) {
                (_a = parent.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(parent.firstChild, parent);
            }
            (_b = parent.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(parent);
        }
    }
}
