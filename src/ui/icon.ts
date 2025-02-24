import { h, VNode } from '../core/virtualDom';

// Simple SVG icon system for the editor
export interface IconOptions {
  width?: string;
  height?: string;
  fill?: string;
  className?: string;
}

export function createIcon(
  name: string, 
  options: IconOptions = {}
): VNode {
  const width = options.width || '16';
  const height = options.height || '16';
  const fill = options.fill || 'currentColor';
  const className = options.className || '';
  
  // Create SVG element
  const svgAttrs = {
    xmlns: 'http://www.w3.org/2000/svg',
    width,
    height,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: fill,
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: `openrte-icon ${className}`,
    style: 'display: inline-block; vertical-align: middle;'
  };
  
  // Define path data for each icon
  const icons: { [key: string]: string } = {
    bold: '<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>',
    italic: '<line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line>',
    underline: '<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line>',
    alignLeft: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line>',
    alignCenter: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="18" y1="12" x2="6" y2="12"></line><line x1="19" y1="18" x2="5" y2="18"></line>',
    alignRight: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line>',
    listOrdered: '<line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>',
    listUnordered: '<line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><circle cx="4" cy="6" r="2"></circle><circle cx="4" cy="12" r="2"></circle><circle cx="4" cy="18" r="2"></circle>',
    heading: '<path d="M6 12h12"></path><path d="M6 4v16"></path><path d="M18 4v16"></path>',
    blockquote: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M9 9h1l3 -3v7h-4v-4z"></path><path d="M14 9h1l3 -3v7h-4v-4z"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
    fontSize: '<path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
    code: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line>',
    // Add more icons as needed
  };
  
  // Create the SVG with the icon path
  return h('svg', svgAttrs, [
    h('g', {}, [
      // Insert the SVG path as HTML
      { type: '__html', props: {}, children: [], __html: icons[name] || '' }
    ])
  ]);
}