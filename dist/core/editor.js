import { h, patch } from './virtualDom';
import { TextFormattingPlugin } from '../plugins/textFormatting';
import { SelectionManager } from './selection';
export class Editor {
    constructor(element) {
        this.content = { type: 'document', parent: null, children: [] }; // Initialize with default value
        this.eventListeners = [];
        this.handleKeyDown = (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'b':
                        event.preventDefault();
                        this.formattingPlugin.executeBold();
                        break;
                }
            }
        };
        this.handleInput = () => {
            this.render();
        };
        this.container = element;
        this.selectionManager = new SelectionManager(element);
        // Initialize plugins
        this.formattingPlugin = new TextFormattingPlugin(element);
        this.plugins = [this.formattingPlugin];
        // Create and patch initial DOM
        this.vdom = this.createEditorDOM();
        patch(element, this.vdom);
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        this.addEventHandler(this.container, 'keydown', this.handleKeyDown);
        this.addEventHandler(this.container, 'input', this.handleInput);
    }
    addEventHandler(element, type, handler) {
        const listener = handler.bind(this);
        element.addEventListener(type, listener);
        this.eventListeners.push({ element, type, listener });
    }
    createEditorDOM() {
        return h('div', { class: 'openrte-editor' }, [
            this.createToolbar(),
            this.createContentArea()
        ]);
    }
    createToolbar() {
        return h('div', { class: 'openrte-toolbar' }, this.formattingPlugin.createToolbar());
    }
    createContentArea() {
        return h('div', {
            class: 'openrte-content',
            contenteditable: 'true'
        });
    }
    render() {
        const newVdom = this.createEditorDOM();
        patch(this.container, newVdom);
        this.vdom = newVdom;
    }
    setContent(content) {
        this.content = content;
        this.render();
    }
    getContent() {
        return this.content;
    }
    destroy() {
        // Clean up plugins
        this.plugins.forEach(plugin => plugin.destroy());
        // Remove all event listeners
        this.eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
        this.eventListeners = [];
        // Reset container
        this.container.contentEditable = 'false';
    }
}
