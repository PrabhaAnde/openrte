import { h, VNode } from '../core/virtualDom';
import { createIcon } from './icon';

export function createHeadingSelector(onChange: (value: string) => void): VNode {
  // Available heading options
  const headings = [
    { value: 'p', label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'h5', label: 'Heading 5' },
    { value: 'h6', label: 'Heading 6' }
  ];

  // Map headings to options
  const options = headings.map(heading => {
    return h('option', { value: heading.value }, [heading.label]);
  });

  // Create heading icon
  const headingIcon = createIcon('heading', { 
    width: '16', 
    height: '16',
    className: 'openrte-icon-heading'
  });

  // Create wrapper for icon and select
  return h('div', { 
    class: 'openrte-toolbar-control openrte-heading-control',
    style: 'display: flex; align-items: center; margin: 2px;'
  }, [
    // Icon container
    h('div', { 
      class: 'openrte-toolbar-icon-container',
      style: 'margin-right: 4px; display: flex; align-items: center;'
    }, [headingIcon]),
    // Dropdown
    h('select', {
      'data-command': 'heading',
      style: 'padding: 4px; border: 1px solid #ccc; border-radius: 3px;',
      title: 'Paragraph Format',
      onchange: (e: Event) => {
        e.preventDefault();
        const select = e.target as HTMLSelectElement;
        onChange(select.value);
      }
    }, [
      h('option', { value: '', disabled: true, selected: true }, ['Format']),
      ...options
    ])
  ]);
}