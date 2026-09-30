export interface SelectedElementInfo {
  tagName: string;
  textSnippet: string;
  className: string;
  id: string;
  outerHtmlSnippet: string;
  styles?: {
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    margin?: string;
    padding?: string;
    width?: string;
    height?: string;
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
    textAlign?: string;
    position?: string;
    display?: string;
  };
}

/**
 * Script injected into preview iframe when Visual Inspector Mode is enabled.
 */
export const INSPECTOR_IFRAME_SCRIPT = `
<script>
  (function () {
    var activeOutlineEl = null;

    function removeHighlight() {
      if (activeOutlineEl) {
        activeOutlineEl.style.outline = '';
        activeOutlineEl.style.outlineOffset = '';
        activeOutlineEl = null;
      }
    }

    document.addEventListener('mouseover', function (e) {
      if (e.target === document.body || e.target === document.documentElement) return;
      removeHighlight();
      activeOutlineEl = e.target;
      activeOutlineEl.style.outline = '2px dashed #3b82f6';
      activeOutlineEl.style.outlineOffset = '2px';
    }, true);

    document.addEventListener('mouseout', function (e) {
      removeHighlight();
    }, true);

    document.addEventListener('click', function (e) {
      if (e.target === document.body || e.target === document.documentElement) return;
      e.preventDefault();
      e.stopPropagation();

      var target = e.target;
      target.style.outline = '3px solid #2563eb';
      target.style.outlineOffset = '2px';

      var comp = window.getComputedStyle(target);
      var info = {
        tagName: target.tagName.toLowerCase(),
        textSnippet: (target.textContent || '').trim().substring(0, 100),
        className: target.className || '',
        id: target.id || '',
        outerHtmlSnippet: target.outerHTML.substring(0, 200),
        styles: {
          fontSize: comp.fontSize || '',
          fontWeight: comp.fontWeight || '',
          fontFamily: comp.fontFamily || '',
          color: comp.color || '',
          backgroundColor: comp.backgroundColor || '',
          margin: comp.margin || '',
          padding: comp.padding || '',
          width: comp.width || '',
          height: comp.height || '',
          borderRadius: comp.borderRadius || '',
          border: comp.border || '',
          boxShadow: comp.boxShadow || '',
          textAlign: comp.textAlign || '',
          position: comp.position || '',
          display: comp.display || ''
        }
      };

      console.log('[Visual Inspector] Selected element:', info);

      try {
        window.parent.postMessage({ type: 'ELEMENT_SELECTED', element: info }, '*');
      } catch (err) {
        console.error('[Visual Inspector] Message error:', err);
      }
    }, true);
  })();
</script>`;
