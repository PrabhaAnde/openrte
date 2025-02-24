import { ContentModel, Node } from '../types/contentModel';

export function serializeToHtml(content: ContentModel): string {
  return content.children.map(node => serializeNode(node)).join('');
}

function serializeNode(node: Node): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${node.children.map(serializeNode).join('')}</p>`;
    case 'text':
      let text = (node as any).text;
      if ((node as any).bold) text = `<b>${text}</b>`;
      if ((node as any).italic) text = `<i>${text}</i>`;
      if ((node as any).underline) text = `<u>${text}</u>`;
      return text;
    default:
      return '';
  }
}