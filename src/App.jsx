// Quotzit v3.0 — invite flow, settings, filters, search, landing page, themes
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// 25002500 Portal 2014 renders modals directly on body so iOS fixed positioning works 2500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
const Portal = ({ children }) => createPortal(children, document.body);
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtDate = iso => new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
const ROTATIONS = [-3,-2,-1,0,1,2,3];
const visIcon = w => w?.visibility === "public_unlisted" ? "🌐" : "🔒";

const FONT_OPTIONS = [
  { label:"Caveat",  value:"caveat",  css:"'Caveat', cursive" },
  { label:"Kalam",   value:"kalam",   css:"'Kalam', cursive" },
  { label:"Shadows", value:"shadows", css:"'Shadows Into Light', cursive" },
];
const FONT_MAP = Object.fromEntries(FONT_OPTIONS.map(f=>[f.value,f.css]));

const COLOR_OPTIONS = [
  { value:"marker-black", hex:"#1F1F1F" },
  { value:"marker-blue",  hex:"#2563AC" },
  { value:"marker-red",   hex:"#D6432A" },
  { value:"marker-green", hex:"#2F9E44" },
];
const COLOR_MAP = Object.fromEntries(COLOR_OPTIONS.map(c=>[c.value,c.hex]));
const randFontSize = () => 22 + Math.floor(Math.random()*13);

const REACTION_EMOJIS = ["❤️","😂","😮","👏","😢"];

// ── Session ───────────────────────────────────────────────────────────────────
const Session = {
  get:   () => { try { return JSON.parse(sessionStorage.getItem("qz_user")); } catch { return null; } },
  set:   u  => sessionStorage.setItem("qz_user", JSON.stringify(u)),
  clear: () => sessionStorage.removeItem("qz_user"),
};

// ── Speech ────────────────────────────────────────────────────────────────────
const SPEECH_ERROR_MESSAGES = {
  "not-allowed":     "Microphone access is blocked for this site. Check your browser's site settings (not just the OS-level mic toggle) and allow microphone access for quotzit.com.",
  "service-not-allowed": "Microphone access is blocked for this site. Check your browser's site settings and allow microphone access for quotzit.com.",
  "no-speech":        "Didn't catch any speech — try again and speak right after tapping.",
  "audio-capture":    "No microphone found. Check that one is connected and not in use by another app.",
  "network":          "Speech recognition needs an internet connection — check yours and try again.",
  "aborted":           null, // user-initiated stop, not an error worth showing
};

