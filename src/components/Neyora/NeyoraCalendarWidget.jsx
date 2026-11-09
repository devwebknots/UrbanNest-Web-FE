import React, { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
// Step 4: the widget talks to Neyora's own backend directly from the browser
// (ARCH_050) — never through UrbanNest's backend — so this is a separate base
// URL from API_BASE above, which is only used for the widget-session mint.
const NEYORA_API_BASE = process.env.REACT_APP_NEYORA_API_BASE || 'http://localhost:8000/api';

function loadWidgetAssets() {
  return new Promise((resolve, reject) => {
    if (!document.getElementById('neyora-widget-css')) {
      const link = document.createElement('link');
      link.id = 'neyora-widget-css';
      link.rel = 'stylesheet';
      link.href = '/neyora-widget.css';
      document.head.appendChild(link);
    }
    if (window.NeyoraWidget) { resolve(); return; }
    let script = document.getElementById('neyora-widget-js');
    if (!script) {
      script = document.createElement('script');
      script.id = 'neyora-widget-js';
      script.src = '/neyora-widget.js';
      document.body.appendChild(script);
    }
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Failed to load neyora-widget.js')));
    setTimeout(() => { if (window.NeyoraWidget) resolve(); }, 0);
  });
}

export default function NeyoraCalendarWidget() {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Not logged in to UrbanNest.');
        const [sessionRes] = await Promise.all([
          fetch(`${API_BASE}/neyora-interface-layer/calendar/widget-session/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          loadWidgetAssets(),
        ]);
        if (!sessionRes.ok) throw new Error(`Could not start a Neyora session (HTTP ${sessionRes.status}).`);
        const { token: widgetToken } = await sessionRes.json();
        if (cancelled) return;
        if (!window.NeyoraWidget || !containerRef.current) throw new Error('Neyora widget script did not load correctly.');
        window.NeyoraWidget.mount(containerRef.current, { token: widgetToken, apiBase: NEYORA_API_BASE });
        setStatus('ready');
      } catch (err) {
        if (!cancelled) { setErrorMessage(err.message || 'Something went wrong loading the calendar.'); setStatus('error'); }
      }
    }
    setup();
    return () => {
      cancelled = true;
      if (window.NeyoraWidget && containerRef.current && window.NeyoraWidget.unmount) {
        window.NeyoraWidget.unmount(containerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: 480, width: '100%' }}>
      {status === 'loading' && <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading your calendar…</div>}
      {status === 'error' && <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 13 }}>{errorMessage}</div>}
      <div ref={containerRef} style={{ display: status === 'ready' ? 'block' : 'none' }} />
    </div>
  );
}
