/**
 * Shared HTML sanitizer - strips dangerous elements and attributes.
 * Used to prevent XSS when rendering user/database-sourced HTML.
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // Remove dangerous elements
  const dangerous = doc.querySelectorAll('script, iframe, object, embed, form, base, meta, link[rel="import"]');
  dangerous.forEach(el => el.remove());
  // Remove event handlers and javascript: protocols
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}
