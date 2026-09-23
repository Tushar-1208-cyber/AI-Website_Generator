export interface SelectedElementInfo {
  tagName: string;
  textSnippet: string;
  className: string;
  id: string;
  outerHtmlSnippet: string;
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

      var info = {
        tagName: target.tagName.toLowerCase(),
        textSnippet: (target.textContent || '').trim().substring(0, 60),
        className: target.className || '',
        id: target.id || '',
        outerHtmlSnippet: target.outerHTML.substring(0, 150)
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
