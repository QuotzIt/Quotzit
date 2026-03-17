// Quotzit v3.0 — invite flow, settings, filters, search, landing page, themes
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// 25002500 Portal 2014 renders modals directly on body so iOS fixed positioning works 2500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
const Portal = ({ children }) => createPortal(children, document.body);
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uxpdancjavdtkasvxskf.supabase.co";
const SUPABASE_KEY = "sb_publishable_iYxhoWMNdliIddbtvNBFGQ_lLRZ_Xp0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtDate = iso => new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
const ROTATIONS = [-3,-2,-1,0,1,2,3];

const FONT_OPTIONS = [
  { label:"Casual",  value:"casual",  css:"'Caveat', cursive" },
  { label:"Sharpie", value:"sharpie", css:"'Permanent Marker', cursive" },
  { label:"Messy",   value:"messy",   css:"'Reenie Beanie', cursive" },
  { label:"Neat",    value:"neat",    css:"'Indie Flower', cursive" },
];
const FONT_MAP = Object.fromEntries(FONT_OPTIONS.map(f=>[f.value,f.css]));

const COLOR_OPTIONS = [
  { value:"note-yellow", hex:"#fef08a" },
  { value:"note-blue",   hex:"#bfdbfe" },
  { value:"note-green",  hex:"#bbf7d0" },
  { value:"note-pink",   hex:"#fecdd3" },
  { value:"note-white",  hex:"#fafafa" },
];

// ── Session ───────────────────────────────────────────────────────────────────
const Session = {
  get:   () => { try { return JSON.parse(sessionStorage.getItem("qz_user")); } catch { return null; } },
  set:   u  => sessionStorage.setItem("qz_user", JSON.stringify(u)),
  clear: () => sessionStorage.removeItem("qz_user"),
};

// ── Theme (localStorage) ──────────────────────────────────────────────────────
const ThemeStore = {
  get:  () => { try { return JSON.parse(localStorage.getItem("qz_theme")) || { mode:"dark", bg:null }; } catch { return { mode:"dark", bg:null }; } },
  set:  t  => localStorage.setItem("qz_theme", JSON.stringify(t)),
};

// ── Speech ────────────────────────────────────────────────────────────────────
const useSpeech = onResult => {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const start = () => {
    if (!supported) return alert("Speech recognition requires Chrome or Safari.");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ").trim();
      if (transcript) setTimeout(() => { onResult(transcript); setListening(false); }, 100);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };
  return { listening, start, stop };
};

