// Editor bridge script — injected into slide iframes
// Handles: hover highlights, click-to-select, click-again-to-edit,
// Notion-style drag handles, context menu, drag-to-reorder

export const EDITOR_BRIDGE_SCRIPT = `
<script>
(function() {
  var selectedEl = null;
  var isEditing = false;
  var selectedAt = 0;
  var EDIT_DELAY = 400;

  var TEXT_SELECTOR = 'h1,h2,h3,h4,p,li,span,blockquote,cite,td,th,div.turtle-card__desc,div.turtle-card__name,div.slide__kpi-val,div.slide__kpi-label';

  var REORDERABLE_SELECTOR = [
    'ul.slide__bullets > li',
    'ol > li',
    'div.turtle-grid > div.turtle-card',
    'div.slide__kpis > div.slide__kpi',
    'tbody > tr',
    'div.slide__panels > div.slide__panel'
  ].join(',');

  // ===== Create UI elements =====
  var handle = document.createElement('div');
  handle.className = 'se-handle';
  handle.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>';
  handle.style.display = 'none';
  document.body.appendChild(handle);

  var menu = document.createElement('div');
  menu.className = 'se-menu';
  menu.style.display = 'none';
  menu.innerHTML = '<button data-action="move-up"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> Move Up</button>'
    + '<button data-action="move-down"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> Move Down</button>'
    + '<div class="se-menu-sep"></div>'
    + '<button data-action="duplicate"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Duplicate</button>'
    + '<button data-action="delete" class="se-menu-danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete</button>';
  document.body.appendChild(menu);

  var dropIndicator = document.createElement('div');
  dropIndicator.className = 'se-drop-indicator';
  dropIndicator.style.display = 'none';
  document.body.appendChild(dropIndicator);

  var handleTarget = null;
  var hideTimeout = null;
  var dragEl = null;
  var dropTarget = null;
  var dropAfter = false;
  var isDragging = false;

  // ===== Utilities =====
  function cssPath(el) {
    var path = [];
    while (el && el.nodeType === 1) {
      var selector = el.tagName.toLowerCase();
      if (el.id) { selector += '#' + el.id; path.unshift(selector); break; }
      var sib = el, nth = 1;
      while ((sib = sib.previousElementSibling)) { if (sib.tagName === el.tagName) nth++; }
      if (nth > 1) selector += ':nth-of-type(' + nth + ')';
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function notifyDomChange() {
    var section = document.querySelector('.slide');
    if (section) {
      parent.postMessage({ type: 'dom-updated', outerHtml: section.outerHTML }, '*');
    }
  }

  // ===== Selection =====
  function clearSelection() {
    document.querySelectorAll('[data-se-selected]').forEach(function(el) {
      el.removeAttribute('data-se-selected');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }

  function selectElement(el) {
    clearSelection();
    hideMenu();
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

  // ===== Edit Mode =====
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
    hideHandle();
    hideMenu();
    el.contentEditable = 'true';
    el.style.outline = '2px solid #22c55e';
    el.style.outlineOffset = '2px';
    el.focus();
    if (clickEvent && document.caretRangeFromPoint) {
      var range = document.caretRangeFromPoint(clickEvent.clientX, clickEvent.clientY);
      if (range) { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    } else if (clickEvent && document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(clickEvent.clientX, clickEvent.clientY);
      if (pos) {
        var range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset); range.collapse(true);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      }
    }
    parent.postMessage({ type: 'editing-started' }, '*');
  }

  function isTextElement(el) {
    if (!el || el.closest('svg') || el.closest('script')) return false;
    return el.closest(TEXT_SELECTOR) !== null;
  }

  // ===== Handle: find target, position, show/hide =====
  function findHandleTarget(el) {
    if (!el || el.tagName === 'HTML' || el.tagName === 'BODY') return null;
    if (el.classList && (el.classList.contains('deck') || el.classList.contains('slide'))) return null;
    if (el.closest('.se-handle') || el.closest('.se-menu')) return null;
    var target = el.closest(REORDERABLE_SELECTOR);
    if (!target) return null;
    if (!target.previousElementSibling && !target.nextElementSibling) return null;
    return target;
  }

  function positionHandle(el) {
    if (!el) { handle.style.display = 'none'; handleTarget = null; return; }
    handleTarget = el;
    var rect = el.getBoundingClientRect();
    handle.style.display = 'flex';
    handle.style.top = Math.max(4, rect.top + rect.height / 2 - 14) + 'px';
    var idealLeft = rect.left - 30;
    if (idealLeft < 4) idealLeft = rect.left + 4;
    handle.style.left = idealLeft + 'px';
  }

  function hideHandle() {
    handle.style.display = 'none';
    handleTarget = null;
  }

  // ===== Context Menu =====
  function showMenu() {
    if (!handleTarget) return;
    var handleRect = handle.getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.top = (handleRect.bottom + 4) + 'px';
    menu.style.left = handleRect.left + 'px';

    // Disable move buttons at boundaries
    var upBtn = menu.querySelector('[data-action="move-up"]');
    var downBtn = menu.querySelector('[data-action="move-down"]');
    if (upBtn) {
      var canUp = !!handleTarget.previousElementSibling;
      upBtn.style.opacity = canUp ? '1' : '0.35';
      upBtn.style.pointerEvents = canUp ? 'auto' : 'none';
    }
    if (downBtn) {
      var canDown = !!handleTarget.nextElementSibling;
      downBtn.style.opacity = canDown ? '1' : '0.35';
      downBtn.style.pointerEvents = canDown ? 'auto' : 'none';
    }

    // Clamp to viewport
    requestAnimationFrame(function() {
      var mr = menu.getBoundingClientRect();
      if (mr.right > window.innerWidth - 8) menu.style.left = (window.innerWidth - mr.width - 8) + 'px';
      if (mr.bottom > window.innerHeight - 8) menu.style.top = (handleRect.top - mr.height - 4) + 'px';
      if (parseFloat(menu.style.left) < 8) menu.style.left = '8px';
      if (parseFloat(menu.style.top) < 8) menu.style.top = '8px';
    });
  }

  function hideMenu() {
    menu.style.display = 'none';
  }

  menu.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || !handleTarget) return;
    var action = btn.dataset.action;
    var el = handleTarget;
    var parentEl = el.parentElement;

    if (action === 'move-up' && el.previousElementSibling) {
      parentEl.insertBefore(el, el.previousElementSibling);
      selectElement(el);
      notifyDomChange();
    } else if (action === 'move-down' && el.nextElementSibling) {
      parentEl.insertBefore(el.nextElementSibling, el);
      selectElement(el);
      notifyDomChange();
    } else if (action === 'duplicate') {
      var clone = el.cloneNode(true);
      clone.removeAttribute('data-se-selected');
      clone.style.outline = '';
      clone.style.outlineOffset = '';
      el.after(clone);
      selectElement(clone);
      notifyDomChange();
    } else if (action === 'delete') {
      el.remove();
      if (selectedEl === el) {
        selectedEl = null;
        parent.postMessage({ type: 'element-deselected' }, '*');
      }
      notifyDomChange();
    }
    hideMenu();
    e.stopPropagation();
  });

  // ===== Handle: pointer-based drag + click → menu =====
  var dragStartX = 0;
  var dragStartY = 0;
  var didDrag = false;
  var isGridDrag = false;
  var DRAG_THRESHOLD = 5;

  function detectGridLayout(el) {
    var p = el.parentElement;
    if (!p) return false;
    var style = window.getComputedStyle(p);
    return style.display === 'grid' || style.display === 'inline-grid';
  }

  function showDropIndicator(rect) {
    dropIndicator.style.display = 'block';
    dropIndicator.style.top = (rect.top - 2) + 'px';
    dropIndicator.style.left = rect.left + 'px';
    dropIndicator.style.width = rect.width + 'px';
    dropIndicator.style.height = '2px';
    dropIndicator.style.background = '#3b82f6';
    dropIndicator.style.border = 'none';
    dropIndicator.style.borderRadius = '1px';
  }

  function showSwapIndicator(rect) {
    // Highlight the target card with a dashed outline
    dropIndicator.style.display = 'block';
    dropIndicator.style.top = (rect.top - 2) + 'px';
    dropIndicator.style.left = (rect.left - 2) + 'px';
    dropIndicator.style.width = (rect.width + 4) + 'px';
    dropIndicator.style.height = (rect.height + 4) + 'px';
    dropIndicator.style.background = 'transparent';
    dropIndicator.style.border = '2px dashed #3b82f6';
    dropIndicator.style.borderRadius = '8px';
  }

  function swapElements(a, b) {
    var parentA = a.parentElement;
    var parentB = b.parentElement;
    var nextA = a.nextSibling;
    var nextB = b.nextSibling;
    // Insert a before b's next sibling (i.e., where b was)
    parentB.insertBefore(a, nextB);
    // Insert b before a's original next sibling (i.e., where a was)
    parentA.insertBefore(b, nextA);
  }

  // Mousedown on handle starts potential drag
  handle.addEventListener('mousedown', function(e) {
    if (!handleTarget) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    didDrag = false;
    dragEl = handleTarget;
    isGridDrag = detectGridLayout(dragEl);
  });

  // Document-level mousemove handles drag (no pointer capture needed)
  document.addEventListener('mousemove', function(e) {
    if (!dragEl) return;

    var dist = Math.sqrt(Math.pow(e.clientX - dragStartX, 2) + Math.pow(e.clientY - dragStartY, 2));
    if (!isDragging && dist > DRAG_THRESHOLD) {
      isDragging = true;
      didDrag = true;
      hideMenu();
      hideHandle();
      dragEl.style.opacity = '0.4';
      dragEl.style.outline = '2px dashed #3b82f6';
      dragEl.style.outlineOffset = '2px';
      dragEl.style.pointerEvents = 'none';
    }

    if (!isDragging) return;

    // Temporarily hide indicator so elementFromPoint doesn't hit it
    dropIndicator.style.display = 'none';
    var target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;
    var siblingTarget = target.closest(REORDERABLE_SELECTOR);
    if (!siblingTarget || siblingTarget === dragEl || siblingTarget.parentElement !== dragEl.parentElement) {
      dropIndicator.style.display = 'none';
      dropTarget = null;
      return;
    }

    var rect = siblingTarget.getBoundingClientRect();
    if (isGridDrag) {
      showSwapIndicator(rect);
    } else {
      showDropIndicator(rect);
    }
    dropTarget = siblingTarget;
  });

  // Document-level mouseup completes drag or triggers click
  document.addEventListener('mouseup', function(e) {
    if (!dragEl) return;

    if (isDragging && dropTarget) {
      if (isGridDrag) {
        swapElements(dragEl, dropTarget);
      } else {
        dropTarget.before(dragEl);
      }
      selectElement(dragEl);
      notifyDomChange();
    }

    // Reset drag state
    dragEl.style.opacity = '';
    dragEl.style.outline = '';
    dragEl.style.outlineOffset = '';
    dragEl.style.pointerEvents = '';
    isDragging = false;
    isGridDrag = false;
    dropTarget = null;
    dropIndicator.style.display = 'none';
    dropIndicator.style.background = '';
    dropIndicator.style.border = '';
    dropIndicator.style.borderRadius = '';
    dropIndicator.style.height = '';

    // If it was a click (no drag), toggle the context menu
    if (!didDrag && handleTarget) {
      selectElement(handleTarget);
      if (menu.style.display === 'block') {
        hideMenu();
      } else {
        showMenu();
      }
    }

    dragEl = null;
  });

  // ===== Hover → Show Handle (zone-based with debounce) =====
  document.addEventListener('mousemove', function(e) {
    if (isDragging || isEditing) return;

    // Mouse over handle or menu — keep visible, cancel any pending hide
    if (e.target.closest('.se-handle') || e.target.closest('.se-menu')) {
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      return;
    }

    var target = findHandleTarget(e.target);

    if (target && target !== handleTarget) {
      // New target — show handle, cancel hide
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      positionHandle(target);
    } else if (target && target === handleTarget) {
      // Same target — cancel hide
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    } else if (!target) {
      // No target — check if mouse is in the handle zone
      if (handleTarget) {
        var rect = handleTarget.getBoundingClientRect();
        // Zone only covers the handle area (left of the element), not the full card
        var inZone = e.clientX >= rect.left - 36
          && e.clientX <= rect.left + 8
          && e.clientY >= rect.top - 4
          && e.clientY <= rect.bottom + 4;
        if (inZone) {
          if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
          return;
        }
      }
      // Outside — debounced hide
      if (!hideTimeout) {
        hideTimeout = setTimeout(function() {
          hideHandle();
          hideTimeout = null;
        }, 80);
      }
    }
  });

  // ===== Click Handler — Core Interaction =====
  document.addEventListener('click', function(e) {
    var clickedEl = e.target;

    // Ignore clicks on handle/menu
    if (clickedEl.closest('.se-handle') || clickedEl.closest('.se-menu')) return;

    // Hide menu on any other click
    hideMenu();

    // Walk up past body/html/deck
    while (clickedEl && (clickedEl.tagName === 'HTML' || clickedEl.tagName === 'BODY' || clickedEl.classList.contains('deck'))) {
      clickedEl = null;
      break;
    }
    if (!clickedEl) return;

    var textEl = clickedEl.closest(TEXT_SELECTOR);

    // Case 1: Currently editing
    if (isEditing && selectedEl) {
      if (selectedEl.contains(clickedEl)) return;
      exitEditMode();
      e.preventDefault();
      selectElement(clickedEl);
      return;
    }

    // Case 2: Clicking on already-selected element
    if (selectedEl && (selectedEl === clickedEl || selectedEl.contains(clickedEl) || clickedEl.contains(selectedEl))) {
      var editTarget = textEl || (isTextElement(selectedEl) ? selectedEl : null);
      var timeSinceSelect = Date.now() - selectedAt;
      if (editTarget && timeSinceSelect > EDIT_DELAY) {
        e.preventDefault();
        if (selectedEl !== editTarget) selectElement(editTarget);
        enterEditMode(editTarget, e);
        return;
      }
      e.preventDefault();
      return;
    }

    // Case 3: New element
    e.preventDefault();
    selectElement(clickedEl);
  }, true);

  // Prevent double-click word selection
  document.addEventListener('dblclick', function(e) { e.preventDefault(); }, true);

  // Exit edit mode on blur
  document.addEventListener('focusout', function(e) {
    if (isEditing && selectedEl) {
      setTimeout(function() { if (isEditing) exitEditMode(); }, 100);
    }
  });

  // Escape key — close menu, or deselect
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (menu.style.display === 'block') { hideMenu(); e.preventDefault(); return; }
      if (isEditing) { exitEditMode(); e.preventDefault(); return; }
    }
  });

  // ===== Commands from Parent =====
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
      var p = selectedEl.parentElement;
      if (!p) return;
      if (dir === 'up' && selectedEl.previousElementSibling) p.insertBefore(selectedEl, selectedEl.previousElementSibling);
      else if (dir === 'down' && selectedEl.nextElementSibling) p.insertBefore(selectedEl.nextElementSibling, selectedEl);
      selectElement(selectedEl);
      notifyDomChange();
    }
    if (e.data.type === 'deselect') {
      if (isEditing) exitEditMode();
      clearSelection();
      hideMenu();
      hideHandle();
      selectedEl = null;
      parent.postMessage({ type: 'element-deselected' }, '*');
    }
  });

  parent.postMessage({ type: 'bridge-ready' }, '*');
})();
</script>`;

