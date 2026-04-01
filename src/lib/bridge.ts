// Editor bridge script — injected into slide iframes
// Handles hover highlights, click-to-select, click-again-to-edit, and commands from parent

export const EDITOR_BRIDGE_SCRIPT = `
<script>
(function() {
  var selectedEl = null;
  var isEditing = false;
  var selectedAt = 0; // timestamp of when element was selected
  var EDIT_DELAY = 400; // ms to wait after selecting before allowing edit mode
  var TEXT_SELECTOR = 'h1,h2,h3,h4,p,li,span,blockquote,cite,td,th,div.turtle-card__desc,div.turtle-card__name,div.slide__kpi-val,div.slide__kpi-label';

  function cssPath(el) {
    var path = [];
    while (el && el.nodeType === 1) {
      var selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      }
      var sib = el, nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.tagName === el.tagName) nth++;
      }
      if (nth > 1) selector += ':nth-of-type(' + nth + ')';
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function notifyDomChange() {
    var section = document.querySelector('.slide');
    if (section) {
      parent.postMessage({
        type: 'dom-updated',
        outerHtml: section.outerHTML
      }, '*');
    }
  }

  function clearSelection() {
    document.querySelectorAll('[data-se-selected]').forEach(function(el) {
      el.removeAttribute('data-se-selected');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }

  function selectElement(el) {
    clearSelection();
    selectedEl = el;
    selectedAt = Date.now();
    el.setAttribute('data-se-selected', 'true');
    el.style.outline = '2px solid #3b82f6';
    el.style.outlineOffset = '2px';
    var rect = el.getBoundingClientRect();
    parent.postMessage({
      type: 'element-clicked',
      selector: cssPath(el),
      tagName: el.tagName,
      className: el.className,
      text: el.textContent ? el.textContent.slice(0, 100) : '',
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }, '*');
  }

  function exitEditMode() {
    if (!isEditing || !selectedEl) return;
    selectedEl.contentEditable = 'false';
    isEditing = false;
    selectedEl.style.outline = '2px solid #3b82f6';
    selectedEl.style.outlineOffset = '2px';
    notifyDomChange();
    parent.postMessage({ type: 'editing-finished' }, '*');
  }

  function enterEditMode(el, clickEvent) {
    isEditing = true;
    el.contentEditable = 'true';
    el.style.outline = '2px solid #22c55e';
    el.style.outlineOffset = '2px';
    el.focus();
    // Place cursor at the position nearest to where the user clicked
    if (clickEvent && document.caretRangeFromPoint) {
      var range = document.caretRangeFromPoint(clickEvent.clientX, clickEvent.clientY);
      if (range) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if (clickEvent && document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(clickEvent.clientX, clickEvent.clientY);
      if (pos) {
        var range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    parent.postMessage({ type: 'editing-started' }, '*');
  }

  function isTextElement(el) {
    if (!el || el.closest('svg') || el.closest('script')) return false;
    return el.closest(TEXT_SELECTOR) !== null;
  }

  // Click handler — the core interaction model
  document.addEventListener('click', function(e) {
    var clickedEl = e.target;

    // Walk up past body/html/deck
    while (clickedEl && (clickedEl.tagName === 'HTML' || clickedEl.tagName === 'BODY' || clickedEl.classList.contains('deck'))) {
      clickedEl = null;
      break;
    }
    if (!clickedEl) return;

    // Find the nearest text-editable element
    var textEl = clickedEl.closest(TEXT_SELECTOR);

    // Case 1: Currently editing
    if (isEditing && selectedEl) {
      // Clicking inside the same editing element — let the browser handle cursor
      if (selectedEl.contains(clickedEl)) {
        return; // Don't preventDefault, don't change selection
      }
      // Clicking outside the editing element — exit edit mode, then select new element
      exitEditMode();
      e.preventDefault();
      selectElement(clickedEl);
      return;
    }

    // Case 2: Clicking on the already-selected element (or a child of it)
    if (selectedEl && (selectedEl === clickedEl || selectedEl.contains(clickedEl) || clickedEl.contains(selectedEl))) {
      var editTarget = textEl || (isTextElement(selectedEl) ? selectedEl : null);
      var timeSinceSelect = Date.now() - selectedAt;
      if (editTarget && timeSinceSelect > EDIT_DELAY) {
        // Enter edit mode — place cursor at click position
        e.preventDefault();
        if (selectedEl !== editTarget) {
          selectElement(editTarget);
        }
        enterEditMode(editTarget, e);
        return;
      }
      // Too soon after selection or not a text element — just absorb the click
      e.preventDefault();
      return;
    }

    // Case 3: Clicking on a new/unselected element
    e.preventDefault();
    selectElement(clickedEl);
  }, true);

  // Prevent double-click word selection — we only want single cursor placement
  document.addEventListener('dblclick', function(e) {
    e.preventDefault();
    // If not in edit mode, don't do anything special
    // If in edit mode, the preventDefault stops the browser from selecting a word
  }, true);

  // Handle blur to exit edit mode when clicking outside the iframe
  document.addEventListener('focusout', function(e) {
    if (isEditing && selectedEl) {
      // Small delay to allow click handler to process first
      setTimeout(function() {
        if (isEditing) exitEditMode();
      }, 100);
    }
  });

  // Listen for commands from parent
  window.addEventListener('message', function(e) {
    if (e.data.type === 'delete-selected' && selectedEl) {
      if (isEditing) exitEditMode();
      selectedEl.remove();
      selectedEl = null;
      notifyDomChange();
      parent.postMessage({ type: 'element-deselected' }, '*');
    }
    if (e.data.type === 'move-element' && selectedEl) {
      if (isEditing) exitEditMode();
      var dir = e.data.direction;
      var parent_el = selectedEl.parentElement;
      if (!parent_el) return;
      if (dir === 'up' && selectedEl.previousElementSibling) {
        parent_el.insertBefore(selectedEl, selectedEl.previousElementSibling);
      } else if (dir === 'down' && selectedEl.nextElementSibling) {
        parent_el.insertBefore(selectedEl.nextElementSibling, selectedEl);
      }
      selectElement(selectedEl);
      notifyDomChange();
    }
    if (e.data.type === 'deselect') {
      if (isEditing) exitEditMode();
      clearSelection();
      selectedEl = null;
      parent.postMessage({ type: 'element-deselected' }, '*');
    }
  });

  // Notify parent that bridge is ready
  parent.postMessage({ type: 'bridge-ready' }, '*');
})();
</script>`;

export const EDITOR_OVERRIDE_CSS = `
<style>
  /* Editor overrides: disable animations, hide nav chrome */
  .slide {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    height: 100vh !important;
  }
  .slide .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .deck {
    scroll-snap-type: none !important;
    overflow: hidden !important;
  }
  .deck-progress,
  .deck-dots,
  .deck-counter,
  .deck-hints {
    display: none !important;
  }
  body {
    overflow: hidden !important;
  }
  /* Hover highlight for elements */
  *:hover {
    outline: 1px dashed rgba(59, 130, 246, 0.3);
    outline-offset: 1px;
  }
  [data-se-selected]:hover {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  [contenteditable="true"] {
    cursor: text;
  }
  [contenteditable="true"]:hover {
    outline: 2px solid #22c55e !important;
    outline-offset: 2px;
  }
</style>`;
