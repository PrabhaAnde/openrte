// src/ui/button.ts
export function createButton(
  label: string, 
  onClick: (e: MouseEvent) => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `openrte-button openrte-button-${label.toLowerCase()}`;
  button.textContent = label;
  
  // Add event listener directly to the button
  button.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    console.log(`Button ${label} clicked`);
    onClick(e);
  });
  
  return button;
}