export function serializeToHtml(content) {
    return content.children.map(node => serializeNode(node)).join('');
}
function serializeNode(node) {
    switch (node.type) {
        case 'paragraph':
            return `<p>${node.children.map(serializeNode).join('')}</p>`;
        case 'text':
            let text = node.text;
            if (node.bold)
                text = `<b>${text}</b>`;
            if (node.italic)
                text = `<i>${text}</i>`;
            if (node.underline)
                text = `<u>${text}</u>`;
            return text;
        default:
            return '';
    }
}