export const EDITOR_OVERRIDE_CSS = `
<style>
  /* Editor overrides */
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
  .deck { scroll-snap-type: none !important; overflow: hidden !important; }
  .deck-progress, .deck-dots, .deck-counter, .deck-hints { display: none !important; }
  body { overflow: hidden !important; }

  /* Targeted hover highlights — only on editable/reorderable elements */
  li:hover, div.turtle-card:hover, div.slide__kpi:hover,
  tr:hover, div.slide__panel:hover,
  h1:hover, h2:hover, h3:hover, h4:hover, p:hover,
  blockquote:hover, cite:hover, td:hover, th:hover {
    outline: 1px dashed rgba(59, 130, 246, 0.25);
    outline-offset: 1px;
  }
  [data-se-selected]:hover {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  [contenteditable="true"] { cursor: text; }
  [contenteditable="true"]:hover {
    outline: 2px solid #22c55e !important;
    outline-offset: 2px;
  }

  /* Notion-style drag handle */
  .se-handle {
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 28px;
    border-radius: 4px;
    cursor: grab;
    color: #9ca3af;
    background: rgba(255,255,255,0.95);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    z-index: 9999;
    transition: color 0.15s, background 0.15s, box-shadow 0.15s, opacity 0.12s;
    user-select: none;
    -webkit-user-select: none;
  }
  .se-handle:hover {
    color: #374151;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    outline: none !important;
  }
  .se-handle:active { cursor: grabbing; }
  .se-handle svg { pointer-events: none; }
  .se-handle:hover *, .se-menu:hover *, .se-handle *, .se-menu * {
    outline: none !important;
  }

  /* Context menu */
  .se-menu {
    position: fixed;
    z-index: 10000;
    background: white;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
    min-width: 156px;
  }
  .se-menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    background: transparent;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
    color: #374151;
    text-align: left;
    white-space: nowrap;
    outline: none !important;
    transition: background 0.1s;
  }
  .se-menu button:hover { background: #f3f4f6; }
  .se-menu button svg { flex-shrink: 0; }
  .se-menu-sep { height: 1px; background: #e5e7eb; margin: 4px 0; }
  .se-menu-danger { color: #dc2626 !important; }
  .se-menu-danger:hover { background: #fef2f2 !important; }

  /* Drop indicator — line for lists, highlight for grid swap */
  .se-drop-indicator {
    position: fixed;
    background: #3b82f6;
    border-radius: 1px;
    z-index: 9998;
    pointer-events: none;
  }
  /* When used as a line (height=2px), show end dots */
  .se-drop-indicator::before,
  .se-drop-indicator::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3b82f6;
  }
  .se-drop-indicator::before { top: -3px; left: -3px; }
  .se-drop-indicator::after { bottom: -3px; right: -3px; }
</style>`;
