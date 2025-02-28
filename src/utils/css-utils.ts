/**
 * CSS Utilities for OpenRTE
 * 
 * This module provides utilities for CSS operations and styling normalization
 * to ensure consistent behavior across browsers.
 */

/**
 * Gets computed style with browser normalization
 * 
 * @param element The element to get the style for
 * @param property The CSS property name
 * @returns The computed style value
 */
export function getComputedStyle(element: HTMLElement, property: string): string {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle[property as any] || '';
  }
  
  /**
   * Normalizes color value across browsers
   * 
   * @param color The color value to normalize
   * @returns Normalized color value in rgba format
   */
  export function normalizeColorValue(color: string): string {
    if (!color) return '';
    
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    
    return computedColor;
  }
  
  /**
   * Converts RGB color to hex
   * 
   * @param rgb RGB color string (e.g., "rgb(255, 255, 255)")
   * @returns Hex color string (e.g., "#FFFFFF")
   */
  export function rgbToHex(rgb: string): string {
    // Check if already hex
    if (rgb.startsWith('#')) return rgb;
    
    // Extract RGB values
    const rgbMatch = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!rgbMatch) return rgb;
    
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }
  
  /**
   * Converts Hex color to RGB
   * 
   * @param hex Hex color string (e.g., "#FFFFFF")
   * @returns RGB color string (e.g., "rgb(255, 255, 255)")
   */
  export function hexToRgb(hex: string): string {
    // Check if already rgb
    if (hex.startsWith('rgb')) return hex;
    
    // Convert from short hex (#FFF) to full hex (#FFFFFF) if needed
    let fullHex = hex;
    if (hex.length === 4) {
      fullHex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    
    const r = parseInt(fullHex.substring(1, 3), 16);
    const g = parseInt(fullHex.substring(3, 5), 16);
    const b = parseInt(fullHex.substring(5, 7), 16);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Normalizes font size to a standard format
   * 
   * @param fontSize Font size value (e.g., "16px", "1.2em", "12pt")
   * @returns Normalized font size in pixels
   */
  export function normalizeFontSize(fontSize: string): string {
    if (!fontSize) return '';
    
    // If already in px, just return
    if (fontSize.endsWith('px')) return fontSize;
    
    const tempElement = document.createElement('div');
    tempElement.style.fontSize = fontSize;
    document.body.appendChild(tempElement);
    
    const computedSize = window.getComputedStyle(tempElement).fontSize;
    document.body.removeChild(tempElement);
    
    return computedSize;
  }
  
  /**
   * Converts pixels to points (approximate)
   * 
   * @param px Pixel value (e.g., "16px" or 16)
   * @returns Point value (e.g., "12pt")
   */
  export function pxToPoints(px: string | number): string {
    // 1pt ≈ 1.33px
    const conversionFactor = 0.75; // 1/1.33
    
    let pixelValue: number;
    if (typeof px === 'string') {
      pixelValue = parseInt(px, 10);
    } else {
      pixelValue = px;
    }
    
    return `${Math.round(pixelValue * conversionFactor)}pt`;
  }
  
  /**
   * Converts points to pixels (approximate)
   * 
   * @param pt Point value (e.g., "12pt" or 12)
   * @returns Pixel value (e.g., "16px")
   */
  export function pointsToPx(pt: string | number): string {
    // 1pt ≈ 1.33px
    const conversionFactor = 1.33;
    
    let pointValue: number;
    if (typeof pt === 'string') {
      pointValue = parseInt(pt, 10);
    } else {
      pointValue = pt;
    }
    
    return `${Math.round(pointValue * conversionFactor)}px`;
  }
  
  /**
   * Checks if two font size values are approximately equivalent
   * 
   * @param size1 First font size value
   * @param size2 Second font size value
   * @returns True if sizes are approximately equivalent
   */
  export function areFontSizesEquivalent(size1: string, size2: string): boolean {
    const normalizedSize1 = normalizeFontSize(size1);
    const normalizedSize2 = normalizeFontSize(size2);
    
    // Extract numeric values
    const size1Value = parseInt(normalizedSize1, 10);
    const size2Value = parseInt(normalizedSize2, 10);
    
    // Consider sizes equivalent if they're within 1px of each other
    return Math.abs(size1Value - size2Value) <= 1;
  }
  
  /**
   * Gets CSS className based on alignment
   * 
   * @param alignment Text alignment value ('left', 'center', 'right', 'justify')
   * @returns The corresponding CSS class name
   */
  export function getAlignmentClass(alignment: string): string {
    switch (alignment.toLowerCase()) {
      case 'left':
        return 'openrte-align-left';
      case 'center':
        return 'openrte-align-center';
      case 'right':
        return 'openrte-align-right';
      case 'justify':
        return 'openrte-align-justify';
      default:
        return '';
    }
  }
  
  /**
   * Adds a CSS class to an element
   * 
   * @param element The element to add the class to
   * @param className The class name to add
   */
  export function addClass(element: HTMLElement, className: string): void {
    if (!element) return;
    
    // Use classList if available
    if (element.classList) {
      const classNames = className.split(' ');
      classNames.forEach(name => {
        if (name) element.classList.add(name);
      });
    } else {
      // Fallback for older browsers
      const currentClasses = element.className.split(' ');
      const newClasses = className.split(' ');
      
      newClasses.forEach(newClass => {
        if (newClass && currentClasses.indexOf(newClass) === -1) {
          currentClasses.push(newClass);
        }
      });
      
      element.className = currentClasses.join(' ');
    }
  }
  
  /**
   * Removes a CSS class from an element
   * 
   * @param element The element to remove the class from
   * @param className The class name to remove
   */
  export function removeClass(element: HTMLElement, className: string): void {
    if (!element) return;
    
    // Use classList if available
    if (element.classList) {
      const classNames = className.split(' ');
      classNames.forEach(name => {
        if (name) element.classList.remove(name);
      });
    } else {
      // Fallback for older browsers
      const currentClasses = element.className.split(' ');
      const removeClasses = className.split(' ');
      
      element.className = currentClasses.filter(
        currentClass => !removeClasses.includes(currentClass)
      ).join(' ');
    }
  }
  
  /**
   * Toggles a CSS class on an element
   * 
   * @param element The element to toggle the class on
   * @param className The class name to toggle
   * @param force Optional boolean to force add or remove
   */
  export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    if (!element) return;
    
    // Use classList if available
    if (element.classList) {
      if (force !== undefined) {
        element.classList.toggle(className, force);
      } else {
        element.classList.toggle(className);
      }
    } else {
      // Fallback for older browsers
      const hasClass = element.className.split(' ').includes(className);
      
      if (force === undefined) {
        force = !hasClass;
      }
      
      if (force && !hasClass) {
        addClass(element, className);
      } else if (!force && hasClass) {
        removeClass(element, className);
      }
    }
  }