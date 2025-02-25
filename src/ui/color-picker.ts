export interface ColorOption {
    color: string;
    label?: string;
  }
  
  export function createColorPicker(
    colors: ColorOption[],
    onSelect: (color: string) => void
  ): HTMLElement {
    // Create main container
    const container = document.createElement('div');
    container.className = 'openrte-color-picker';
    
    // Create color grid
    const grid = document.createElement('div');
    grid.className = 'openrte-color-grid';
    
    // Add color cells
    colors.forEach(option => {
      const cell = document.createElement('div');
      cell.className = 'openrte-color-cell';
      cell.title = option.label || option.color;
      cell.style.backgroundColor = option.color;
      cell.style.width = '20px';
      cell.style.height = '20px';
      cell.style.margin = '2px';
      cell.style.cursor = 'pointer';
      cell.style.border = '1px solid #ccc';
      cell.style.borderRadius = '2px';
      
      // Add click handler
      cell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(option.color);
        
        // Hide the picker
        container.style.display = 'none';
      });
      
      grid.appendChild(cell);
    });
    
    container.appendChild(grid);
    
    // Set initial display to none
    container.style.display = 'none';
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'white';
    container.style.padding = '5px';
    container.style.border = '1px solid #ccc';
    container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    container.style.borderRadius = '3px';
    
    // Make the grid a flex container
    grid.style.display = 'flex';
    grid.style.flexWrap = 'wrap';
    grid.style.width = '120px';
    
    return container;
  }