// ── Global Styles ─────────────────────────────────────────────────────────────
const FontLoader = ({ theme }) => {
  const isDark = theme?.mode !== "light";
  const hasBg  = !!theme?.bg;
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400;600;700&family=Reenie+Beanie&family=Permanent+Marker&family=Indie+Flower&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${isDark ? "#2c3e4a" : "#f0ebe0"}; }
      :root {
        --wall:        ${isDark ? "#2c3e4a" : "#e8e0d0"};
        --wall-deep:   ${isDark ? "#1e2d36" : "#d4c9b5"};
        --wall-mid:    ${isDark ? "#374f5e" : "#c8bda8"};
        --topbar-bg:   ${isDark ? "rgba(22,34,42,0.92)" : "rgba(255,252,245,0.92)"};
        --topbar-border: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"};
        --logo-color:  ${isDark ? "#fef08a" : "#8B5E3C"};
        --cream:       ${isDark ? "#f5efe0" : "#3a2a1a"};
        --pin-red:     #cc3333;
        --pin-shadow:  rgba(0,0,0,0.5);
        --note-yellow: #fef08a;
        --note-blue:   #bfdbfe;
        --note-green:  #bbf7d0;
        --note-pink:   #fecdd3;
        --note-white:  #fafafa;
        --ink:         #1e1e1e;
        --ink-faded:   #666;
        --font-ui:     'Playfair Display', Georgia, serif;
        --font-hand:   'Caveat', cursive;
        --font-marker: 'Permanent Marker', cursive;
      }

      .app-wrapper {
        min-height: 100vh;
        background-color: var(--wall);
        ${hasBg ? `background-image: url("${theme.bg}"); background-size: cover; background-position: center; background-attachment: fixed;` :
          isDark ?
          `background-image: radial-gradient(ellipse at 15% 25%, rgba(74,101,114,0.5) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(30,45,54,0.65) 0%, transparent 50%);` :
          `background-image: radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 60%);`
        }
      }
      .app-wrapper.has-bg::after {
        content: ''; position: fixed; inset: 0;
        background: ${isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.35)"};
        pointer-events: none; z-index: 0;
      }
      .app-wrapper > *:not(style) { position: relative; z-index: 1; }

      .topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 24px;
        background: var(--topbar-bg);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--topbar-border);
        position: sticky; top: 0; z-index: 100;
      }
      .topbar-logo { font-family: var(--font-marker); font-size: 1.8rem; color: var(--logo-color); letter-spacing: 1px; text-shadow: 1px 2px 8px rgba(0,0,0,0.3); cursor: pointer; }
      .topbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .topbar-greeting { font-family: var(--font-ui); font-style: italic; font-size: 0.88rem; color: ${isDark ? "rgba(245,239,224,0.55)" : "rgba(58,42,26,0.6)"}; white-space: nowrap; }

      .btn { font-family: var(--font-ui); font-size: 0.85rem; font-weight: 700; letter-spacing: 0.03em; border: none; cursor: pointer; border-radius: 3px; padding: 8px 16px; transition: transform 0.12s, opacity 0.12s; }
      .btn:hover  { transform: translateY(-1px); opacity: 0.9; }
      .btn:active { transform: translateY(1px); }
      .btn-primary { background: var(--note-yellow); color: var(--ink); box-shadow: 2px 3px 8px rgba(0,0,0,0.28); }
      .btn-ghost   { background: transparent; color: var(--cream); border: 1.5px solid ${isDark ? "rgba(245,239,224,0.4)" : "rgba(58,42,26,0.35)"}; }
      .btn-danger  { background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5; }
      .btn-sm      { font-size: 0.76rem; padding: 5px 11px; }
      .btn-cancel  { background: none; border: 1.5px solid #ddd; color: #999; font-family: var(--font-ui); font-size: 0.85rem; cursor: pointer; padding: 8px 16px; border-radius: 3px; }
      .icon-only   { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; line-height: 1; }

      /* ── LANDING ── */
      .landing { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background-color: var(--wall); background-image: radial-gradient(ellipse at 15% 25%, rgba(74,101,114,0.5) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(30,45,54,0.65) 0%, transparent 50%); }
      .landing-logo { font-family: var(--font-marker); font-size: 4rem; color: var(--note-yellow); text-shadow: 2px 3px 14px rgba(0,0,0,0.5); margin-bottom: 6px; }
      .landing-tagline { font-family: var(--font-ui); font-style: italic; font-size: 1.1rem; color: rgba(245,239,224,0.7); margin-bottom: 48px; text-align: center; }
      .landing-quote-wrap { position: relative; margin-bottom: 48px; }
      .landing-note { background: var(--note-yellow); border-radius: 2px; padding: 28px 32px 22px; max-width: 380px; box-shadow: 4px 6px 22px rgba(0,0,0,0.3); transform: rotate(-2deg); position: relative; }
      .landing-note::before { content:''; position:absolute; top:-10px; left:50%; transform:translateX(-50%); width:15px; height:15px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 7px var(--pin-shadow); }
      .landing-note-text { font-family: 'Permanent Marker', cursive; font-size: 1.3rem; color: var(--ink); line-height: 1.5; margin-bottom: 10px; }
      .landing-note-meta { font-family: var(--font-ui); font-size: 0.78rem; color: #666; font-style: italic; }
      .landing-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 320px; }
      .landing-actions .btn { width: 100%; text-align: center; font-size: 1rem; padding: 14px; }
      .landing-divider { font-family: var(--font-ui); font-style: italic; color: rgba(245,239,224,0.4); font-size: 0.85rem; }

      /* ── AUTH ── */
      .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--wall); background-image: radial-gradient(ellipse at 30% 40%, rgba(74,101,114,0.5) 0%, transparent 65%); padding: 20px; }
      .auth-card { background: var(--note-white); border-radius: 2px; padding: 44px 38px 36px; width: 370px; max-width: 100%; box-shadow: 5px 7px 28px rgba(0,0,0,0.38); position: relative; }
      .auth-card::before { content:''; position:absolute; top:-11px; left:50%; transform:translateX(-50%); width:18px; height:18px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 8px var(--pin-shadow); }
      .auth-title { font-family:var(--font-marker); font-size:2.6rem; color:var(--ink); text-align:center; margin-bottom:3px; }
      .auth-sub   { font-family:var(--font-ui); font-style:italic; font-size:0.95rem; color:var(--ink-faded); text-align:center; margin-bottom:28px; }
      .auth-error { background:#fee2e2; color:#991b1b; border-radius:2px; padding:8px 12px; font-family:var(--font-ui); font-size:0.85rem; margin-bottom:14px; }
      .auth-info  { background:#e0f2fe; color:#0369a1; border-radius:2px; padding:8px 12px; font-family:var(--font-ui); font-size:0.85rem; margin-bottom:14px; }
      .auth-toggle { text-align:center; margin-top:14px; font-family:var(--font-ui); font-style:italic; font-size:0.88rem; color:var(--ink-faded); }
      .auth-toggle span { color:#7a4f1e; cursor:pointer; text-decoration:underline; }

      /* ── FIELDS ── */
      .field { margin-bottom: 14px; }
      .field label { display:block; font-family:var(--font-ui); font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faded); margin-bottom:5px; }
      .field input, .field select, .field textarea { width:100%; font-family:var(--font-hand); font-size:1.05rem; padding:9px 12px; border:1.5px solid #d4c4a8; border-radius:2px; background:#fffdf5; color:var(--ink); outline:none; transition:border-color 0.15s; }
      .field input:focus, .field select:focus, .field textarea:focus { border-color:#4a6572; }
      .field textarea { resize:vertical; min-height:80px; }

      /* ── WALL ── */
      .wall-area { padding: 24px 20px 60px; max-width: 1100px; margin: 0 auto; }
      .wall-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
      .wall-title { font-family:var(--font-ui); font-size:1.5rem; font-weight:700; color:var(--cream); text-shadow:1px 2px 6px rgba(0,0,0,0.3); }
      .wall-title em { font-style:italic; font-weight:400; opacity:0.7; }

      /* ── SEARCH ── */
      .search-bar { position: relative; margin-bottom: 14px; }
      .search-bar input { width:100%; font-family:var(--font-ui); font-size:0.9rem; padding:10px 16px 10px 40px; border-radius:4px; border:1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)"}; background:${isDark ? "rgba(22,34,42,0.7)" : "rgba(255,255,255,0.7)"}; color:var(--cream); outline:none; backdrop-filter:blur(4px); }
      .search-bar input::placeholder { color:${isDark ? "rgba(245,239,224,0.35)" : "rgba(58,42,26,0.4)"}; }
      .search-bar input:focus { border-color:${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}; }
      .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:0.9rem; pointer-events:none; opacity:0.5; }
      .search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:0.9rem; opacity:0.5; }

      /* ── FILTERS ── */
      .filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; align-items:center; }
      .filter-label { font-family:var(--font-ui); font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:${isDark ? "rgba(245,239,224,0.4)" : "rgba(58,42,26,0.5)"}; }
      .filter-select { font-family:var(--font-ui); font-size:0.78rem; padding:5px 10px; border-radius:20px; border:1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}; background:${isDark ? "rgba(22,34,42,0.7)" : "rgba(255,255,255,0.7)"}; color:var(--cream); outline:none; cursor:pointer; backdrop-filter:blur(4px); }
      .filter-clear { font-family:var(--font-ui); font-size:0.72rem; color:${isDark ? "rgba(245,239,224,0.5)" : "rgba(58,42,26,0.5)"}; cursor:pointer; text-decoration:underline; background:none; border:none; padding:0; }

      /* ── TAG ACCORDION ── */
      .tag-accordion { background:${isDark ? "rgba(22,34,42,0.5)" : "rgba(255,255,255,0.5)"}; border-radius:4px; margin-bottom:14px; border:1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}; overflow:hidden; }
      .tag-accordion-header { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; cursor:pointer; font-family:var(--font-ui); font-size:0.76rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:${isDark ? "rgba(245,239,224,0.6)" : "rgba(58,42,26,0.6)"}; user-select:none; }
      .tag-arrow { font-size:0.62rem; transition:transform 0.2s; }
      .tag-arrow.open { transform:rotate(180deg); }
      .tag-accordion-body { display:flex; flex-wrap:wrap; gap:6px; padding:10px 14px 14px; border-top:1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}; }
      .tag-pill { font-family:var(--font-ui); font-size:0.75rem; font-weight:700; letter-spacing:0.04em; text-transform:lowercase; padding:4px 13px; border-radius:20px; cursor:pointer; border:1.5px solid transparent; transition:all 0.12s; background:${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}; color:${isDark ? "rgba(245,239,224,0.8)" : "rgba(58,42,26,0.8)"}; }
      .tag-pill:hover { background:${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)"}; }
      .tag-pill.active { background:var(--note-yellow); color:var(--ink); box-shadow:2px 2px 6px rgba(0,0,0,0.2); }

      /* ── NOTES GRID ── */
      .notes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:26px; }

      /* ── STICKY NOTE ── */
      .sticky { position:relative; padding:20px 16px 14px; border-radius:2px; box-shadow:3px 5px 16px rgba(0,0,0,0.26),1px 1px 0 rgba(255,255,255,0.18) inset; transition:transform 0.2s, box-shadow 0.2s; animation:pinDrop 0.3s cubic-bezier(0.34,1.5,0.64,1) both; }
      @keyframes pinDrop { from{opacity:0;transform:translateY(-14px) rotate(var(--rot,0deg))} to{opacity:1;transform:translateY(0) rotate(var(--rot,0deg))} }
      .sticky:hover { transform:rotate(0deg) translateY(-5px) scale(1.025)!important; box-shadow:6px 12px 28px rgba(0,0,0,0.34); z-index:10; }
      .sticky::before { content:''; position:absolute; top:-10px; left:50%; transform:translateX(-50%); width:15px; height:15px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 7px var(--pin-shadow); z-index:2; }
      .note-yellow{background:#fef08a} .note-blue{background:#bfdbfe} .note-green{background:#bbf7d0} .note-pink{background:#fecdd3} .note-white{background:#fafafa}
      .sticky-actions { position:absolute; top:7px; right:8px; display:flex; gap:3px; opacity:0; transition:opacity 0.15s; }
      .sticky:hover .sticky-actions, .touch-visible { opacity:1!important; }
      @media (hover:none) { .sticky-actions{opacity:1} }
      .icon-btn { background:rgba(0,0,0,0.1); border:none; border-radius:3px; width:24px; height:24px; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; justify-content:center; }
      .icon-btn:hover { background:rgba(0,0,0,0.22); }
      .sticky-quote { font-size:1.14rem; font-weight:600; line-height:1.42; color:var(--ink); margin-bottom:10px; word-break:break-word; }
      .sticky-toggle { font-family:var(--font-ui); font-size:0.7rem; color:#555; display:flex; align-items:center; gap:4px; cursor:pointer; user-select:none; border:none; background:none; padding:0; }
      .sticky-toggle:hover { color:#222; }
      .s-arrow { font-size:0.58rem; transition:transform 0.18s; display:inline-block; }
      .s-arrow.open { transform:rotate(180deg); }
      .sticky-meta { font-family:var(--font-ui); font-size:0.74rem; color:#444; margin-top:8px; display:flex; flex-direction:column; gap:4px; border-top:1px dashed rgba(0,0,0,0.12); padding-top:8px; }
      .meta-row { display:flex; align-items:center; gap:5px; }
      .sticky-tag { display:inline-block; margin-top:8px; font-family:var(--font-ui); font-size:0.66rem; font-weight:700; letter-spacing:0.06em; text-transform:lowercase; background:rgba(0,0,0,0.1); border-radius:10px; padding:2px 9px; }

      /* ── MODAL ── */
      .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:flex-start; justify-content:center; z-index:9999; animation:fadeIn 0.15s ease; padding:60px 16px 40px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .modal { background:#fffdf5; width:460px; max-width:100%; max-height:90vh; overflow-y:auto; border-radius:2px; padding:36px 30px 28px; box-shadow:6px 9px 36px rgba(0,0,0,0.45); position:relative; animation:slideUp 0.22s cubic-bezier(0.34,1.4,0.64,1) both; }
      @keyframes slideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
      .modal::before { content:''; position:absolute; top:-11px; left:50%; transform:translateX(-50%); width:18px; height:18px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 8px var(--pin-shadow); }
      .modal-title { font-family:var(--font-ui); font-size:1.3rem; font-weight:700; color:var(--ink); margin-bottom:20px; }
      .modal-close { position:absolute; top:13px; right:15px; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#bbb; }
      .modal-row { display:flex; gap:10px; }
      .modal-row .field { flex:1; }
      .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
      .section-label { font-family:var(--font-ui); font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.09em; color:#aaa; margin-bottom:6px; margin-top:14px; }
      .divider { border:none; border-top:1px dashed #e0d8cc; margin:16px 0; }

      /* ── MIC ── */
      .mic-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:9px 14px; margin-bottom:14px; font-family:var(--font-ui); font-size:0.78rem; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; border:1.5px solid #d4c4a8; border-radius:2px; background:#faf5e8; cursor:pointer; color:var(--ink); transition:all 0.15s; }
      .mic-btn.listening { background:#fee2e2; border-color:#f87171; color:#991b1b; animation:pulse 1s infinite; }
      @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}

      /* ── SWATCHES / FONTS ── */
      .swatch-row { display:flex; gap:8px; margin-top:4px; }
      .swatch { width:28px; height:28px; border-radius:2px; cursor:pointer; border:2px solid rgba(0,0,0,0.12); transition:transform 0.12s,border-color 0.12s,box-shadow 0.12s; }
      .swatch.active { border-color:#333; transform:scale(1.22); box-shadow:0 2px 7px rgba(0,0,0,0.3); }
      .font-picker { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
      .font-chip { padding:5px 13px; border-radius:2px; cursor:pointer; border:1.5px solid transparent; background:rgba(0,0,0,0.06); color:var(--ink); font-size:1rem; transition:all 0.12s; }
      .font-chip.active { background:var(--note-yellow); border-color:#b8930a; }

      /* ── SHARE ── */
      .share-link-box { background:#f5f0e8; border:1.5px dashed #c4a87a; border-radius:2px; padding:10px 13px; font-family:var(--font-ui); font-size:0.78rem; color:var(--ink); word-break:break-all; margin-bottom:10px; }
      .invite-item { font-family:var(--font-ui); font-size:0.8rem; padding:7px 0; border-bottom:1px dashed #e0d8cc; color:#555; display:flex; align-items:center; justify-content:space-between; }

      /* ── SETTINGS ── */
      .settings-section { margin-bottom:24px; }
      .settings-section h3 { font-family:var(--font-ui); font-size:1rem; font-weight:700; color:var(--ink); margin-bottom:12px; padding-bottom:6px; border-bottom:1px dashed #e0d8cc; }
      .theme-options { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
      .theme-chip { padding:8px 16px; border-radius:3px; cursor:pointer; border:2px solid transparent; font-family:var(--font-ui); font-size:0.82rem; font-weight:700; transition:all 0.12s; }
      .theme-chip.active { border-color:#4a6572; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
      .group-card { background:#faf7f2; border:1px solid #e8dfc8; border-radius:3px; padding:12px 14px; margin-bottom:10px; }
      .group-card-title { font-family:var(--font-ui); font-size:0.85rem; font-weight:700; color:var(--ink); margin-bottom:8px; }

      /* ── MISC ── */
      .empty-state { text-align:center; padding:64px 20px; font-family:var(--font-ui); color:${isDark ? "rgba(245,239,224,0.45)" : "rgba(58,42,26,0.45)"}; }
      .empty-state h2 { font-size:1.6rem; font-weight:700; font-style:italic; color:${isDark ? "rgba(245,239,224,0.7)" : "rgba(58,42,26,0.7)"}; margin-bottom:10px; }
      .readonly-banner { background:var(--note-yellow); font-family:var(--font-ui); font-size:0.88rem; font-weight:700; text-align:center; padding:10px; color:var(--ink); }
      .results-count { font-family:var(--font-ui); font-size:0.75rem; font-style:italic; color:${isDark ? "rgba(245,239,224,0.4)" : "rgba(58,42,26,0.4)"}; margin-bottom:12px; }

      @media (max-width:480px) {
        .notes-grid { grid-template-columns:1fr; gap:20px; }
        .topbar-greeting { display:none; }
        .topbar { padding:10px 14px; }
        .wall-area { padding:16px 14px 60px; }
      }
    `}</style>
  );
};

// ── Landing Page ──────────────────────────────────────────────────────────────
const LandingPage = ({ onSignIn, onSignUp }) => (
  <div className="landing">
    <FontLoader theme={{ mode:"dark" }}/>
    <div className="landing-logo">Quotzit</div>
    <div className="landing-tagline">the things people actually say ✦</div>
    <div className="landing-quote-wrap">
      <div className="landing-note">
        <div className="landing-note-text">"A blank wall is a sad wall. Pin your first quote!"</div>
        <div className="landing-note-meta">📍 right here · 📅 today</div>
      </div>
    </div>
    <div className="landing-actions">
      <button className="btn btn-primary" onClick={onSignUp}>Create a free account</button>
      <div className="landing-divider">already have one?</div>
      <button className="btn btn-ghost" onClick={onSignIn}>Sign in</button>
    </div>
  </div>
);

// ── Auth Screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({ initialMode="login", joinInfo, onAuth, onBack }) => {
  const [mode,    setMode]   = useState(initialMode);
  const [name,    setName]   = useState("");
  const [email,   setEmail]  = useState("");
  const [pass,    setPass]   = useState("");
  const [err,     setErr]    = useState("");
  const [loading, setLoading]= useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    if (!email || !pass) { setErr("Please fill in all fields."); setLoading(false); return; }
    try {
      if (mode === "signup") {
        if (!name) { setErr("Please enter your name."); setLoading(false); return; }
        const { data:existing } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).single();
        if (existing) { setErr("That email is already registered."); setLoading(false); return; }
        const { data, error } = await supabase.from("users").insert([{ name, email: email.toLowerCase(), pass }]).select().single();
        if (error) throw error;
        if (joinInfo) await joinGroup(data.id, joinInfo.groupId);
        Session.set(data); onAuth(data, joinInfo?.groupName);
      } else {
        const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).eq("pass", pass).single();
        if (error || !data) { setErr("Email or password is incorrect."); setLoading(false); return; }
        if (joinInfo) await joinGroup(data.id, joinInfo.groupId);
        Session.set(data); onAuth(data, joinInfo?.groupName);
      }
    } catch(e) { setErr("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const joinGroup = async (userId, groupId) => {
    const { data:already } = await supabase.from("group_members").select("user_id").eq("group_id", groupId).eq("user_id", userId).single();
    if (!already) await supabase.from("group_members").insert([{ group_id: groupId, user_id: userId }]);
  };

  return (
    <div className="auth-screen">
      <FontLoader theme={{ mode:"dark" }}/>
      <div className="auth-card">
        {onBack && <button className="btn-cancel" style={{marginBottom:12,fontSize:"0.78rem"}} onClick={onBack}>← back</button>}
        <div className="auth-title">Quotzit</div>
        <div className="auth-sub">{mode==="login" ? "welcome back ✦" : "save the good stuff ✦"}</div>
        {joinInfo && <div className="auth-info">You've been invited to <strong>#{joinInfo.groupName}</strong> — {mode==="signup"?"create an account to join!":"sign in to join!"}</div>}
        {err && <div className="auth-error">{err}</div>}
        {mode === "signup" && (
          <div className="field"><label>your name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="what should we call you?" />
          </div>
        )}
        <div className="field"><label>email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field"><label>password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
            placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>
        <button className="btn btn-primary" style={{width:"100%",fontSize:"1rem",padding:"12px"}}
          onClick={submit} disabled={loading}>
          {loading ? "…" : mode==="login" ? "Sign In" : "Create Account"}
        </button>
        <div className="auth-toggle">
          {mode==="login"
            ? <>No account? <span onClick={()=>setMode("signup")}>sign up free</span></>
            : <>Already have one? <span onClick={()=>setMode("login")}>sign in</span></>}
        </div>
      </div>
    </div>
  );
};

// ── Quote Form ────────────────────────────────────────────────────────────────
const QuoteForm = ({ user, myTags, initial, onSave, onClose }) => {
  const now = new Date();
  const toLocalDate = d => new Date(d).toLocaleDateString("en-CA");
  const toLocalTime = d => new Date(d).toTimeString().slice(0,5);

  const [text,    setText]   = useState(initial?.text    ?? "");
  const [saidBy,  setSaidBy] = useState(initial?.said_by ?? "");
  const [loc,     setLoc]    = useState(initial?.location ?? "");
  const [tag,     setTag]    = useState(initial?.tag      ?? "");
  const [newTag,  setNewTag] = useState("");
  const [showNew, setShowNew]= useState(false);
  const [date,    setDate]   = useState(initial ? toLocalDate(initial.date) : toLocalDate(now));
  const [time,    setTime]   = useState(initial ? toLocalTime(initial.date) : toLocalTime(now));
  const [color,   setColor]  = useState(initial?.color   ?? "note-yellow");
  const [font,    setFont]   = useState(initial?.font    ?? "casual");
  const [saving,  setSaving] = useState(false);

  const { listening, start, stop } = useSpeech(t => setText(p => p ? p + " " + t : t));

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const finalTag = showNew ? newTag.trim() : tag;
    const record = {
      text: text.trim(), said_by: saidBy.trim(), location: loc.trim(),
      tag: finalTag || null, date: new Date(`${date}T${time}`).toISOString(),
      author_id: user.id, author_name: user.name,
      color, font, rotation: initial?.rotation ?? rand(ROTATIONS),
    };
    if (initial?.id) {
      const { data, error } = await supabase.from("quotes").update(record).eq("id", initial.id).select().single();
      if (!error) onSave(data);
    } else {
      const { data, error } = await supabase.from("quotes").insert([record]).select().single();
      if (!error) onSave(data);
      if (finalTag) {
        const { data:existing } = await supabase.from("groups").select("id").eq("name", finalTag).eq("owner_id", user.id).single();
        if (!existing) {
          const { data:grp } = await supabase.from("groups").insert([{ name: finalTag, owner_id: user.id }]).select().single();
          if (grp) await supabase.from("group_members").insert([{ group_id: grp.id, user_id: user.id }]);
        }
      }
    }
    setSaving(false); onClose();
  };

  const selStyle = { width:"100%", fontFamily:"var(--font-hand)", fontSize:"1rem", padding:"9px 12px", border:"1.5px solid #d4c4a8", borderRadius:2, background:"#fffdf5", color:"var(--ink)", outline:"none" };

  return (
    <Portal>
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{initial ? "Edit Quote ✏️" : "Pin a Quote ✦"}</div>
        <button className={`mic-btn ${listening?"listening":""}`} onClick={listening?stop:start}>
          {listening ? "🎙 Listening… tap to stop" : "🎙 Tap to speak the quote"}
        </button>
        <div className="field"><label>the quote</label>
          <textarea value={text} onChange={e=>setText(e.target.value)} style={{fontFamily:FONT_MAP[font]}} placeholder="what was said?" />
        </div>
        <div className="modal-row">
          <div className="field"><label>who said it</label>
            <input value={saidBy} onChange={e=>setSaidBy(e.target.value)} placeholder="name or nickname" />
          </div>
          <div className="field"><label>where</label>
            <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="lake house, kitchen…" />
          </div>
        </div>
        <div className="modal-row">
          <div className="field"><label>date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none",fontFamily:"var(--font-hand)",fontSize:"0.95rem",padding:"8px 10px"}} />
          </div>
          <div className="field"><label>time</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{width:"100%",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none",fontFamily:"var(--font-hand)",fontSize:"0.95rem",padding:"8px 10px"}} />
          </div>
        </div>
        <div className="field"><label>note color</label>
          <div className="swatch-row">
            {COLOR_OPTIONS.map(c=>(
              <div key={c.value} className={`swatch ${color===c.value?"active":""}`} style={{background:c.hex}} onClick={()=>setColor(c.value)} />
            ))}
          </div>
        </div>
        <div className="field"><label>handwriting style</label>
          <div className="font-picker">
            {FONT_OPTIONS.map(f=>(
              <div key={f.value} className={`font-chip ${font===f.value?"active":""}`} style={{fontFamily:f.css}} onClick={()=>setFont(f.value)}>{f.label}</div>
            ))}
          </div>
        </div>
        <div className="field">
          <label>tag <span style={{textTransform:"none",fontWeight:400,fontSize:"0.72rem",color:"#bbb",letterSpacing:0}}>(optional)</span></label>
          {!showNew ? (
            <select value={tag} onChange={e=>{ if(e.target.value==="__new__"){setShowNew(true);setTag("");}else setTag(e.target.value); }} style={selStyle}>
              <option value="">— no tag —</option>
              {myTags.map(t=><option key={t} value={t}>{t}</option>)}
              <option value="__new__">+ create new tag</option>
            </select>
          ) : (
            <>
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="e.g. girls weekend" style={{...selStyle,marginBottom:4}} />
              <span style={{fontFamily:"var(--font-ui)",fontSize:"0.75rem",color:"#999",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setShowNew(false);setNewTag("");}}>← back to existing tags</span>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"saving…":initial?"Save Changes":"Pin it 📌"}</button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// ── Share Modal ───────────────────────────────────────────────────────────────
const ShareModal = ({ tag, user, onClose }) => {
  const [email,   setEmail]  = useState("");
  const [copied,  setCopied] = useState(false);
  const [members, setMembers]= useState([]);
  const [grpId,   setGrpId]  = useState(null);
  const [inviteToken, setInviteToken] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data:grp } = await supabase.from("groups").select("id").eq("name", tag).eq("owner_id", user.id).single();
      if (!grp) return;
      setGrpId(grp.id);
      // get or create invite token
      const { data:existing } = await supabase.from("invite_tokens").select("token").eq("group_id", grp.id).single();
      if (existing) {
        setInviteToken(existing.token);
      } else {
        const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        await supabase.from("invite_tokens").insert([{ token, group_id: grp.id }]);
        setInviteToken(token);
      }
      const { data:mems } = await supabase.from("group_members").select("user_id, users(id,name,email)").eq("group_id", grp.id);
      setMembers(mems || []);
    };
    load();
  }, [tag, user.id]);

  const inviteUrl = inviteToken ? `${window.location.origin}?invite=${inviteToken}` : "";
  const smsBody   = encodeURIComponent(`Psst! Don't forget what we said! Join ${tag} on Quotzit! ${inviteUrl}`);

  const addByEmail = async () => {
    if (!email.trim() || !grpId) return;
    const { data:invitee } = await supabase.from("users").select("*").eq("email", email.trim().toLowerCase()).single();
    if (!invitee) return alert("No Quotzit account found with that email. Send them the invite text to sign up first!");
    const { error } = await supabase.from("group_members").insert([{ group_id: grpId, user_id: invitee.id }]);
    if (error) return alert("They may already be in this group.");
    setMembers(prev => [...prev, { user_id: invitee.id, users: invitee }]);
    setEmail("");
  };

  const removeMember = async (memberId) => {
    if (memberId === user.id) return alert("You can't remove yourself as the owner.");
    await supabase.from("group_members").delete().eq("group_id", grpId).eq("user_id", memberId);
    setMembers(prev => prev.filter(m => m.user_id !== memberId));
  };

  const copy = () => navigator.clipboard.writeText(inviteUrl).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2200); });

  return (
    <Portal>
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share "{tag}"</div>
        <div style={{background:"#fef9e7",border:"1.5px solid #f0d060",borderRadius:3,padding:"14px 16px",marginBottom:18}}>
          <div className="section-label" style={{marginTop:0}}>invite by text</div>
          <div style={{fontFamily:"var(--font-hand)",fontSize:"1rem",color:"var(--ink)",fontStyle:"italic",marginBottom:12}}>
            "Psst! Don't forget what we said! Join {tag} on Quotzit!"
          </div>
          <a href={`sms:?&body=${smsBody}`} style={{textDecoration:"none"}}>
            <button className="btn btn-primary" style={{width:"100%"}}>📱 Send Invite Text</button>
          </a>
          <div style={{fontFamily:"var(--font-ui)",fontSize:"0.7rem",color:"#bbb",marginTop:7,textAlign:"center"}}>link lets them join directly — no manual adding needed</div>
        </div>
        <div className="section-label">add someone with a Quotzit account</div>
        <div style={{display:"flex",gap:8,marginBottom:4}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="their email"
            style={{flex:1,fontFamily:"var(--font-hand)",fontSize:"1rem",padding:"8px 11px",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none"}} />
          <button className="btn btn-primary btn-sm" onClick={addByEmail}>Add</button>
        </div>
        <hr className="divider"/>
        <div className="section-label">current members</div>
        {members.map((m,i) => (
          <div key={i} className="invite-item">
            <span>{m.users?.name} <span style={{color:"#bbb",fontSize:"0.75rem"}}>({m.users?.email})</span></span>
            {m.user_id !== user.id && (
              <button onClick={()=>removeMember(m.user_id)}
                style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:"0.75rem",fontFamily:"var(--font-ui)"}}>
                remove
              </button>
            )}
          </div>
        ))}
        <hr className="divider"/>
        <div className="section-label">invite link</div>
        <div className="share-link-box">{inviteUrl || "generating…"}</div>
        <button className="btn btn-sm" style={{background:"none",border:"1.5px solid #ccc",color:"#777",fontFamily:"var(--font-ui)",cursor:"pointer"}} onClick={copy}>
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// ── Settings Modal ────────────────────────────────────────────────────────────
const SettingsModal = ({ user, theme, onThemeChange, onUserUpdate, onDeleteAccount, onClose }) => {
  const [name,     setName]    = useState(user.name);
  const [email,    setEmail]   = useState(user.email);
  const [pass,     setPass]    = useState("");
  const [newPass,  setNewPass] = useState("");
  const [groups,   setGroups]  = useState([]);
  const [saving,   setSaving]  = useState(false);
  const [msg,      setMsg]     = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data:owned } = await supabase.from("groups").select("id,name").eq("owner_id", user.id);
      const results = [];
      for (const g of (owned||[])) {
        const { data:mems } = await supabase.from("group_members").select("user_id, users(id,name,email)").eq("group_id", g.id);
        results.push({ ...g, members: mems||[] });
      }
      setGroups(results);
    };
    load();
  }, [user.id]);

  const saveProfile = async () => {
    setSaving(true); setMsg("");
    const updates = { name, email: email.toLowerCase() };
    if (newPass) {
      if (!pass) { setMsg("Enter your current password to change it."); setSaving(false); return; }
      const { data:check } = await supabase.from("users").select("id").eq("id", user.id).eq("pass", pass).single();
      if (!check) { setMsg("Current password is incorrect."); setSaving(false); return; }
      updates.pass = newPass;
    }
    const { data, error } = await supabase.from("users").update(updates).eq("id", user.id).select().single();
    if (error) { setMsg("Something went wrong."); setSaving(false); return; }
    Session.set(data); onUserUpdate(data);
    setMsg("Saved!"); setPass(""); setNewPass("");
    setSaving(false);
  };

  const removeMember = async (groupId, memberId) => {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
    setGroups(prev => prev.map(g => g.id===groupId ? {...g, members: g.members.filter(m=>m.user_id!==memberId)} : g));
  };

  const handleBgUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onThemeChange({ ...theme, bg: ev.target.result, mode: theme.mode });
    reader.readAsDataURL(file);
  };

  const clearBg = () => onThemeChange({ ...theme, bg: null });

  return (
    <Portal>
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:500}}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Settings ⚙️</div>

        <div className="settings-section">
          <h3>Your Profile</h3>
          {msg && <div style={{background: msg==="Saved!"?"#d1fae5":"#fee2e2", color: msg==="Saved!"?"#065f46":"#991b1b", borderRadius:2, padding:"7px 11px", fontFamily:"var(--font-ui)", fontSize:"0.82rem", marginBottom:10}}>{msg}</div>}
          <div className="field"><label>name</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="field"><label>email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="field"><label>current password <span style={{fontWeight:400,textTransform:"none"}}>(only if changing password)</span></label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field"><label>new password</label>
            <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="leave blank to keep current" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving?"saving…":"Save Profile"}</button>
        </div>

        <hr className="divider"/>
        <div className="settings-section">
          <h3>Wall Appearance</h3>
          <div className="section-label" style={{marginTop:0}}>theme</div>
          <div className="theme-options">
            <div className={`theme-chip ${theme.mode==="dark"?"active":""}`}
              style={{background:"#2c3e4a",color:"#f5efe0"}} onClick={()=>onThemeChange({...theme,mode:"dark"})}>
              🌙 Dark
            </div>
            <div className={`theme-chip ${theme.mode==="light"?"active":""}`}
              style={{background:"#f0ebe0",color:"#3a2a1a"}} onClick={()=>onThemeChange({...theme,mode:"light"})}>
              ☀️ Light
            </div>
          </div>
          <div className="section-label">custom background photo</div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button className="btn btn-ghost btn-sm" style={{background:"#f0ebe0",color:"var(--ink)",border:"1.5px solid #d4c4a8"}}
              onClick={()=>fileRef.current?.click()}>
              📷 Upload Photo
            </button>
            {theme.bg && <button className="btn btn-sm" style={{background:"#fee2e2",color:"#991b1b",border:"1.5px solid #fca5a5",fontFamily:"var(--font-ui)"}} onClick={clearBg}>Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
          </div>
          {theme.bg && <div style={{marginTop:8,borderRadius:3,overflow:"hidden",maxHeight:100}}><img src={theme.bg} style={{width:"100%",objectFit:"cover",maxHeight:100}}/></div>}
        </div>

        <hr className="divider"/>
        <div className="settings-section">
          <h3>Your Groups</h3>
          {groups.length === 0 && <div style={{fontFamily:"var(--font-ui)",fontSize:"0.85rem",color:"#aaa",fontStyle:"italic"}}>No groups yet — create a tag on a quote to start one.</div>}
          {groups.map(g => (
            <div key={g.id} className="group-card">
              <div className="group-card-title">#{g.name}</div>
              {g.members.map((m,i) => (
                <div key={i} className="invite-item">
                  <span>{m.users?.name} <span style={{color:"#bbb",fontSize:"0.72rem"}}>({m.users?.email})</span></span>
                  {m.user_id !== user.id && (
                    <button onClick={()=>removeMember(g.id, m.user_id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:"0.75rem",fontFamily:"var(--font-ui)"}}>
                      remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <hr className="divider"/>
        <div className="settings-section">
          <h3>Danger Zone</h3>
          <button className="btn btn-danger btn-sm" onClick={()=>{
            if (window.confirm("Delete your account? This cannot be undone.")) onDeleteAccount();
          }}>Delete My Account</button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// ── Sticky Note ───────────────────────────────────────────────────────────────
const StickyNote = ({ quote, canEdit, canDelete, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const fontCss = FONT_MAP[quote.font] || "var(--font-hand)";

  return (
    <div className={`sticky ${quote.color||"note-yellow"}`}
      style={{"--rot":`${quote.rotation||0}deg`, transform:`rotate(${quote.rotation||0}deg)`}}>
      <div className="sticky-actions">
        {canEdit   && <button className="icon-btn" onClick={()=>onEdit(quote)}>✏️</button>}
        {canDelete && <button className="icon-btn" onClick={()=>onDelete(quote.id)}>🗑</button>}
      </div>
      <div className="sticky-quote" style={{fontFamily:fontCss}}>"{quote.text}"</div>
      <button className="sticky-toggle" onClick={()=>setOpen(o=>!o)}>
        <span className={`s-arrow ${open?"open":""}`}>▼</span>
        <span>{open ? "hide details" : "show details"}</span>
      </button>
      {open && (
        <div className="sticky-meta">
          {quote.said_by  && <div className="meta-row">👤 {quote.said_by}</div>}
          {quote.location && <div className="meta-row">📍 {quote.location}</div>}
          <div className="meta-row">📅 {fmtDate(quote.date)} at {fmtTime(quote.date)}</div>
          {quote.author_name && <div className="meta-row" style={{color:"#999",fontSize:"0.68rem"}}>added by {quote.author_name}</div>}
          {quote.tag && <div><div className="sticky-tag">#{quote.tag}</div></div>}
        </div>
      )}
      {!open && quote.tag && <div className="sticky-tag">#{quote.tag}</div>}
    </div>
  );
};

// ── Read-Only Wall ────────────────────────────────────────────────────────────
const ReadOnlyWall = ({ shareParam }) => {
  const [quotes, setQuotes] = useState([]);
  const [tag,    setTag]    = useState("");
  useEffect(() => {
    try {
      const [t] = atob(shareParam).split("::");
      setTag(t);
      supabase.from("quotes").select("*").eq("tag", t).order("date", {ascending:false}).then(({data})=>setQuotes(data||[]));
    } catch { setQuotes([]); }
  }, []);
  return (
    <div className="app-wrapper">
      <FontLoader theme={{mode:"dark"}}/>
      <div className="readonly-banner">👀 Read-only view of <strong>#{tag}</strong></div>
      <div style={{padding:"24px 20px 60px",maxWidth:1100,margin:"0 auto"}}>
        <div className="notes-grid">
          {quotes.map(q=><StickyNote key={q.id} quote={q} canEdit={false} canDelete={false} onEdit={()=>{}} onDelete={()=>{}}/>)}
        </div>
        {!quotes.length && <div className="empty-state"><h2>Nothing pinned yet</h2></div>}
      </div>
    </div>
  );
};

// ── Invite Landing ────────────────────────────────────────────────────────────
const InviteLanding = ({ token }) => {
  const [joinInfo, setJoinInfo] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [screen,   setScreen]   = useState("choice"); // choice | login | signup

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("invite_tokens").select("group_id, groups(name)").eq("token", token).single();
      if (data) setJoinInfo({ groupId: data.group_id, groupName: data.groups?.name });
      setLoading(false);
    };
    load();
  }, [token]);

  const handleAuth = (user, groupName) => {
    // clear invite param and reload into the app, landing on that group's wall
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    url.searchParams.set("wall", groupName || "");
    window.location.replace(url.toString());
  };

  if (loading) return <div className="loading"><FontLoader theme={{mode:"dark"}}/>Loading invite…</div>;
  if (!joinInfo) return <div className="loading"><FontLoader theme={{mode:"dark"}}/>Invalid or expired invite link.</div>;

  if (screen === "login")  return <AuthScreen initialMode="login"  joinInfo={joinInfo} onAuth={handleAuth} onBack={()=>setScreen("choice")}/>;
  if (screen === "signup") return <AuthScreen initialMode="signup" joinInfo={joinInfo} onAuth={handleAuth} onBack={()=>setScreen("choice")}/>;

  return (
    <div className="landing">
      <FontLoader theme={{mode:"dark"}}/>
      <div className="landing-logo">Quotzit</div>
      <div className="landing-tagline">you've been invited ✦</div>
      <div className="landing-quote-wrap">
        <div className="landing-note">
          <div className="landing-note-text">"Psst! Don't forget what we said!"</div>
          <div className="landing-note-meta">Join <strong>#{joinInfo.groupName}</strong> on Quotzit</div>
        </div>
      </div>
      <div className="landing-actions">
        <button className="btn btn-primary" onClick={()=>setScreen("signup")}>Create an account to join</button>
        <div className="landing-divider">already have one?</div>
        <button className="btn btn-ghost" onClick={()=>setScreen("login")}>Sign in to join</button>
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Quotzit() {
  const params     = new URLSearchParams(window.location.search);
  const shareParam = params.get("share");
  const inviteToken= params.get("invite");
  const wallParam  = params.get("wall");

  if (shareParam)  return <ReadOnlyWall shareParam={shareParam}/>;
  if (inviteToken) return <InviteLanding token={inviteToken}/>;

  const [user,       setUser]      = useState(Session.get);
  const [screen,     setScreen]    = useState(user ? "wall" : "landing"); // landing | login | signup | wall
  const [quotes,     setQuotes]    = useState([]);
  const [myTags,     setMyTags]    = useState([]);
  const [activeTag,  setActive]    = useState(wallParam || null);
  const [filterWho,  setFilterWho] = useState("");
  const [filterWhere,setFilterWhere]=useState("");
  const [search,     setSearch]    = useState("");
  const [showAdd,    setShowAdd]   = useState(false);
  const [editQ,      setEditQ]     = useState(null);
  const [shareTag,   setShare]     = useState(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [loading,    setLoading]   = useState(false);
  const [theme,      setTheme]     = useState(ThemeStore.get);

  const handleThemeChange = t => { setTheme(t); ThemeStore.set(t); };

  const loadQuotes = async (u) => {
    setLoading(true);
    const { data:memberships } = await supabase.from("group_members").select("group_id, groups(name)").eq("user_id", u.id);
    const groupNames = (memberships||[]).map(m=>m.groups?.name).filter(Boolean);
    let q = [];
    const { data:own } = await supabase.from("quotes").select("*").eq("author_id", u.id).order("date", {ascending:false});
    q = [...(own||[])];
    if (groupNames.length) {
      const { data:shared } = await supabase.from("quotes").select("*").in("tag", groupNames).neq("author_id", u.id).order("date", {ascending:false});
      q = [...q, ...(shared||[])];
    }
    const seen = new Set();
    q = q.filter(x=>{ if(seen.has(x.id)) return false; seen.add(x.id); return true; });
    q.sort((a,b)=>new Date(b.date)-new Date(a.date));
    setQuotes(q);
    setMyTags([...new Set(q.map(x=>x.tag).filter(Boolean))]);
    setLoading(false);
  };

  useEffect(() => { if (user) loadQuotes(user); }, [user]);

  // clear wall param from URL after using it
  useEffect(() => {
    if (wallParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("wall");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleAuth = (u) => { setUser(u); setScreen("wall"); };

  const saveQuote = q => {
    setQuotes(prev => {
      const existing = prev.find(x=>x.id===q.id);
      return existing ? prev.map(x=>x.id===q.id?q:x) : [q,...prev];
    });
    setMyTags(prev=>[...new Set([...prev,q.tag].filter(Boolean))]);
  };

  const deleteQuote = async id => {
    await supabase.from("quotes").delete().eq("id", id);
    setQuotes(prev=>prev.filter(q=>q.id!==id));
  };

  const deleteAccount = async () => {
    await supabase.from("group_members").delete().eq("user_id", user.id);
    await supabase.from("quotes").delete().eq("author_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);
    Session.clear(); setUser(null); setScreen("landing");
  };

  const logout = () => { Session.clear(); setUser(null); setScreen("landing"); setQuotes([]); setMyTags([]); };

  // unique filter options
  const whoOptions   = [...new Set(quotes.map(q=>q.said_by).filter(Boolean))].sort();
  const whereOptions = [...new Set(quotes.map(q=>q.location).filter(Boolean))].sort();

  // apply all filters
  const visibleQuotes = quotes.filter(q => {
    if (activeTag   && q.tag      !== activeTag)   return false;
    if (filterWho   && q.said_by  !== filterWho)   return false;
    if (filterWhere && q.location !== filterWhere) return false;
    if (search) {
      const s = search.toLowerCase();
      const haystack = [q.text, q.said_by, q.location, q.tag].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    return true;
  });

  const hasFilters = activeTag || filterWho || filterWhere || search;
  const clearFilters = () => { setActive(null); setFilterWho(""); setFilterWhere(""); setSearch(""); };

  // ── Screens ──
  if (screen === "landing") return <LandingPage onSignIn={()=>setScreen("login")} onSignUp={()=>setScreen("signup")}/>;
  if (screen === "login")   return <AuthScreen initialMode="login"  onAuth={handleAuth} onBack={()=>setScreen("landing")}/>;
  if (screen === "signup")  return <AuthScreen initialMode="signup" onAuth={handleAuth} onBack={()=>setScreen("landing")}/>;

  return (
    <div className={`app-wrapper ${theme.bg?"has-bg":""}`}>
      <FontLoader theme={theme}/>

      <div className="topbar">
        <div className="topbar-logo" onClick={()=>{setActive(null);clearFilters();}}>Quotzit</div>
        <div className="topbar-right">
          <span className="topbar-greeting">hey, {user.name}</span>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Pin Quote</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowSettings(true)}>⚙️</button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="wall-area">
        <div className="wall-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="wall-title">
              {activeTag ? <><em>#</em>{activeTag}</> : <>The Wall <em>✦</em></>}
            </div>
            <button className="btn btn-ghost btn-sm"
              onClick={()=>{ activeTag ? setShare(activeTag) : setShowGroupPicker(true); }}
              style={{WebkitTapHighlightColor:"transparent"}}>
              Share
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search quotes, people, places…"/>
          {search && <button className="search-clear" onClick={()=>setSearch("")}>✕</button>}
        </div>

        {/* Filters */}
        <div className="filter-row">
          <span className="filter-label">Filter:</span>
          {myTags.length > 0 && (
            <select className="filter-select" value={activeTag||""} onChange={e=>setActive(e.target.value||null)}>
              <option value="">All tags</option>
              {myTags.map(t=><option key={t} value={t}>#{t}</option>)}
            </select>
          )}
          {whoOptions.length > 0 && (
            <select className="filter-select" value={filterWho} onChange={e=>setFilterWho(e.target.value)}>
              <option value="">Anyone</option>
              {whoOptions.map(w=><option key={w} value={w}>{w}</option>)}
            </select>
          )}
          {whereOptions.length > 0 && (
            <select className="filter-select" value={filterWhere} onChange={e=>setFilterWhere(e.target.value)}>
              <option value="">Anywhere</option>
              {whereOptions.map(w=><option key={w} value={w}>{w}</option>)}
            </select>
          )}
          {hasFilters && <button className="filter-clear" onClick={clearFilters}>clear all</button>}
        </div>

        {visibleQuotes.length > 0 && quotes.length > 0 && (
          <div className="results-count">{visibleQuotes.length} of {quotes.length} quotes</div>
        )}

        {loading ? (
          <div className="empty-state"><h2>loading your wall…</h2></div>
        ) : visibleQuotes.length === 0 ? (
          <div className="empty-state">
            <h2>{hasFilters ? "No quotes match those filters" : "Nothing pinned yet"}</h2>
            <p>{hasFilters ? <button className="filter-clear" onClick={clearFilters} style={{fontSize:"0.9rem"}}>clear filters</button> : 'hit "+ Pin Quote" up top to save your first one'}</p>
          </div>
        ) : (
          <div className="notes-grid">
            {visibleQuotes.map(q=>(
              <StickyNote key={q.id} quote={q}
                canEdit={q.author_id===user.id}
                canDelete={q.author_id===user.id}
                onEdit={setEditQ} onDelete={deleteQuote}/>
            ))}
          </div>
        )}
      </div>

      {(showAdd || editQ) && (
        <QuoteForm user={user} myTags={myTags} initial={editQ||null}
          onSave={saveQuote} onClose={()=>{setShowAdd(false);setEditQ(null);}}/>
      )}
      {shareTag && <ShareModal tag={shareTag} user={user} onClose={()=>setShare(null)}/>}
      {showGroupPicker && (
        <Portal>
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowGroupPicker(false)}>
          <div className="modal" style={{maxWidth:340}}>
            <button className="modal-close" onClick={()=>setShowGroupPicker(false)}>✕</button>
            <div className="modal-title" style={{marginBottom:16}}>Which wall?</div>
            {myTags.length === 0 ? (
              <div style={{fontFamily:"var(--font-ui)",fontSize:"0.9rem",color:"#aaa",fontStyle:"italic",textAlign:"center",padding:"20px 0"}}>
                No groups yet — tag a quote to create one!
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {myTags.map(t=>(
                  <button key={t} className="btn btn-ghost" style={{textAlign:"left",justifyContent:"flex-start",color:"var(--ink)",background:"#faf7f2",border:"1.5px solid #e8dfc8",fontFamily:"var(--font-ui)",fontSize:"0.92rem"}}
                    onClick={()=>{ setShowGroupPicker(false); setShare(t); }}>
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </Portal>
      )}
      {showSettings && (
        <SettingsModal user={user} theme={theme}
          onThemeChange={handleThemeChange}
          onUserUpdate={u=>{ setUser(u); Session.set(u); }}
          onDeleteAccount={deleteAccount}
          onClose={()=>setShowSettings(false)}/>
      )}
    </div>
  );
}