const useSpeech = onResult => {
  const recRef = useRef(null);
  const transcriptRef = useRef("");
  const [listening, setListening] = useState(false);
  const [error,     setError]     = useState("");
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const start = () => {
    setError("");
    if (!supported) { setError("Speech recognition isn't supported in this browser — try Chrome."); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    // iOS (Safari, and Chrome-on-iOS since it also runs on WebKit) often never fires a
    // "final" result — only interim ones. Accumulate whatever comes through as we go and
    // deliver it on end, rather than waiting for a final result that may never arrive.
    rec.interimResults = true;
    rec.continuous = true;
    transcriptRef.current = "";
    rec.onresult = e => {
      let combined = "";
      for (let i = 0; i < e.results.length; i++) combined += e.results[i][0].transcript;
      transcriptRef.current = combined.trim();
    };
    rec.onerror = e => {
      const msg = SPEECH_ERROR_MESSAGES[e.error];
      if (msg !== undefined) setError(msg || "");
      else setError(`Speech recognition error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      if (transcriptRef.current) onResult(transcriptRef.current);
    };
    recRef.current = rec; rec.start(); setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };
  return { listening, start, stop, error };
};

// ── Global Styles ─────────────────────────────────────────────────────────────
const FontLoader = () => {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Caveat:wght@400;600;700&family=Kalam:wght@400;700&family=Shadows+Into+Light&family=Permanent+Marker&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #FAFAF6; }
      :root {
        --surface:      #FAFAF6;
        --card:         #FFFFFF;
        --topbar-bg:    rgba(255,255,255,0.88);
        --topbar-border: rgba(0,0,0,0.08);
        --ink-black:    #1F1F1F;
        --ink-blue:     #2563AC;
        --ink-red:      #D6432A;
        --ink-green:    #2F9E44;
        --attribution:  #6B6B68;
        --pin-red:      #cc3333;
        --pin-shadow:   rgba(0,0,0,0.35);
        --ink:          #1F1F1F;
        --ink-faded:    #6B6B68;
        --font-ui:      'Inter', sans-serif;
        --font-hand:    'Caveat', cursive;
        --font-marker:  'Permanent Marker', cursive;
      }

      .app-wrapper {
        min-height: 100vh;
        background-color: var(--surface);
        background-image:
          radial-gradient(ellipse 320px 130px at 12% 18%, rgba(0,0,0,0.035), transparent 70%),
          radial-gradient(ellipse 220px 90px at 82% 12%, rgba(0,0,0,0.03), transparent 70%),
          radial-gradient(ellipse 260px 140px at 72% 55%, rgba(0,0,0,0.025), transparent 70%),
          radial-gradient(ellipse 200px 100px at 8% 72%, rgba(0,0,0,0.03), transparent 70%),
          radial-gradient(ellipse 260px 110px at 42% 92%, rgba(0,0,0,0.025), transparent 70%),
          radial-gradient(ellipse 180px 80px at 95% 80%, rgba(0,0,0,0.03), transparent 70%);
        background-attachment: fixed;
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
      .topbar-logo { font-family: var(--font-marker); font-size: 1.7rem; color: var(--ink-black); letter-spacing: 1px; cursor: pointer; }
      .topbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .topbar-greeting { font-family: var(--font-ui); font-size: 0.85rem; color: var(--attribution); white-space: nowrap; }

      .btn { font-family: var(--font-ui); font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer; border-radius: 4px; padding: 8px 16px; transition: transform 0.12s, opacity 0.12s; }
      .btn:hover  { transform: translateY(-1px); opacity: 0.9; }
      .btn:active { transform: translateY(1px); }
      .btn-primary { background: var(--ink-black); color: #fff; }
      .btn-ghost   { background: transparent; color: var(--ink-black); border: 1.5px solid rgba(0,0,0,0.18); }
      .btn-danger  { background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5; }
      .btn-sm      { font-size: 0.76rem; padding: 5px 11px; }
      .btn-cancel  { background: none; border: 1.5px solid #ddd; color: #999; font-family: var(--font-ui); font-size: 0.85rem; cursor: pointer; padding: 8px 16px; border-radius: 4px; }
      .icon-only   { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; line-height: 1; }

      /* ── LANDING ── */
      .landing { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background-color: var(--surface); }
      .landing-logo { font-family: var(--font-marker); font-size: 3.6rem; color: var(--ink-black); margin-bottom: 6px; }
      .landing-tagline { font-family: var(--font-ui); font-size: 1rem; color: var(--attribution); margin-bottom: 48px; text-align: center; }
      .landing-quote-wrap { position: relative; margin-bottom: 48px; }
      .landing-note { background: var(--card); border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; padding: 28px 32px 22px; max-width: 380px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); position: relative; }
      .landing-note-text { font-family: 'Caveat', cursive; font-size: 1.6rem; color: var(--ink-blue); line-height: 1.4; margin-bottom: 10px; }
      .landing-note-meta { font-family: var(--font-ui); font-size: 0.78rem; color: var(--attribution); }
      .landing-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 320px; }
      .landing-actions .btn { width: 100%; text-align: center; font-size: 1rem; padding: 14px; }
      .landing-divider { font-family: var(--font-ui); color: var(--attribution); font-size: 0.85rem; }

      /* ── AUTH ── */
      .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--surface); padding: 20px; }
      .auth-card { background: var(--card); border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; padding: 44px 38px 36px; width: 370px; max-width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
      .auth-title { font-family:var(--font-marker); font-size:2.4rem; color:var(--ink-black); text-align:center; margin-bottom:3px; }
      .auth-sub   { font-family:var(--font-ui); font-size:0.92rem; color:var(--ink-faded); text-align:center; margin-bottom:28px; }
      .auth-error { background:#fee2e2; color:#991b1b; border-radius:4px; padding:8px 12px; font-family:var(--font-ui); font-size:0.85rem; margin-bottom:14px; }
      .auth-info  { background:#e0f2fe; color:#0369a1; border-radius:4px; padding:8px 12px; font-family:var(--font-ui); font-size:0.85rem; margin-bottom:14px; }
      .auth-toggle { text-align:center; margin-top:14px; font-family:var(--font-ui); font-size:0.88rem; color:var(--ink-faded); }
      .auth-toggle span { color:var(--ink-blue); cursor:pointer; text-decoration:underline; }

      /* ── FIELDS ── */
      .field { margin-bottom: 14px; }
      .field label { display:block; font-family:var(--font-ui); font-size:0.72rem; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-faded); margin-bottom:5px; }
      .field input, .field select, .field textarea { width:100%; font-family:var(--font-ui); font-size:0.95rem; padding:9px 12px; border:1.5px solid #ddd; border-radius:4px; background:#fff; color:var(--ink); outline:none; transition:border-color 0.15s; }
      .field input:focus, .field select:focus, .field textarea:focus { border-color:var(--ink-blue); }
      .field textarea { resize:vertical; min-height:80px; }

      /* ── WALL ── */
      .wall-area { padding: 24px 20px 60px; max-width: 1100px; margin: 0 auto; }
      .wall-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
      .wall-title { font-family:var(--font-ui); font-size:1.4rem; font-weight:700; color:var(--ink-black); }
      .wall-title em { font-style:normal; font-weight:400; color:var(--attribution); }

      /* ── SEARCH ── */
      .search-bar { position: relative; margin-bottom: 14px; }
      .search-bar input { width:100%; font-family:var(--font-ui); font-size:0.9rem; padding:10px 16px 10px 40px; border-radius:6px; border:1.5px solid rgba(0,0,0,0.12); background:#fff; color:var(--ink-black); outline:none; }
      .search-bar input::placeholder { color:#aaa; }
      .search-bar input:focus { border-color:var(--ink-blue); }
      .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:0.9rem; pointer-events:none; opacity:0.5; }
      .search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:0.9rem; opacity:0.5; }

      /* ── FILTERS ── */
      .filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; align-items:center; }
      .filter-label { font-family:var(--font-ui); font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--attribution); }
      .filter-select { font-family:var(--font-ui); font-size:0.78rem; padding:5px 10px; border-radius:20px; border:1.5px solid rgba(0,0,0,0.15); background:#fff; color:var(--ink-black); outline:none; cursor:pointer; }
      .filter-clear { font-family:var(--font-ui); font-size:0.72rem; color:var(--attribution); cursor:pointer; text-decoration:underline; background:none; border:none; padding:0; }

      /* ── NOTES GRID ── */
      .notes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:26px; }

      /* ── STICKY NOTE ── */
      .sticky { position:relative; background:var(--card); border:1px solid rgba(0,0,0,0.07); padding:20px 16px 14px; border-radius:3px; box-shadow:0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05); transition:transform 0.2s, box-shadow 0.2s; animation:pinDrop 0.3s cubic-bezier(0.34,1.5,0.64,1) both; }
      @keyframes pinDrop { from{opacity:0;transform:translateY(-14px) rotate(var(--rot,0deg))} to{opacity:1;transform:translateY(0) rotate(var(--rot,0deg))} }
      .sticky:hover { transform:rotate(0deg) translateY(-4px) scale(1.02)!important; box-shadow:0 8px 20px rgba(0,0,0,0.12); z-index:10; }
      .sticky::before { content:''; position:absolute; top:-9px; left:50%; transform:translateX(-50%); width:13px; height:13px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 2px 5px var(--pin-shadow); z-index:2; }
      .sticky-actions { position:absolute; top:7px; right:8px; display:flex; gap:3px; opacity:0; transition:opacity 0.15s; }
      .sticky:hover .sticky-actions, .touch-visible { opacity:1!important; }
      @media (hover:none) { .sticky-actions{opacity:1} }
      .icon-btn { background:rgba(0,0,0,0.06); border:none; border-radius:3px; width:24px; height:24px; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; justify-content:center; }
      .icon-btn:hover { background:rgba(0,0,0,0.14); }
      .sticky-quote { font-weight:600; line-height:1.4; margin-bottom:10px; word-break:break-word; }
      .sticky-quote::before { content:'\\201C'; }
      .sticky-quote::after  { content:'\\201D'; }
      .sticky-toggle { display:flex; align-items:center; justify-content:center; width:30px; height:30px; margin-top:6px; margin-left:-4px; cursor:pointer; user-select:none; border:none; background:rgba(0,0,0,0.06); border-radius:50%; padding:0; color:var(--attribution); }
      .sticky-toggle:hover { color:var(--ink-black); background:rgba(0,0,0,0.12); }
      .s-arrow { font-size:1rem; line-height:1; font-weight:700; transition:transform 0.18s; display:inline-block; }
      .s-arrow.open { transform:rotate(180deg); }
      .sticky-meta { font-family:var(--font-ui); font-size:0.74rem; color:var(--attribution); margin-top:8px; display:flex; flex-direction:column; gap:4px; border-top:1px dashed rgba(0,0,0,0.1); padding-top:8px; }
      .meta-row { display:flex; align-items:center; gap:5px; }

      /* ── REACTIONS ── */
      .reaction-row { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
      .reaction-chip { background:rgba(0,0,0,0.05); border:1.5px solid transparent; border-radius:14px; padding:3px 9px; font-size:0.85rem; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.12s; }
      .reaction-chip:hover { background:rgba(0,0,0,0.1); }
      .reaction-chip.active { background:rgba(37,98,172,0.1); border-color:var(--ink-blue); }
      .reaction-count { font-family:var(--font-ui); font-size:0.68rem; font-weight:700; color:var(--attribution); }

      /* ── MODAL ── */
      .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:flex-start; justify-content:center; z-index:9999; animation:fadeIn 0.15s ease; padding:60px 16px 40px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .modal { background:#fff; width:460px; max-width:100%; max-height:90vh; overflow-y:auto; border-radius:6px; padding:36px 30px 28px; box-shadow:0 12px 40px rgba(0,0,0,0.22); position:relative; animation:slideUp 0.22s cubic-bezier(0.34,1.4,0.64,1) both; }
      @keyframes slideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
      .modal-title { font-family:var(--font-ui); font-size:1.25rem; font-weight:700; color:var(--ink-black); margin-bottom:20px; }
      .modal-close { position:absolute; top:13px; right:15px; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#bbb; }
      .modal-row { display:flex; gap:10px; }
      .modal-row .field { flex:1; }
      .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
      .section-label { font-family:var(--font-ui); font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.07em; color:#aaa; margin-bottom:6px; margin-top:14px; }
      .divider { border:none; border-top:1px dashed #e5e5e5; margin:16px 0; }

      /* ── MIC ── */
      .mic-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:9px 14px; margin-bottom:14px; font-family:var(--font-ui); font-size:0.78rem; font-weight:600; text-transform:uppercase; border:1.5px solid #ddd; border-radius:4px; background:#f7f7f5; cursor:pointer; color:var(--ink-black); transition:all 0.15s; }
      .mic-btn.listening { background:#fee2e2; border-color:#f87171; color:#991b1b; animation:pulse 1s infinite; }
      @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}

      /* ── SWATCHES / FONTS ── */
      .swatch-row { display:flex; gap:8px; margin-top:4px; }
      .swatch { width:28px; height:28px; border-radius:50%; cursor:pointer; border:2px solid rgba(0,0,0,0.12); transition:transform 0.12s,border-color 0.12s,box-shadow 0.12s; }
      .swatch.active { border-color:var(--ink-black); transform:scale(1.2); box-shadow:0 2px 6px rgba(0,0,0,0.25); }
      .font-picker { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
      .font-chip { padding:5px 13px; border-radius:4px; cursor:pointer; border:1.5px solid transparent; background:rgba(0,0,0,0.05); color:var(--ink-black); font-size:1rem; transition:all 0.12s; }
      .font-chip.active { background:rgba(31,31,31,0.08); border-color:var(--ink-black); }

      /* ── SHARE ── */
      .share-link-box { background:#f5f5f3; border:1.5px dashed #ccc; border-radius:4px; padding:10px 13px; font-family:var(--font-ui); font-size:0.78rem; color:var(--ink-black); word-break:break-all; margin-bottom:10px; }
      .invite-item { font-family:var(--font-ui); font-size:0.8rem; padding:7px 0; border-bottom:1px dashed #e5e5e5; color:#555; display:flex; align-items:center; justify-content:space-between; }

      /* ── SETTINGS ── */
      .settings-section { margin-bottom:24px; }
      .settings-section h3 { font-family:var(--font-ui); font-size:1rem; font-weight:700; color:var(--ink-black); margin-bottom:12px; padding-bottom:6px; border-bottom:1px dashed #e5e5e5; }
      .group-card { background:#f7f7f5; border:1px solid #e5e5e2; border-radius:4px; padding:12px 14px; margin-bottom:10px; }
      .group-card-title { font-family:var(--font-ui); font-size:0.85rem; font-weight:700; color:var(--ink-black); margin-bottom:8px; }

      /* ── MISC ── */
      .empty-state { text-align:center; padding:64px 20px; font-family:var(--font-ui); color:var(--attribution); }
      .empty-state h2 { font-size:1.4rem; font-weight:700; color:var(--ink-black); margin-bottom:10px; }
      .readonly-banner { background:#efefea; border-bottom:1px solid rgba(0,0,0,0.08); font-family:var(--font-ui); font-size:0.88rem; font-weight:600; text-align:center; padding:10px; color:var(--ink-black); }
      .results-count { font-family:var(--font-ui); font-size:0.75rem; color:var(--attribution); margin-bottom:12px; }

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
    <FontLoader/>
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
        const { data:wall } = await supabase.from("walls").insert([{ name: "My Wall", owner_id: data.id, is_personal: true }]).select().single();
        if (wall) await supabase.from("wall_members").insert([{ wall_id: wall.id, user_id: data.id }]);
        if (joinInfo) await joinWall(data.id, joinInfo.wallId);
        Session.set(data); onAuth(data, joinInfo?.wallId);
      } else {
        const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).eq("pass", pass).single();
        if (error || !data) { setErr("Email or password is incorrect."); setLoading(false); return; }
        if (joinInfo) await joinWall(data.id, joinInfo.wallId);
        Session.set(data); onAuth(data, joinInfo?.wallId);
      }
    } catch(e) { setErr("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const joinWall = async (userId, wallId) => {
    const { data:already } = await supabase.from("wall_members").select("user_id").eq("wall_id", wallId).eq("user_id", userId).single();
    if (!already) await supabase.from("wall_members").insert([{ wall_id: wallId, user_id: userId }]);
  };

  return (
    <div className="auth-screen">
      <FontLoader/>
      <div className="auth-card">
        {onBack && <button className="btn-cancel" style={{marginBottom:12,fontSize:"0.78rem"}} onClick={onBack}>← back</button>}
        <div className="auth-title">Quotzit</div>
        <div className="auth-sub">{mode==="login" ? "welcome back ✦" : "save the good stuff ✦"}</div>
        {joinInfo && <div className="auth-info">You've been invited to <strong>{joinInfo.wallName}</strong> — {mode==="signup"?"create an account to join!":"sign in to join!"}</div>}
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
const QuoteForm = ({ user, myWalls, initial, onSave, onNewWall, onClose }) => {
  const now = new Date();
  const toLocalDate = d => new Date(d).toLocaleDateString("en-CA");
  const toLocalTime = d => new Date(d).toTimeString().slice(0,5);

  const [text,    setText]   = useState(initial?.text    ?? "");
  const [saidBy,  setSaidBy] = useState(initial?.said_by ?? "");
  const [loc,     setLoc]    = useState(initial?.location ?? "");
  const [wallId,  setWallId] = useState(initial?.wall_id ?? myWalls[0]?.id ?? "");
  const [newWallName, setNewWallName] = useState("");
  const [showNew, setShowNew]= useState(myWalls.length === 0);
  const [date,    setDate]   = useState(initial ? toLocalDate(initial.date) : toLocalDate(now));
  const [time,    setTime]   = useState(initial ? toLocalTime(initial.date) : toLocalTime(now));
  const [color,   setColor]  = useState(initial?.color   ?? "marker-black");
  const [font,    setFont]   = useState(initial?.font    ?? "caveat");
  const [saving,  setSaving] = useState(false);

  const { listening, start, stop, error:speechError } = useSpeech(t => setText(p => p ? p + " " + t : t));

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    let finalWallId = wallId;
    if (showNew) {
      const name = newWallName.trim();
      if (!name) { setSaving(false); return; }
      const { data:wall, error:wallErr } = await supabase.from("walls").insert([{ name, owner_id: user.id }]).select().single();
      if (wallErr || !wall) { setSaving(false); return; }
      await supabase.from("wall_members").insert([{ wall_id: wall.id, user_id: user.id }]);
      finalWallId = wall.id;
      onNewWall(wall);
    }
    const [y, mo, d]  = date.split("-").map(Number);
    const [h, mi]     = time.split(":").map(Number);
    const localDate   = new Date(y, mo - 1, d, h, mi);
    const record = {
      text: text.trim(), said_by: saidBy.trim(), location: loc.trim(),
      wall_id: finalWallId || null, date: localDate.toISOString(),
      author_id: user.id, author_name: user.name,
      color, font, rotation: initial?.rotation ?? rand(ROTATIONS),
      font_size: initial?.font_size ?? randFontSize(),
    };
    if (initial?.id) {
      const { data, error } = await supabase.from("quotes").update(record).eq("id", initial.id).select().single();
      if (!error) onSave(data);
    } else {
      const { data, error } = await supabase.from("quotes").insert([record]).select().single();
      if (!error) onSave(data);
    }
    setSaving(false); onClose();
  };

  const selStyle = { width:"100%", fontFamily:"var(--font-ui)", fontSize:"0.95rem", padding:"9px 12px", border:"1.5px solid #ddd", borderRadius:4, background:"#fff", color:"var(--ink)", outline:"none" };

  return (
    <Portal>
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{initial ? "Edit Quote ✏️" : "Pin a Quote ✦"}</div>
        <button className={`mic-btn ${listening?"listening":""}`} onClick={listening?stop:start}>
          {listening ? "🎙 Listening… tap to stop" : "🎙 Tap to speak the quote"}
        </button>
        {speechError && <div className="auth-error">{speechError}</div>}
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
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",border:"1.5px solid #ddd",borderRadius:4,background:"#fff",color:"var(--ink)",outline:"none",fontFamily:"var(--font-ui)",fontSize:"0.9rem",padding:"8px 10px"}} />
          </div>
          <div className="field"><label>time</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{width:"100%",border:"1.5px solid #ddd",borderRadius:4,background:"#fff",color:"var(--ink)",outline:"none",fontFamily:"var(--font-ui)",fontSize:"0.9rem",padding:"8px 10px"}} />
          </div>
        </div>
        <div className="field"><label>marker color</label>
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
          <label>wall</label>
          {!showNew ? (
            <select value={wallId} onChange={e=>{ if(e.target.value==="__new__"){setShowNew(true);}else setWallId(e.target.value); }} style={selStyle}>
              {myWalls.map(w=><option key={w.id} value={w.id}>{visIcon(w)} {w.name}</option>)}
              <option value="__new__">+ create new wall</option>
            </select>
          ) : (
            <>
              <input value={newWallName} onChange={e=>setNewWallName(e.target.value)} placeholder="e.g. girls weekend" style={{...selStyle,marginBottom:4}} />
              {myWalls.length > 0 && (
                <span style={{fontFamily:"var(--font-ui)",fontSize:"0.75rem",color:"#999",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setShowNew(false);setNewWallName("");}}>← back to existing walls</span>
              )}
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
const genToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const ShareModal = ({ wall, user, onWallUpdate, onWallDeleted, onClose }) => {
  const [copied,  setCopied] = useState(false);
  const [name,    setName]   = useState(wall.name);
  const [members, setMembers]= useState([]);
  const [inviteToken, setInviteToken] = useState("");
  const [visibility, setVisibility] = useState(wall.visibility);
  const [shareToken, setShareToken] = useState(wall.share_token || "");
  const isOwner = wall.owner_id === user.id;

  useEffect(() => {
    const load = async () => {
      const { data:existing } = await supabase.from("invite_tokens").select("token").eq("wall_id", wall.id).single();
      if (existing) {
        setInviteToken(existing.token);
      } else {
        const token = genToken();
        await supabase.from("invite_tokens").insert([{ token, wall_id: wall.id }]);
        setInviteToken(token);
      }
      const { data:mems } = await supabase.from("wall_members").select("user_id, users(id,name)").eq("wall_id", wall.id);
      setMembers(mems || []);
    };
    load();
  }, [wall.id]);

  const inviteUrl = inviteToken ? `${window.location.origin}?invite=${inviteToken}` : "";
  const publicUrl = shareToken ? `${window.location.origin}?w=${shareToken}` : "";
  const smsBody   = encodeURIComponent(`Psst! Don't forget what we said! Join ${wall.name} on Quotzit! ${inviteUrl}`);

  const removeMember = async (memberId) => {
    if (memberId === wall.owner_id) return alert("You can't remove the wall's owner.");
    await supabase.from("wall_members").delete().eq("wall_id", wall.id).eq("user_id", memberId);
    setMembers(prev => prev.filter(m => m.user_id !== memberId));
  };

  const togglePublic = async () => {
    if (wall.is_personal) return;
    const nextVis = visibility === "private" ? "public_unlisted" : "private";
    const token = (nextVis === "public_unlisted" && !shareToken) ? genToken() : shareToken;
    const { data, error } = await supabase.from("walls").update({ visibility: nextVis, share_token: token }).eq("id", wall.id).select().single();
    if (error) return alert("Couldn't update visibility. Try again.");
    setVisibility(data.visibility); setShareToken(data.share_token || "");
    onWallUpdate(data);
  };

  const copy = (url) => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2200); });

  const renameWall = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === wall.name) return;
    const { data, error } = await supabase.from("walls").update({ name: trimmed }).eq("id", wall.id).select().single();
    if (error) return alert("Couldn't rename wall. Try again.");
    onWallUpdate(data);
  };

  const deleteWall = async () => {
    if (!window.confirm(`Delete "${wall.name}"? This permanently removes it and every quote pinned there, for everyone on it. This can't be undone.`)) return;
    await supabase.from("quotes").delete().eq("wall_id", wall.id);
    await supabase.from("wall_members").delete().eq("wall_id", wall.id);
    await supabase.from("invite_tokens").delete().eq("wall_id", wall.id);
    await supabase.from("walls").delete().eq("id", wall.id);
    onWallDeleted(wall.id);
  };

  return (
    <Portal>
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share "{wall.name}"</div>
        {isOwner && (
          <div className="field">
            <label>wall name</label>
            <div style={{display:"flex",gap:8}}>
              <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&renameWall()} style={{flex:1}} />
              <button className="btn btn-primary btn-sm" onClick={renameWall} disabled={!name.trim() || name.trim()===wall.name}>Save</button>
            </div>
          </div>
        )}
        <div style={{background:"#fef9e7",border:"1.5px solid #f0d060",borderRadius:3,padding:"14px 16px",marginBottom:18}}>
          <div className="section-label" style={{marginTop:0}}>invite by text</div>
          <div style={{fontFamily:"var(--font-hand)",fontSize:"1rem",color:"var(--ink)",fontStyle:"italic",marginBottom:12}}>
            "Psst! Don't forget what we said! Join {wall.name} on Quotzit!"
          </div>
          <a href={`sms:?&body=${smsBody}`} style={{textDecoration:"none"}}>
            <button className="btn btn-primary" style={{width:"100%"}}>📱 Send Invite Text</button>
          </a>
          <div style={{fontFamily:"var(--font-ui)",fontSize:"0.7rem",color:"#bbb",marginTop:7,textAlign:"center"}}>link lets them join directly — no manual adding needed</div>
        </div>
        <div className="section-label" style={{marginTop:0}}>current members</div>
        {members.map((m,i) => (
          <div key={i} className="invite-item">
            <span>{m.users?.name}</span>
            {m.user_id !== wall.owner_id && isOwner && (
              <button onClick={()=>removeMember(m.user_id)}
                style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:"0.75rem",fontFamily:"var(--font-ui)"}}>
                remove
              </button>
            )}
          </div>
        ))}
        <hr className="divider"/>
        <div className="section-label">invite link (join as a member)</div>
        <div className="share-link-box">{inviteUrl || "generating…"}</div>
        <button className="btn btn-sm" style={{background:"none",border:"1.5px solid #ccc",color:"#777",fontFamily:"var(--font-ui)",cursor:"pointer"}} onClick={()=>copy(inviteUrl)}>
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>

        {isOwner && (
          <>
            <hr className="divider"/>
            <div className="section-label">public viewing</div>
            {wall.is_personal ? (
              <div style={{fontFamily:"var(--font-ui)",fontSize:"0.78rem",color:"#999",fontStyle:"italic"}}>
                Your personal wall always stays private. Create a separate wall if you want something shareable and public.
              </div>
            ) : (
            <button className="btn btn-sm" style={{background: visibility==="public_unlisted" ? "rgba(37,98,172,0.1)" : "none", borderColor: visibility==="public_unlisted" ? "var(--ink-blue)" : "#ccc", border:"1.5px solid #ccc", fontFamily:"var(--font-ui)", cursor:"pointer", marginBottom:10}} onClick={togglePublic}>
              {visibility==="public_unlisted" ? "✓ Public (view-only)" : "Make Public (view-only)"}
            </button>
            )}
            {!wall.is_personal && visibility === "public_unlisted" && (
              <>
                <div style={{fontFamily:"var(--font-ui)",fontSize:"0.72rem",color:"#999",marginBottom:6}}>
                  Anyone with this link can view — even without a Quotzit account. They can't post or join, and reacting needs an account. Never searchable.
                </div>
                <div className="share-link-box">{publicUrl}</div>
                <button className="btn btn-sm" style={{background:"none",border:"1.5px solid #ccc",color:"#777",fontFamily:"var(--font-ui)",cursor:"pointer"}} onClick={()=>copy(publicUrl)}>
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>
              </>
            )}
          </>
        )}

        {isOwner && !wall.is_personal && (
          <>
            <hr className="divider"/>
            <div className="section-label">danger zone</div>
            <button className="btn btn-danger btn-sm" onClick={deleteWall}>Delete This Wall</button>
          </>
        )}

        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// ── Settings Modal ────────────────────────────────────────────────────────────
