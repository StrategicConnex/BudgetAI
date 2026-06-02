// S2: Input sanitization utilities for rendering user content safely.
// Used in HTML export and anywhere user input is rendered.

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape string for use in HTML attributes.
 */
export function escapeAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Strip potentially dangerous content from a string.
 * Removes script tags, event handlers, and javascript: URIs.
 */
export function stripDangerousContent(str: string): string {
  if (!str) return '';
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}
