// WebsiteContext — what every section of a rendered website can read.
//
//   manifest     template manifest (published snapshot or saved draft)
//   content      owner content: { site: {...}, pages: { PAGE: { SECTION: {...} } } }
//   data         PMS data supplied by the container (see WebsiteRenderer)
//   page         current page code
//   mode         'preview' (UN Admin — every action is inert) | 'live' (future)
//   compact      true when the website is narrower than COMPACT_BELOW
//   navigate     (pageCode, params?) => void — internal page navigation only

import { createContext, useContext } from 'react';

export const WebsiteContext = createContext(null);
export const useWebsite = () => useContext(WebsiteContext);

// Value of one owner-editable field.
export function useField(section, key, fallback = '') {
  const { content, page } = useWebsite();
  const v = content?.pages?.[page]?.[section]?.[key];
  return v === undefined || v === null || v === '' ? fallback : v;
}

// All owner-editable values of one section on the current page.
export function useSectionContent(section) {
  const { content, page } = useWebsite();
  return content?.pages?.[page]?.[section] || {};
}

export function useSite() {
  const { content } = useWebsite();
  return content?.site || {};
}

export function useCapability(code) {
  const { manifest } = useWebsite();
  return (manifest?.structure?.capabilities || []).includes(code);
}

// Enabled pages, in configured order.
export function enabledPages(manifest) {
  return (manifest?.structure?.pages || []).filter(p => p.enabled);
}

// Numbered items, e.g. items(c, 'pillar', ['title','text']) → [{title,text}, …]
// Stops at the first number with no values at all.
export function numberedItems(values, prefix, parts, max = 12) {
  const out = [];
  for (let n = 1; n <= max; n += 1) {
    const item = {};
    let any = false;
    parts.forEach(p => {
      const v = values[`${prefix}_${n}_${p}`];
      if (v) { item[p] = v; any = true; }
    });
    if (!any) break;
    out.push(item);
  }
  return out;
}