const SettingsModal = ({ user, onUserUpdate, onDeleteAccount, onClose }) => {
  const [name,     setName]    = useState(user.name);
  const [email,    setEmail]   = useState(user.email);
  const [pass,     setPass]    = useState("");
  const [newPass,  setNewPass] = useState("");
  const [walls,    setWalls]   = useState([]);
  const [saving,   setSaving]  = useState(false);
  const [msg,      setMsg]     = useState("");

  useEffect(() => {
    const load = async () => {
      const { data:owned } = await supabase.from("walls").select("id,name").eq("owner_id", user.id);
      const results = [];
      for (const w of (owned||[])) {
        const { data:mems } = await supabase.from("wall_members").select("user_id, users(id,name)").eq("wall_id", w.id);
        results.push({ ...w, members: mems||[] });
      }
      setWalls(results);
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

  const removeMember = async (wallId, memberId) => {
    await supabase.from("wall_members").delete().eq("wall_id", wallId).eq("user_id", memberId);
    setWalls(prev => prev.map(w => w.id===wallId ? {...w, members: w.members.filter(m=>m.user_id!==memberId)} : w));
  };

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
          <h3>Your Walls</h3>
          {walls.length === 0 && <div style={{fontFamily:"var(--font-ui)",fontSize:"0.85rem",color:"#aaa",fontStyle:"italic"}}>No walls yet — pin a quote to a new wall to start one.</div>}
          {walls.map(w => (
            <div key={w.id} className="group-card">
              <div className="group-card-title">{visIcon(w)} {w.name}</div>
              {w.members.map((m,i) => (
                <div key={i} className="invite-item">
                  <span>{m.users?.name}</span>
                  {m.user_id !== user.id && (
                    <button onClick={()=>removeMember(w.id, m.user_id)}
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
const StickyNote = ({ quote, wallName, canEdit, canDelete, reactions, onToggleReaction, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const fontCss = FONT_MAP[quote.font] || "var(--font-hand)";
  const inkColor = COLOR_MAP[quote.color] || COLOR_MAP["marker-black"];
  const reactionMap = Object.fromEntries((reactions||[]).map(r=>[r.emoji,r]));

  return (
    <div className="sticky"
      style={{"--rot":`${quote.rotation||0}deg`, transform:`rotate(${quote.rotation||0}deg)`}}>
      <div className="sticky-actions">
        {canEdit   && <button className="icon-btn" onClick={()=>onEdit(quote)}>✏️</button>}
        {canDelete && <button className="icon-btn" onClick={()=>onDelete(quote.id)}>🗑</button>}
      </div>
      <div className="sticky-quote" style={{fontFamily:fontCss, color:inkColor, fontSize:`${quote.font_size||26}px`}}>{quote.text}</div>
      <button className="sticky-toggle" onClick={()=>setOpen(o=>!o)} aria-label={open ? "hide details" : "show details"}>
        <span className={`s-arrow ${open?"open":""}`}>▼</span>
      </button>
      {open && (
        <div className="sticky-meta">
          {quote.said_by  && <div className="meta-row">👤 {quote.said_by}</div>}
          {quote.location && <div className="meta-row">📍 {quote.location}</div>}
          <div className="meta-row">📅 {fmtDate(quote.date)} at {fmtTime(quote.date)}</div>
          {quote.author_name && <div className="meta-row">added by {quote.author_name}</div>}
          {wallName && <div className="meta-row">{wallName}</div>}
        </div>
      )}
      {onToggleReaction && (
        <div className="reaction-row">
          {REACTION_EMOJIS.map(e => {
            const r = reactionMap[e];
            return (
              <button key={e} className={`reaction-chip ${r?.reacted?"active":""}`} onClick={()=>onToggleReaction(quote.id, e)}>
                {e}{r?.count ? <span className="reaction-count">{r.count}</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Public Wall (view-only, no account required) ───────────────────────────────
const loadReactionMap = async (quoteIds, viewerId) => {
  if (!quoteIds.length) return {};
  const { data } = await supabase.from("reactions").select("*").in("quote_id", quoteIds);
  const map = {};
  (data||[]).forEach(r => {
    if (!map[r.quote_id]) map[r.quote_id] = {};
    if (!map[r.quote_id][r.emoji]) map[r.quote_id][r.emoji] = { emoji:r.emoji, count:0, reacted:false };
    map[r.quote_id][r.emoji].count++;
    if (r.user_id === viewerId) map[r.quote_id][r.emoji].reacted = true;
  });
  const out = {};
  Object.entries(map).forEach(([qid, byEmoji]) => { out[qid] = Object.values(byEmoji); });
  return out;
};

const PublicWall = ({ shareToken }) => {
  const [wall,     setWall]    = useState(null);
  const [quotes,   setQuotes]  = useState([]);
  const [notFound, setNotFound]= useState(false);
  const [reactionsByQuote, setReactionsByQuote] = useState({});
  const viewer = Session.get();

  useEffect(() => {
    const load = async () => {
      const { data:w } = await supabase.from("walls").select("*").eq("share_token", shareToken).eq("visibility", "public_unlisted").single();
      if (!w) { setNotFound(true); return; }
      setWall(w);
      const { data:qs } = await supabase.from("quotes").select("*").eq("wall_id", w.id).order("date", {ascending:false});
      setQuotes(qs || []);
      if (viewer && qs?.length) setReactionsByQuote(await loadReactionMap(qs.map(q=>q.id), viewer.id));
    };
    load();
  }, [shareToken]);

  const toggleReaction = async (quoteId, emoji) => {
    if (!viewer) return;
    const existing = (reactionsByQuote[quoteId]||[]).find(r=>r.emoji===emoji && r.reacted);
    if (existing) {
      await supabase.from("reactions").delete().eq("quote_id", quoteId).eq("user_id", viewer.id).eq("emoji", emoji);
    } else {
      await supabase.from("reactions").insert([{ quote_id: quoteId, user_id: viewer.id, emoji }]);
    }
    setReactionsByQuote(await loadReactionMap(quotes.map(q=>q.id), viewer.id));
  };

  if (notFound) {
    return (
      <div className="app-wrapper">
        <FontLoader/>
        <div className="empty-state"><h2>This wall isn't public (or doesn't exist)</h2></div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <FontLoader/>
      <div className="readonly-banner">👀 {wall ? `Viewing "${wall.name}"` : "Loading…"} — view only</div>
      <div style={{padding:"24px 20px 60px",maxWidth:1100,margin:"0 auto"}}>
        {!viewer && (
          <div style={{textAlign:"center",marginBottom:20}}>
            <a href="/" style={{textDecoration:"none"}}><button className="btn btn-primary btn-sm">Make your own wall on Quotzit</button></a>
            <div style={{fontFamily:"var(--font-ui)",fontSize:"0.72rem",color:"var(--attribution)",marginTop:6}}>sign in to react to these quotes</div>
          </div>
        )}
        <div className="notes-grid">
          {quotes.map(q=>(
            <StickyNote key={q.id} quote={q} canEdit={false} canDelete={false}
              reactions={reactionsByQuote[q.id]}
              onToggleReaction={viewer ? toggleReaction : null}
              onEdit={()=>{}} onDelete={()=>{}}/>
          ))}
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
      const { data } = await supabase.from("invite_tokens").select("wall_id, walls(name)").eq("token", token).single();
      if (data) setJoinInfo({ wallId: data.wall_id, wallName: data.walls?.name });
      setLoading(false);
    };
    load();
  }, [token]);

  const handleAuth = (user, wallId) => {
    // clear invite param and reload into the app, landing on that wall
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    if (wallId) url.searchParams.set("wall", wallId);
    window.location.replace(url.toString());
  };

  if (loading) return <div className="loading"><FontLoader/>Loading invite…</div>;
  if (!joinInfo) return <div className="loading"><FontLoader/>Invalid or expired invite link.</div>;

  if (screen === "login")  return <AuthScreen initialMode="login"  joinInfo={joinInfo} onAuth={handleAuth} onBack={()=>setScreen("choice")}/>;
  if (screen === "signup") return <AuthScreen initialMode="signup" joinInfo={joinInfo} onAuth={handleAuth} onBack={()=>setScreen("choice")}/>;

  return (
    <div className="landing">
      <FontLoader/>
      <div className="landing-logo">Quotzit</div>
      <div className="landing-tagline">you've been invited ✦</div>
      <div className="landing-quote-wrap">
        <div className="landing-note">
          <div className="landing-note-text">"Psst! Don't forget what we said!"</div>
          <div className="landing-note-meta">Join <strong>{joinInfo.wallName}</strong> on Quotzit</div>
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
  const params      = new URLSearchParams(window.location.search);
  const publicToken = params.get("w");
  const inviteToken = params.get("invite");
  const wallParam   = params.get("wall"); // wall id to select after login/invite redirect

  if (publicToken) return <PublicWall shareToken={publicToken}/>;
  if (inviteToken) return <InviteLanding token={inviteToken}/>;

  const [user,       setUser]      = useState(Session.get);
  const [screen,     setScreen]    = useState(user ? "wall" : "landing"); // landing | login | signup | wall
  const [quotes,     setQuotes]    = useState([]);
  const [myWalls,    setMyWalls]   = useState([]);
  const [activeWallId, setActiveWallId] = useState(wallParam || null);
  const [filterWho,  setFilterWho] = useState("");
  const [filterWhere,setFilterWhere]=useState("");
  const [search,     setSearch]    = useState("");
  const [showAdd,    setShowAdd]   = useState(false);
  const [editQ,      setEditQ]     = useState(null);
  const [shareWallId,setShareWallId]=useState(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [loading,    setLoading]   = useState(false);
  const [reactionsByQuote, setReactionsByQuote] = useState({});

  const loadWalls = async (u) => {
    const { data:memberships } = await supabase.from("wall_members").select("wall_id, walls(*)").eq("user_id", u.id);
    const walls = (memberships||[]).map(m=>m.walls).filter(Boolean)
      .sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    setMyWalls(walls);
    return walls;
  };

  const loadQuotes = async (u, walls) => {
    setLoading(true);
    const wallIds = (walls||myWalls).map(w=>w.id);
    let q = [];
    if (wallIds.length) {
      const { data } = await supabase.from("quotes").select("*").in("wall_id", wallIds).order("date", {ascending:false});
      q = data || [];
    }
    setQuotes(q);
    setLoading(false);
    if (q.length) loadReactions(q.map(x=>x.id), u.id);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const walls = await loadWalls(user);
      await loadQuotes(user, walls);
    })();
  }, [user]);

  const loadReactions = async (quoteIds, uid) => {
    setReactionsByQuote(await loadReactionMap(quoteIds, uid));
  };

  const toggleReaction = async (quoteId, emoji) => {
    const existing = (reactionsByQuote[quoteId]||[]).find(r=>r.emoji===emoji && r.reacted);
    if (existing) {
      await supabase.from("reactions").delete().eq("quote_id", quoteId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("reactions").insert([{ quote_id: quoteId, user_id: user.id, emoji }]);
    }
    loadReactions(quotes.map(q=>q.id), user.id);
  };

  const activeWall = myWalls.find(w=>w.id===activeWallId) || null;

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
  };

  const handleNewWall = (wall) => { setMyWalls(prev => [...prev, wall]); };

  const deleteQuote = async id => {
    await supabase.from("quotes").delete().eq("id", id);
    setQuotes(prev=>prev.filter(q=>q.id!==id));
  };

  const deleteAccount = async () => {
    await supabase.from("wall_members").delete().eq("user_id", user.id);
    await supabase.from("quotes").delete().eq("author_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);
    Session.clear(); setUser(null); setScreen("landing");
  };

  const logout = () => { Session.clear(); setUser(null); setScreen("landing"); setQuotes([]); setMyWalls([]); };

  // unique filter options
  const whoOptions   = [...new Set(quotes.map(q=>q.said_by).filter(Boolean))].sort();
  const whereOptions = [...new Set(quotes.map(q=>q.location).filter(Boolean))].sort();

  // apply all filters
  const visibleQuotes = quotes.filter(q => {
    if (!search && activeWallId && q.wall_id !== activeWallId) return false;
    if (filterWho    && q.said_by  !== filterWho)    return false;
    if (filterWhere  && q.location !== filterWhere)  return false;
    if (search) {
      const s = search.toLowerCase();
      const wallName = myWalls.find(w=>w.id===q.wall_id)?.name || "";
      const haystack = [q.text, q.said_by, q.location, wallName].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    return true;
  });

  const hasFilters = activeWallId || filterWho || filterWhere || search;
  const clearFilters = () => { setActiveWallId(null); setFilterWho(""); setFilterWhere(""); setSearch(""); };

  // ── Screens ──
  if (screen === "landing") return <LandingPage onSignIn={()=>setScreen("login")} onSignUp={()=>setScreen("signup")}/>;
  if (screen === "login")   return <AuthScreen initialMode="login"  onAuth={handleAuth} onBack={()=>setScreen("landing")}/>;
  if (screen === "signup")  return <AuthScreen initialMode="signup" onAuth={handleAuth} onBack={()=>setScreen("landing")}/>;

  return (
    <div className="app-wrapper">
      <FontLoader/>

      <div className="topbar">
        <div className="topbar-logo" onClick={()=>{setActiveWallId(null);clearFilters();}}>Quotzit</div>
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
              {activeWall ? <>{visIcon(activeWall)} {activeWall.name}</> : <>The Wall <em>✦</em></>}
            </div>
            <button className="btn btn-ghost btn-sm"
              onClick={()=>{ activeWall ? setShareWallId(activeWall.id) : setShowGroupPicker(true); }}>
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
          {myWalls.length > 0 && (
            <select className="filter-select" value={activeWallId||""} onChange={e=>setActiveWallId(e.target.value||null)}>
              <option value="">All walls</option>
              {myWalls.map(w=><option key={w.id} value={w.id}>{visIcon(w)} {w.name}</option>)}
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
                wallName={myWalls.find(w=>w.id===q.wall_id)?.name}
                canEdit={q.author_id===user.id}
                canDelete={q.author_id===user.id || myWalls.find(w=>w.id===q.wall_id)?.owner_id===user.id}
                reactions={reactionsByQuote[q.id]}
                onToggleReaction={toggleReaction}
                onEdit={setEditQ} onDelete={deleteQuote}/>
            ))}
          </div>
        )}
      </div>

      {(showAdd || editQ) && (
        <QuoteForm user={user} myWalls={myWalls} initial={editQ||null}
          onSave={saveQuote} onNewWall={handleNewWall} onClose={()=>{setShowAdd(false);setEditQ(null);}}/>
      )}
      {shareWallId && <ShareModal wall={myWalls.find(w=>w.id===shareWallId)} user={user}
        onWallUpdate={(w)=>setMyWalls(prev=>prev.map(x=>x.id===w.id?w:x))}
        onWallDeleted={(wallId)=>{
          setMyWalls(prev=>prev.filter(w=>w.id!==wallId));
          setQuotes(prev=>prev.filter(q=>q.wall_id!==wallId));
          if (activeWallId===wallId) setActiveWallId(null);
          setShareWallId(null);
        }}
        onClose={()=>setShareWallId(null)}/>}
      {showGroupPicker && (
        <Portal>
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowGroupPicker(false)}>
          <div className="modal" style={{maxWidth:340}}>
            <button className="modal-close" onClick={()=>setShowGroupPicker(false)}>✕</button>
            <div className="modal-title" style={{marginBottom:16}}>Which wall?</div>
            {myWalls.length === 0 ? (
              <div style={{fontFamily:"var(--font-ui)",fontSize:"0.9rem",color:"#aaa",fontStyle:"italic",textAlign:"center",padding:"20px 0"}}>
                No walls yet.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {myWalls.map(w=>(
                  <button key={w.id} className="btn btn-ghost" style={{textAlign:"left",justifyContent:"flex-start",color:"var(--ink)",background:"#faf7f2",border:"1.5px solid #e8dfc8",fontFamily:"var(--font-ui)",fontSize:"0.92rem"}}
                    onClick={()=>{ setShowGroupPicker(false); setShareWallId(w.id); }}>
                    {visIcon(w)} {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </Portal>
      )}
      {showSettings && (
        <SettingsModal user={user}
          onUserUpdate={u=>{ setUser(u); Session.set(u); }}
          onDeleteAccount={deleteAccount}
          onClose={()=>setShowSettings(false)}/>
      )}
    </div>
  );
}
