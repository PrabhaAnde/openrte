export class SelectionManager {
    constructor(editor) {
        this.editor = editor;
    }
    getSelection() {
        const selection = window.getSelection();
        if (!selection)
            return null;
        // Verify selection is within editor
        let node = selection.anchorNode;
        while (node && node !== this.editor) {
            node = node.parentNode;
        }
        return node ? selection : null;
    }
    getRange() {
        const selection = this.getSelection();
        return (selection === null || selection === void 0 ? void 0 : selection.rangeCount) ? selection.getRangeAt(0) : null;
    }
    saveSelection() {
        const range = this.getRange();
        return range ? range.cloneRange() : null;
    }
    restoreSelection(range) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}
