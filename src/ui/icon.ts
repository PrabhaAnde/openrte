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
    bold: '<path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/>',
    italic: '<path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/>',
    underline: '<path d="M200-120v-80h560v80H200Zm280-160q-101 0-157-63t-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63Z"/>',
    alignLeft: '<path fill="none" stroke="currentColor" stroke-width="2" d="M4 5h16 M4 9h10 M4 13h14 M4 17h8" />',
    alignCenter: '<path fill="none" stroke="currentColor" stroke-width="2" d="M4 5h16 M7 9h10 M5 13h14 M8 17h8" />',
    alignRight: '<path fill="none" stroke="currentColor" stroke-width="2" d="M4 5h16 M10 9h10 M6 13h14 M12 17h8" />',
    listOrdered: '<path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h160v90l-40 30 40 30v90H120Zm0-280v-150h100v-30H120v-60h160v150H180v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"/>',
    listUnordered: '<path fill="none" stroke="currentColor" stroke-width="2" d="M3 4A1 1 0 1 0 5 4A1 1 0 1 0 3 4 M8 4H20 M3 12A1 1 0 1 0 5 12A1 1 0 1 0 3 12 M8 12H20 M3 20A1 1 0 1 0 5 20A1 1 0 1 0 3 20 M8 20H20" />',
    heading: '<path d="M6 12h12"></path><path d="M6 4v16"></path><path d="M18 4v16"></path>',
    blockquote: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M9 9h1l3 -3v7h-4v-4z"></path><path d="M14 9h1l3 -3v7h-4v-4z"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
    fontSize: '<path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
    code: '<path d="M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z"/>',
    table: '<path d="M120-120v-720h720v720H120Zm320-240H200v160h240v-160Zm80 0v160h240v-160H520Zm-80-80v-160H200v160h240Zm80 0h240v-160H520v160ZM200-680h560v-80H200v80Z"/>',
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