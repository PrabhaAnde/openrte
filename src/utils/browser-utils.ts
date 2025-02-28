/**
 * Browser Utilities for OpenRTE
 * 
 * This module provides utilities for browser detection and
 * handling browser-specific quirks and behaviors.
 */

/**
 * Interface for normalized key event information
 */
export interface NormalizedKeyEvent {
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    isComposing: boolean;
  }
  
  /**
   * Interface for standardized clipboard data
   */
  export interface ClipboardData {
    text: string;
    html: string;
    files: File[];
    hasFiles: boolean;
  }
  
  /**
   * Checks if the browser is Firefox
   * 
   * @returns True if the browser is Firefox
   */
  export function isFirefox(): boolean {
    return navigator.userAgent.indexOf('Firefox') !== -1;
  }
  
  /**
   * Checks if the browser is Chrome
   * 
   * @returns True if the browser is Chrome
   */
  export function isChrome(): boolean {
    return navigator.userAgent.indexOf('Chrome') !== -1 && 
           navigator.userAgent.indexOf('Edge') === -1 &&
           navigator.userAgent.indexOf('Edg') === -1;
  }
  
  /**
   * Checks if the browser is Safari
   * 
   * @returns True if the browser is Safari
   */
  export function isSafari(): boolean {
    return navigator.userAgent.indexOf('Safari') !== -1 && 
           navigator.userAgent.indexOf('Chrome') === -1;
  }
  
  /**
   * Checks if the browser is Edge
   * 
   * @returns True if the browser is Edge
   */
  export function isEdge(): boolean {
    return navigator.userAgent.indexOf('Edge') !== -1 || 
           navigator.userAgent.indexOf('Edg') !== -1;
  }
  
  /**
   * Checks if the platform is iOS
   * 
   * @returns True if the platform is iOS
   */
  export function isiOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
           !(window as any).MSStream;
  }
  
  /**
   * Checks if the platform is Android
   * 
   * @returns True if the platform is Android
   */
  export function isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }
  
  /**
   * Checks if the device is a mobile device
   * 
   * @returns True if the device is mobile
   */
  export function isMobile(): boolean {
    return isiOS() || isAndroid();
  }
  
  /**
   * Adjusts a range for browser-specific quirks
   * 
   * @param range The range to adjust
   * @returns The adjusted range
   */
  export function adjustRangeForBrowser(range: Range): Range {
    if (!range) return range;
    
    if (isFirefox()) {
      // Firefox-specific range adjustments
      // (add specific fixes as needed)
    } else if (isSafari()) {
      // Safari-specific range adjustments
      // (add specific fixes as needed)
    }
    
    return range;
  }
  
  /**
   * Normalizes a key event to ensure consistent behavior
   * 
   * @param event The original keyboard event
   * @returns Normalized key event information
   */
  export function normalizeKeyEvent(event: KeyboardEvent): NormalizedKeyEvent {
    return {
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing
    };
  }
  
  /**
   * Normalizes clipboard data from a clipboard event
   * 
   * @param event The clipboard event
   * @returns Normalized clipboard data
   */
  export function normalizeClipboardData(event: ClipboardEvent): ClipboardData {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    
    const result: ClipboardData = {
      text: '',
      html: '',
      files: [],
      hasFiles: false
    };
    
    if (!clipboardData) return result;
    
    // Get text and HTML content
    result.text = clipboardData.getData('text/plain') || '';
    result.html = clipboardData.getData('text/html') || '';
    
    // Handle files
    if (clipboardData.items) {
      result.files = Array.from(clipboardData.items)
        .filter((item): item is DataTransferItem => item instanceof DataTransferItem && item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean) as File[];
      
      result.hasFiles = result.files.length > 0;
    } else if (clipboardData.files && clipboardData.files.length > 0) {
      result.files = Array.from(clipboardData.files);
      result.hasFiles = true;
    }
    
    return result;
  }
  
  /**
   * Sets up contentEditable element with browser-specific adjustments
   * 
   * @param element The element to set up
   */
  export function setupContentEditable(element: HTMLElement): void {
    if (!element) return;
    
    // Set basic contentEditable property
    element.contentEditable = 'true';
    
    // Add browser-specific attributes and workarounds
    if (isFirefox()) {
      // Firefox-specific adjustments
      element.setAttribute('data-openrte-firefox', 'true');
    } else if (isSafari()) {
      // Safari-specific adjustments
      element.setAttribute('data-openrte-safari', 'true');
    } else if (isiOS()) {
      // iOS-specific adjustments
      element.setAttribute('data-openrte-ios', 'true');
    }
    
    // General mobile adjustments
    if (isMobile()) {
      element.setAttribute('data-openrte-mobile', 'true');
    }
  }
  
  /**
   * Gets the native selection range with browser adjustments
   * 
   * @returns The current selection range or null
   */
  export function getNativeSelectionRange(): Range | null {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    
    const range = selection.getRangeAt(0).cloneRange();
    return adjustRangeForBrowser(range);
  }
  
  /**
   * Sets the native selection range with browser adjustments
   * 
   * @param range The range to set
   * @returns True if successful
   */
  export function setNativeSelectionRange(range: Range): boolean {
    if (!range) return false;
    
    try {
      const selection = window.getSelection();
      if (!selection) return false;
      
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch (e) {
      console.error('Error setting selection range:', e);
      return false;
    }
  }
  
  /**
   * Prevents default browser behavior for an event
   * 
   * @param event The event to prevent default for
   */
  export function preventDefaultBehavior(event: Event): void {
    if (!event) return;
    
    try {
      event.preventDefault();
    } catch (e) {
      console.error('Error preventing default behavior:', e);
    }
  }
  
  /**
   * Focus an element with browser-specific adjustments
   * 
   * @param element The element to focus
   */
  export function focusElement(element: HTMLElement): void {
    if (!element) return;
    
    // Try standard focus
    try {
      element.focus();
    } catch (e) {
      console.error('Error focusing element:', e);
    }
    
    // For iOS, we might need additional workarounds
    if (isiOS()) {
      // iOS-specific focus workarounds
      // (add specific fixes as needed)
    }
  }