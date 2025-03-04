/**
 * Array utilities for OpenRTE
 */

/**
 * Compare two arrays for equality
 * 
 * @param a First array
 * @param b Second array
 * @returns True if arrays are equal
 */
export function compareArrays<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Compare two paths to determine their relationship
 * 
 * @param path1 First path
 * @param path2 Second path
 * @returns -1 if path1 < path2, 0 if equal, 1 if path1 > path2
 */
export function comparePaths(path1: number[], path2: number[]): number {
  const minLength = Math.min(path1.length, path2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (path1[i] < path2[i]) return -1;
    if (path1[i] > path2[i]) return 1;
  }
  
  // If we get here, all compared elements are equal
  if (path1.length < path2.length) return -1;
  if (path1.length > path2.length) return 1;
  
  return 0; // Paths are equal
}

/**
 * Check if path1 is an ancestor of path2
 * 
 * @param path1 Potential ancestor path
 * @param path2 Potential descendant path
 * @returns True if path1 is an ancestor of path2
 */
export function isAncestor(path1: number[], path2: number[]): boolean {
  if (path1.length >= path2.length) return false;
  
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) return false;
  }
  
  return true;
}

/**
 * Get the common ancestor path of two paths
 * 
 * @param path1 First path
 * @param path2 Second path
 * @returns Common ancestor path
 */
export function getCommonAncestor(path1: number[], path2: number[]): number[] {
  const minLength = Math.min(path1.length, path2.length);
  const commonPath: number[] = [];
  
  for (let i = 0; i < minLength; i++) {
    if (path1[i] === path2[i]) {
      commonPath.push(path1[i]);
    } else {
      break;
    }
  }
  
  return commonPath;
}