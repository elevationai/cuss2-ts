(function () {
  'use strict';

  var PANEL_WIDTH = 500;
  var TOGGLE_WIDTH = 32;
  var DEFAULT_SRC = 'https://ts.cuss2.dev/examples/moki.html';
  var DEFAULT_WS = 'ws://localhost:22222/devtools';
  var STORAGE_KEY = 'moki-embed-config';

  var scriptEl = document.currentScript;

  // ── localStorage config ───────────────────────────────────────────
  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) { return {}; }
  }

  function saveConfig(cfg) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
  }

  var saved = loadConfig();

  // localStorage overrides data-* attributes
  var position = saved.position || (scriptEl && scriptEl.getAttribute('data-position')) || 'right';
  var startOpen = saved.open != null ? saved.open : (scriptEl && scriptEl.getAttribute('data-open') === 'true');
  var mokiSrc = saved.src || (scriptEl && scriptEl.getAttribute('data-src')) || DEFAULT_SRC;
  var mode = saved.mode || (scriptEl && scriptEl.getAttribute('data-mode')) || 'docked';
  var docked = mode === 'docked';
  var wsOverride = saved.ws || (scriptEl && scriptEl.getAttribute('data-ws')) || '';

  function resolveWsUrl() {
    if (wsOverride) return wsOverride;
    try {
      if (window.cuss2 && window.cuss2.connection && window.cuss2.connection._socketURL) {
        var socketUrl = window.cuss2.connection._socketURL;
        return socketUrl.replace(/\/platform\/subscribe\/?$/, '/devtools');
      }
    } catch (e) { /* ignore */ }
    try {
      var params = new URLSearchParams(window.location.search);
      var cussWss = params.get('CUSS-WSS');
      if (cussWss) {
        var base = cussWss.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
        var url = new URL(base);
        url.pathname = '/devtools';
        return url.toString();
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_WS;
  }

  var isLeft = position === 'left';
  var isOpen = startOpen;
  var marginProp = isLeft ? 'margin-left' : 'margin-right';

  function buildSrc() {
    var ws = resolveWsUrl();
    var sep = mokiSrc.indexOf('?') === -1 ? '?' : '&';
    return mokiSrc + sep + 'ws=' + encodeURIComponent(ws);
  }

  var closedPos = isOpen ? '0px' : (isLeft ? '-' + PANEL_WIDTH + 'px' : PANEL_WIDTH + 'px');
  var separatorShadow = (isLeft ? '' : '-') + '4px 0 0 0 #aaa';

  // ── Styles ────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent =
    'body{transition:' + marginProp + ' .3s ease;}' +

    // Panel: only the iframe width, toggle hangs outside via absolute pos
    '#moki-panel{' +
      'position:fixed;top:0;' +
      (isLeft ? 'left' : 'right') + ':0;' +
      'width:' + PANEL_WIDTH + 'px;' +
      'height:100vh;z-index:999999;' +
      'transform:translateX(' + closedPos + ');' +
      'transition:transform .3s ease;' +
    '}' +
    '#moki-frame{' +
      'width:100%;height:100%;border:none;' +
      'background:#0f0f1e;' +
    '}' +

    // Toggle hangs outside the panel over the host page
    '#moki-toggle-wrap{' +
      'position:absolute;top:50%;' +
      'transform:translateY(-50%);' +
      (isLeft ? 'right:-' + TOGGLE_WIDTH + 'px;' : 'left:-' + TOGGLE_WIDTH + 'px;') +
      'display:flex;flex-direction:column;align-items:center;gap:0;' +
      'z-index:1;' +
    '}' +
    '#moki-toggle{' +
      'writing-mode:vertical-rl;' +
      'width:' + TOGGLE_WIDTH + 'px;' +
      'padding:14px 0;' +
      'background:linear-gradient(180deg,#0f0f1e 0%,#1a1a2e 100%);' +
      'color:#64ffda;' +
      'border:1px solid rgba(100,255,218,.3);' +
      (isLeft ? 'border-left:none;' : 'border-right:none;') +
      'border-bottom:none;' +
      'cursor:pointer;font-size:13px;font-weight:700;' +
      'letter-spacing:2px;' +
      'border-radius:' + (isLeft ? '0 8px 0 0' : '8px 0 0 0') + ';' +
      'transition:background .2s;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'text-align:center;' +
    '}' +
    '#moki-toggle:hover{background:rgba(100,255,218,.15);}' +
    '#moki-gear{' +
      'width:' + TOGGLE_WIDTH + 'px;' +
      'padding:6px 0;' +
      'background:linear-gradient(180deg,#1a1a2e 0%,#0f0f1e 100%);' +
      'color:#64ffda;' +
      'border:1px solid rgba(100,255,218,.3);' +
      (isLeft ? 'border-left:none;' : 'border-right:none;') +
      'border-top:none;' +
      'cursor:pointer;font-size:14px;' +
      'opacity:0.35;transition:opacity .2s,background .2s;' +
      'border-radius:' + (isLeft ? '0 0 8px 0' : '0 0 0 8px') + ';' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'text-align:center;line-height:1;' +
    '}' +
    '#moki-gear:hover{opacity:0.8;background:rgba(100,255,218,.1);}' +

    // Modal styles
    '#moki-modal-overlay{' +
      'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;' +
      'background:rgba(0,0,0,.5);z-index:1000000;' +
      'align-items:center;justify-content:center;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
    '}' +
    '#moki-modal-overlay.open{display:flex;}' +
    '#moki-modal{' +
      'background:#1a1a2e;color:#e0e0e0;border:1px solid rgba(100,255,218,.3);' +
      'border-radius:12px;padding:24px;width:380px;max-width:90vw;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.5);' +
    '}' +
    '#moki-modal h3{' +
      'margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#64ffda;' +
    '}' +
    '#moki-modal label{' +
      'display:block;font-size:0.8rem;color:#aaa;margin:12px 0 4px;font-weight:600;' +
    '}' +
    '#moki-modal label:first-of-type{margin-top:0;}' +
    '#moki-modal input,#moki-modal select{' +
      'width:100%;padding:8px 10px;background:#0f0f1e;color:#e0e0e0;' +
      'border:1px solid rgba(100,255,218,.2);border-radius:6px;' +
      'font-size:0.85rem;box-sizing:border-box;' +
      'font-family:inherit;' +
    '}' +
    '#moki-modal input:focus,#moki-modal select:focus{' +
      'outline:none;border-color:rgba(100,255,218,.5);' +
    '}' +
    '#moki-modal-buttons{' +
      'display:flex;gap:8px;margin-top:20px;justify-content:flex-end;' +
    '}' +
    '#moki-modal-buttons button{' +
      'padding:8px 16px;border-radius:6px;font-size:0.85rem;font-weight:600;' +
      'cursor:pointer;border:1px solid rgba(100,255,218,.3);' +
      'font-family:inherit;' +
    '}' +
    '.moki-btn-cancel{background:transparent;color:#aaa;}' +
    '.moki-btn-cancel:hover{background:rgba(255,255,255,.05);color:#e0e0e0;}' +
    '.moki-btn-save{background:rgba(100,255,218,.15);color:#64ffda;}' +
    '.moki-btn-save:hover{background:rgba(100,255,218,.25);}' +
    '.moki-btn-reset{background:transparent;color:#ff6b6b;border-color:rgba(255,107,107,.3);}' +
    '.moki-btn-reset:hover{background:rgba(255,107,107,.1);}';
  document.head.appendChild(style);

  // ── Panel DOM ─────────────────────────────────────────────────────
  var panel = document.createElement('div');
  panel.id = 'moki-panel';

  var toggleWrap = document.createElement('div');
  toggleWrap.id = 'moki-toggle-wrap';

  var toggle = document.createElement('button');
  toggle.id = 'moki-toggle';
  toggle.textContent = 'MŏKi';

  var gear = document.createElement('button');
  gear.id = 'moki-gear';
  gear.innerHTML = '&#9881;';
  gear.title = 'Settings';

  toggleWrap.appendChild(toggle);
  toggleWrap.appendChild(gear);

  var iframe = document.createElement('iframe');
  iframe.id = 'moki-frame';
  iframe.src = buildSrc();

  panel.appendChild(toggleWrap);
  panel.appendChild(iframe);

  // ── Modal DOM ─────────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'moki-modal-overlay';
  overlay.innerHTML =
    '<div id="moki-modal">' +
      '<h3>MŏKi Settings</h3>' +
      '<label for="moki-cfg-ws">WebSocket URL</label>' +
      '<input id="moki-cfg-ws" type="text" placeholder="auto-detect">' +
      '<label for="moki-cfg-src">Mŏki Source URL</label>' +
      '<input id="moki-cfg-src" type="text" placeholder="' + DEFAULT_SRC + '">' +
      '<label for="moki-cfg-pos">Position</label>' +
      '<select id="moki-cfg-pos"><option value="right">Right</option><option value="left">Left</option></select>' +
      '<label for="moki-cfg-mode">Mode</label>' +
      '<select id="moki-cfg-mode"><option value="docked">Docked</option><option value="overlay">Overlay</option></select>' +
      '<div id="moki-modal-buttons">' +
        '<button class="moki-btn-reset" id="moki-cfg-reset">Reset</button>' +
        '<button class="moki-btn-cancel" id="moki-cfg-cancel">Cancel</button>' +
        '<button class="moki-btn-save" id="moki-cfg-save">Save</button>' +
      '</div>' +
    '</div>';

  // ── Dock / Separator helpers ──────────────────────────────────────
  function applyDock() {
    if (!docked) return;
    var val = isOpen ? PANEL_WIDTH + 'px' : '0px';
    document.body.style[isLeft ? 'marginLeft' : 'marginRight'] = val;
    document.documentElement.style.setProperty(isLeft ? '--moki-inset-left' : '--moki-inset-right', val);
    document.documentElement.style.setProperty(isLeft ? '--moki-inset-right' : '--moki-inset-left', '0px');
  }

  function applySeparator() {
    iframe.style.boxShadow = isOpen ? separatorShadow : 'none';
  }

  // ── Toggle click ──────────────────────────────────────────────────
  function persistOpen() {
    var cfg = loadConfig();
    cfg.open = isOpen;
    saveConfig(cfg);
  }

  toggle.addEventListener('click', function () {
    isOpen = !isOpen;
    panel.style.transform = isOpen
      ? 'translateX(0)'
      : 'translateX(' + (isLeft ? '-' + PANEL_WIDTH + 'px' : PANEL_WIDTH + 'px') + ')';
    applyDock();
    applySeparator();
    persistOpen();
  });

  // ── Gear / Modal ──────────────────────────────────────────────────
  function openModal() {
    var cfg = loadConfig();
    overlay.querySelector('#moki-cfg-ws').value = cfg.ws || '';
    overlay.querySelector('#moki-cfg-src').value = cfg.src || '';
    overlay.querySelector('#moki-cfg-pos').value = position;
    overlay.querySelector('#moki-cfg-mode').value = mode;
    overlay.classList.add('open');
  }

  function closeModal() {
    overlay.classList.remove('open');
  }

  gear.addEventListener('click', function (e) {
    e.stopPropagation();
    openModal();
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  function attachModalEvents() {
    overlay.querySelector('#moki-cfg-cancel').addEventListener('click', closeModal);

    overlay.querySelector('#moki-cfg-save').addEventListener('click', function () {
      var cfg = {
        ws: overlay.querySelector('#moki-cfg-ws').value.trim() || undefined,
        src: overlay.querySelector('#moki-cfg-src').value.trim() || undefined,
        position: overlay.querySelector('#moki-cfg-pos').value,
        mode: overlay.querySelector('#moki-cfg-mode').value,
      };
      Object.keys(cfg).forEach(function (k) { if (cfg[k] === undefined) delete cfg[k]; });
      saveConfig(cfg);
      window.location.reload();
    });

    overlay.querySelector('#moki-cfg-reset').addEventListener('click', function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      window.location.reload();
    });
  }

  // ── Mount ─────────────────────────────────────────────────────────
  document.body.appendChild(panel);
  document.body.appendChild(overlay);
  attachModalEvents();
  applyDock();
  applySeparator();
})();
