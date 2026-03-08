// Quotzit v2.0 — Supabase backend, real accounts, cross-device sync
import { useState, useRef, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uxpdancjavdtkasvxskf.supabase.co";
const SUPABASE_KEY = "sb_publishable_iYxhoWMNdliIddbtvNBFGQ_lLRZ_Xp0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Fonts & Global Styles ─────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400;600;700&family=Reenie+Beanie&family=Permanent+Marker&family=Indie+Flower&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #2c3e4a; }

    :root {
      --wall:        #2c3e4a;
      --wall-deep:   #1e2d36;
      --wall-mid:    #374f5e;
      --cork-dark:   #4a6572;
      --pin-red:     #cc3333;
      --pin-shadow:  rgba(0,0,0,0.5);
      --note-yellow: #fef08a;
      --note-blue:   #bfdbfe;
      --note-green:  #bbf7d0;
      --note-pink:   #fecdd3;
      --note-white:  #fafafa;
      --ink:         #1e1e1e;
      --ink-faded:   #666;
      --cream:       #f5efe0;
      --font-ui:     'Playfair Display', Georgia, serif;
      --font-hand:   'Caveat', cursive;
      --font-marker: 'Permanent Marker', cursive;
    }

    .app-wrapper {
      min-height: 100vh;
      background-color: var(--wall);
      background-image:
        radial-gradient(ellipse at 15% 25%, rgba(74,101,114,0.5) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 75%, rgba(30,45,54,0.65) 0%, transparent 50%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px;
      background: rgba(22,34,42,0.88);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      position: sticky; top: 0; z-index: 100;
    }
    .topbar-logo {
      font-family: var(--font-marker);
      font-size: 1.8rem; color: var(--note-yellow);
      letter-spacing: 1px; text-shadow: 1px 2px 8px rgba(0,0,0,0.6);
      cursor: pointer;
    }
    .topbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .topbar-greeting { font-family: var(--font-ui); font-style: italic; font-size: 0.88rem; color: rgba(245,239,224,0.55); }

    .btn {
      font-family: var(--font-ui); font-size: 0.85rem; font-weight: 700;
      letter-spacing: 0.03em; border: none; cursor: pointer;
      border-radius: 3px; padding: 8px 16px;
      transition: transform 0.12s, opacity 0.12s;
    }
    .btn:hover  { transform: translateY(-1px); opacity: 0.9; }
    .btn:active { transform: translateY(1px); }
    .btn-primary { background: var(--note-yellow); color: var(--ink); box-shadow: 2px 3px 8px rgba(0,0,0,0.28); }
    .btn-ghost   { background: transparent; color: var(--cream); border: 1.5px solid rgba(245,239,224,0.4); }
    .btn-sm      { font-size: 0.76rem; padding: 5px 11px; }
    .btn-cancel  { background: none; border: 1.5px solid #ddd; color: #999; font-family: var(--font-ui); font-size: 0.85rem; cursor: pointer; padding: 8px 16px; border-radius: 3px; }

    .auth-screen {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background-color: var(--wall);
      background-image: radial-gradient(ellipse at 30% 40%, rgba(74,101,114,0.5) 0%, transparent 65%);
    }
    .auth-card {
      background: var(--note-white); border-radius: 2px;
      padding: 44px 38px 36px; width: 370px; max-width: 95vw;
      box-shadow: 5px 7px 28px rgba(0,0,0,0.38); position: relative;
    }
    .auth-card::before {
      content:''; position:absolute; top:-11px; left:50%; transform:translateX(-50%);
      width:18px; height:18px; border-radius:50%;
      background: radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red));
      box-shadow: 0 3px 8px var(--pin-shadow);
    }
    .auth-title { font-family:var(--font-marker); font-size:2.6rem; color:var(--ink); text-align:center; margin-bottom:3px; }
    .auth-sub   { font-family:var(--font-ui); font-style:italic; font-size:0.95rem; color:var(--ink-faded); text-align:center; margin-bottom:28px; }
    .auth-error { background:#fee2e2; color:#991b1b; border-radius:2px; padding:8px 12px; font-family:var(--font-ui); font-size:0.85rem; margin-bottom:14px; }
    .auth-toggle { text-align:center; margin-top:14px; font-family:var(--font-ui); font-style:italic; font-size:0.88rem; color:var(--ink-faded); }
    .auth-toggle span { color:#7a4f1e; cursor:pointer; text-decoration:underline; }

    .field { margin-bottom: 14px; }
    .field label { display:block; font-family:var(--font-ui); font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faded); margin-bottom:5px; }
    .field input, .field select, .field textarea {
      width:100%; font-family:var(--font-hand); font-size:1.05rem;
      padding:9px 12px; border:1.5px solid #d4c4a8; border-radius:2px;
      background:#fffdf5; color:var(--ink); outline:none; transition:border-color 0.15s;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color:var(--cork-dark); }
    .field textarea { resize:vertical; min-height:80px; }

    .wall-area { padding:24px 20px 60px; max-width:1100px; margin:0 auto; }
    .wall-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:18px; }
    .wall-title { font-family:var(--font-ui); font-size:1.5rem; font-weight:700; color:var(--cream); text-shadow:1px 2px 6px rgba(0,0,0,0.4); }
    .wall-title em { font-style:italic; font-weight:400; opacity:0.7; }

    .tag-accordion { background:rgba(22,34,42,0.5); border-radius:4px; margin-bottom:20px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; }
    .tag-accordion-header { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; cursor:pointer; font-family:var(--font-ui); font-size:0.76rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(245,239,224,0.6); user-select:none; transition:background 0.12s; }
    .tag-accordion-header:hover { background:rgba(255,255,255,0.04); }
    .tag-arrow { font-size:0.62rem; transition:transform 0.2s; }
    .tag-arrow.open { transform:rotate(180deg); }
    .tag-accordion-body { display:flex; flex-wrap:wrap; gap:6px; padding:10px 14px 14px; border-top:1px solid rgba(255,255,255,0.06); }
    .tag-pill { font-family:var(--font-ui); font-size:0.75rem; font-weight:700; letter-spacing:0.04em; text-transform:lowercase; padding:4px 13px; border-radius:20px; cursor:pointer; border:1.5px solid transparent; transition:all 0.12s; background:rgba(255,255,255,0.1); color:rgba(245,239,224,0.8); }
    .tag-pill:hover { background:rgba(255,255,255,0.18); }
    .tag-pill.active { background:var(--note-yellow); color:var(--ink); box-shadow:2px 2px 6px rgba(0,0,0,0.25); }

    .notes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:26px; }
    @media (max-width:480px) {
      .notes-grid { grid-template-columns:1fr; gap:20px; }
      .topbar-greeting { display:none; }
      .topbar { padding:10px 14px; }
    }

    .sticky { position:relative; padding:20px 16px 14px; border-radius:2px; box-shadow:3px 5px 16px rgba(0,0,0,0.26), 1px 1px 0 rgba(255,255,255,0.18) inset; transition:transform 0.2s, box-shadow 0.2s; animation:pinDrop 0.3s cubic-bezier(0.34,1.5,0.64,1) both; }
    @keyframes pinDrop { from{opacity:0;transform:translateY(-14px) rotate(var(--rot,0deg))} to{opacity:1;transform:translateY(0) rotate(var(--rot,0deg))} }
    .sticky:hover { transform:rotate(0deg) translateY(-5px) scale(1.025)!important; box-shadow:6px 12px 28px rgba(0,0,0,0.34); z-index:10; }
    .sticky::before { content:''; position:absolute; top:-10px; left:50%; transform:translateX(-50%); width:15px; height:15px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 7px var(--pin-shadow); z-index:2; }
    .note-yellow{background:#fef08a} .note-blue{background:#bfdbfe} .note-green{background:#bbf7d0} .note-pink{background:#fecdd3} .note-white{background:#fafafa}

    .sticky-actions { position:absolute; top:7px; right:8px; display:flex; gap:3px; opacity:0; transition:opacity 0.15s; }
    .sticky:hover .sticky-actions { opacity:1; }
    @media (hover:none) { .sticky-actions{opacity:1} }
    .icon-btn { background:rgba(0,0,0,0.1); border:none; border-radius:3px; width:24px; height:24px; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; justify-content:center; transition:background 0.1s; }
    .icon-btn:hover { background:rgba(0,0,0,0.22); }

    .sticky-quote { font-size:1.14rem; font-weight:600; line-height:1.42; color:var(--ink); margin-bottom:10px; word-break:break-word; }
    .sticky-summary { font-family:var(--font-ui); font-size:0.72rem; color:#555; display:flex; align-items:center; gap:5px; cursor:pointer; user-select:none; padding:2px 0; }
    .sticky-summary:hover { color:#222; }
    .s-arrow { font-size:0.58rem; transition:transform 0.18s; }
    .s-arrow.open { transform:rotate(180deg); }
    .sticky-meta { font-family:var(--font-ui); font-size:0.74rem; color:#444; margin-top:8px; display:flex; flex-direction:column; gap:3px; border-top:1px dashed rgba(0,0,0,0.12); padding-top:8px; }
    .meta-row { display:flex; align-items:center; gap:5px; }
    .sticky-tag { display:inline-block; margin-top:8px; font-family:var(--font-ui); font-size:0.66rem; font-weight:700; letter-spacing:0.06em; text-transform:lowercase; background:rgba(0,0,0,0.1); border-radius:10px; padding:2px 9px; }

    .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.58); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200; animation:fadeIn 0.15s ease; padding:16px; }
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .modal { background:#fffdf5; width:460px; max-width:100%; max-height:90vh; overflow-y:auto; border-radius:2px; padding:36px 30px 28px; box-shadow:6px 9px 36px rgba(0,0,0,0.45); position:relative; animation:slideUp 0.22s cubic-bezier(0.34,1.4,0.64,1) both; }
    @keyframes slideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
    .modal::before { content:''; position:absolute; top:-11px; left:50%; transform:translateX(-50%); width:18px; height:18px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #ff7777, var(--pin-red)); box-shadow:0 3px 8px var(--pin-shadow); }
    .modal-title { font-family:var(--font-ui); font-size:1.3rem; font-weight:700; color:var(--ink); margin-bottom:20px; }
    .modal-close { position:absolute; top:13px; right:15px; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#bbb; }
    .modal-row { display:flex; gap:10px; }
    .modal-row .field { flex:1; }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }

    .mic-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:9px 14px; margin-bottom:14px; font-family:var(--font-ui); font-size:0.78rem; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; border:1.5px solid #d4c4a8; border-radius:2px; background:#faf5e8; cursor:pointer; color:var(--ink); transition:all 0.15s; }
    .mic-btn:hover { background:#f5eed8; border-color:var(--cork-dark); }
    .mic-btn.listening { background:#fee2e2; border-color:#f87171; color:#991b1b; animation:pulse 1s infinite; }
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}

    .swatch-row { display:flex; gap:8px; margin-top:4px; }
    .swatch { width:28px; height:28px; border-radius:2px; cursor:pointer; border:2px solid rgba(0,0,0,0.12); transition:transform 0.12s,border-color 0.12s,box-shadow 0.12s; }
    .swatch.active { border-color:#333; transform:scale(1.22); box-shadow:0 2px 7px rgba(0,0,0,0.3); }

    .font-picker { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .font-chip { padding:5px 13px; border-radius:2px; cursor:pointer; border:1.5px solid transparent; background:rgba(0,0,0,0.06); color:var(--ink); font-size:1rem; transition:all 0.12s; }
    .font-chip.active { background:var(--note-yellow); border-color:#b8930a; }

    .share-link-box { background:#f5f0e8; border:1.5px dashed #c4a87a; border-radius:2px; padding:10px 13px; font-family:var(--font-ui); font-size:0.78rem; color:var(--ink); word-break:break-all; margin-bottom:10px; }
    .invite-item { font-family:var(--font-ui); font-size:0.8rem; padding:5px 0; border-bottom:1px dashed #e0d8cc; color:var(--ink-faded); }
    .section-label { font-family:var(--font-ui); font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.09em; color:#aaa; margin-bottom:6px; margin-top:14px; }

    .empty-state { text-align:center; padding:64px 20px; font-family:var(--font-ui); color:rgba(245,239,224,0.45); }
    .empty-state h2 { font-size:1.6rem; font-weight:700; font-style:italic; color:rgba(245,239,224,0.7); margin-bottom:10px; }
    .readonly-banner { background:var(--note-yellow); font-family:var(--font-ui); font-size:0.88rem; font-weight:700; text-align:center; padding:10px; color:var(--ink); letter-spacing:0.02em; }
    .loading { display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:var(--font-ui); font-style:italic; color:rgba(245,239,224,0.6); font-size:1.1rem; }
  `}</style>
);

// ── Config ────────────────────────────────────────────────────────────────────
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
const ROTATIONS = [-3,-2,-1,0,1,2,3];
const rand = arr => arr[Math.floor(Math.random()*arr.length)];
const fmtDate = iso => new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});

// ── Session storage for current user ─────────────────────────────────────────
const Session = {
  get: () => { try{ return JSON.parse(sessionStorage.getItem("qz_user")); }catch{ return null; } },
  set: u => sessionStorage.setItem("qz_user", JSON.stringify(u)),
  clear: () => sessionStorage.removeItem("qz_user"),
};

// ── Speech ────────────────────────────────────────────────────────────────────
const useSpeech = onResult => {
  const recRef = useRef(null);
  const [listening,setListening] = useState(false);
  const supported = typeof window!=="undefined" && ("SpeechRecognition" in window||"webkitSpeechRecognition" in window);
  const start = () => {
    if (!supported) return alert("Speech recognition requires Chrome or Safari.");
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang="en-US"; rec.interimResults=false;
    rec.onresult = e=>{ onResult(e.results[0][0].transcript); setListening(false); };
    rec.onerror = ()=>setListening(false);
    rec.onend   = ()=>setListening(false);
    recRef.current=rec; rec.start(); setListening(true);
  };
  const stop = ()=>{ recRef.current?.stop(); setListening(false); };
  return { listening, start, stop };
};

// ── Auth Screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }) => {
  const [mode,setMode]   = useState("login");
  const [name,setName]   = useState("");
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [err,setErr]     = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    if (!email||!pass) { setErr("Please fill in all fields."); setLoading(false); return; }
    try {
      if (mode==="signup") {
        if (!name) { setErr("Please enter your name."); setLoading(false); return; }
        const { data:existing } = await supabase.from("users").select("id").eq("email",email).single();
        if (existing) { setErr("That email is already registered."); setLoading(false); return; }
        const { data, error } = await supabase.from("users").insert([{ name, email, pass }]).select().single();
        if (error) throw error;
        Session.set(data); onAuth(data);
      } else {
        const { data, error } = await supabase.from("users").select("*").eq("email",email).eq("pass",pass).single();
        if (error||!data) { setErr("Email or password is incorrect."); setLoading(false); return; }
        Session.set(data); onAuth(data);
      }
    } catch(e) { setErr("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">Quotzit</div>
        <div className="auth-sub">{mode==="login"?"welcome back ✦":"save the good stuff ✦"}</div>
        {err && <div className="auth-error">{err}</div>}
        {mode==="signup" && (
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
          {loading ? "..." : mode==="login" ? "Sign In" : "Create Account"}
        </button>
        <div className="auth-toggle">
          {mode==="login"
            ?<>No account? <span onClick={()=>setMode("signup")}>sign up free</span></>
            :<>Already have one? <span onClick={()=>setMode("login")}>sign in</span></>}
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

  const [text,   setText]   = useState(initial?.text     ?? "");
  const [saidBy, setSaidBy] = useState(initial?.said_by  ?? "");
  const [loc,    setLoc]    = useState(initial?.location  ?? "");
  const [tag,    setTag]    = useState(initial?.tag       ?? "");
  const [newTag, setNewTag] = useState("");
  const [showNew,setShowNew]= useState(false);
  const [date,   setDate]   = useState(initial ? toLocalDate(initial.date) : toLocalDate(now));
  const [time,   setTime]   = useState(initial ? toLocalTime(initial.date) : toLocalTime(now));
  const [color,  setColor]  = useState(initial?.color    ?? "note-yellow");
  const [font,   setFont]   = useState(initial?.font     ?? "casual");
  const [saving, setSaving] = useState(false);

  const {listening,start,stop} = useSpeech(t=>setText(p=>p?p+" "+t:t));

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const finalTag = showNew ? newTag.trim() : tag;
    const record = {
      text: text.trim(), said_by: saidBy.trim(), location: loc.trim(),
      tag: finalTag||null, date: new Date(`${date}T${time}`).toISOString(),
      author_id: user.id, author_name: user.name,
      color, font, rotation: initial?.rotation ?? rand(ROTATIONS),
    };
    if (initial?.id) {
      const { data, error } = await supabase.from("quotes").update(record).eq("id",initial.id).select().single();
      if (!error) onSave(data);
    } else {
      const { data, error } = await supabase.from("quotes").insert([record]).select().single();
      if (!error) onSave(data);
      // auto-create group if new tag
      if (finalTag) {
        const { data:existing } = await supabase.from("groups").select("id").eq("name",finalTag).eq("owner_id",user.id).single();
        if (!existing) {
          const { data:grp } = await supabase.from("groups").insert([{name:finalTag,owner_id:user.id}]).select().single();
          if (grp) await supabase.from("group_members").insert([{group_id:grp.id,user_id:user.id}]);
        }
      }
    }
    setSaving(false); onClose();
  };

  const selStyle = { width:"100%",fontFamily:"var(--font-hand)",fontSize:"1rem", padding:"9px 12px",border:"1.5px solid #d4c4a8",borderRadius:2, background:"#fffdf5",color:"var(--ink)",outline:"none" };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{initial?"Edit Quote ✏️":"Pin a Quote ✦"}</div>
        <button className={`mic-btn ${listening?"listening":""}`} onClick={listening?stop:start}>
          {listening?"🎙 Listening… tap to stop":"🎙 Tap to speak the quote"}
        </button>
        <div className="field"><label>the quote</label>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            style={{fontFamily:FONT_MAP[font]}} placeholder="what was said?" />
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
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{width:"100%",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none",fontFamily:"var(--font-hand)",fontSize:"0.95rem",padding:"8px 10px"}} />
          </div>
          <div className="field"><label>time</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)}
              style={{width:"100%",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none",fontFamily:"var(--font-hand)",fontSize:"0.95rem",padding:"8px 10px"}} />
          </div>
        </div>
        <div className="field"><label>note color</label>
          <div className="swatch-row">
            {COLOR_OPTIONS.map(c=>(
              <div key={c.value} className={`swatch ${color===c.value?"active":""}`}
                style={{background:c.hex}} onClick={()=>setColor(c.value)} />
            ))}
          </div>
        </div>
        <div className="field"><label>handwriting style</label>
          <div className="font-picker">
            {FONT_OPTIONS.map(f=>(
              <div key={f.value} className={`font-chip ${font===f.value?"active":""}`}
                style={{fontFamily:f.css}} onClick={()=>setFont(f.value)}>{f.label}</div>
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
          ):(
            <>
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="e.g. girls weekend" style={{...selStyle,marginBottom:4}} />
              <span style={{fontFamily:"var(--font-ui)",fontSize:"0.75rem",color:"#999",cursor:"pointer",textDecoration:"underline"}}
                onClick={()=>{setShowNew(false);setNewTag("");}}>← back to existing tags</span>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"saving…":initial?"Save Changes":"Pin it 📌"}</button>
        </div>
      </div>
    </div>
  );
};

// ── Share Modal ───────────────────────────────────────────────────────────────
const ShareModal = ({ tag, user, onClose }) => {
  const [email,  setEmail]  = useState("");
  const [copied, setCopied] = useState(false);
  const [members,setMembers]= useState([]);
  const shareUrl = `${window.location.origin}?share=${btoa(tag+"::"+user.id)}`;
  const smsBody  = encodeURIComponent(`Psst! Don't forget what we said! Join ${tag} on Quotzit! ${shareUrl}`);

  useEffect(()=>{
    const load = async () => {
      const { data:grp } = await supabase.from("groups").select("id").eq("name",tag).eq("owner_id",user.id).single();
      if (grp) {
        const { data:mems } = await supabase.from("group_members").select("user_id, users(name,email)").eq("group_id",grp.id);
        setMembers(mems||[]);
      }
    };
    load();
  },[tag,user.id]);

  const invite = async () => {
    if (!email.trim()) return;
    const { data:invitee } = await supabase.from("users").select("*").eq("email",email.trim().toLowerCase()).single();
    if (!invitee) return alert("No Quotzit account found with that email.");
    const { data:grp } = await supabase.from("groups").select("id").eq("name",tag).eq("owner_id",user.id).single();
    if (!grp) return alert("Group not found.");
    const { error } = await supabase.from("group_members").insert([{group_id:grp.id,user_id:invitee.id}]);
    if (error) return alert("They may already be in this group.");
    alert(`${invitee.name} added to "${tag}"!`);
    setEmail("");
  };

  const copy = () => navigator.clipboard.writeText(shareUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2200);});

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share "{tag}"</div>
        <div style={{background:"#fef9e7",border:"1.5px solid #f0d060",borderRadius:3,padding:"14px 16px",marginBottom:18}}>
          <div style={{fontFamily:"var(--font-ui)",fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:"#999",marginBottom:6}}>invite by text</div>
          <div style={{fontFamily:"var(--font-hand)",fontSize:"1rem",color:"var(--ink)",fontStyle:"italic",marginBottom:12}}>
            "Psst! Don't forget what we said! Join {tag} on Quotzit!"
          </div>
          <a href={`sms:?&body=${smsBody}`} style={{textDecoration:"none"}}>
            <button className="btn btn-primary" style={{width:"100%"}}>📱 Send Invite Text</button>
          </a>
          <div style={{fontFamily:"var(--font-ui)",fontSize:"0.7rem",color:"#bbb",marginTop:7,textAlign:"center"}}>opens Messages with the invite pre-written</div>
        </div>
        <div className="section-label">add someone with a Quotzit account</div>
        <div style={{display:"flex",gap:8,marginBottom:4}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="their email"
            style={{flex:1,fontFamily:"var(--font-hand)",fontSize:"1rem",padding:"8px 11px",border:"1.5px solid #d4c4a8",borderRadius:2,background:"#fffdf5",color:"var(--ink)",outline:"none"}} />
          <button className="btn btn-primary btn-sm" onClick={invite}>Add</button>
        </div>
        <div className="section-label">read-only link</div>
        <div className="share-link-box">{shareUrl}</div>
        <button className="btn btn-sm" style={{background:"none",border:"1.5px solid #ccc",color:"#777",fontFamily:"var(--font-ui)",cursor:"pointer",marginBottom:4}} onClick={copy}>
          {copied?"✓ Copied!":"Copy Link"}
        </button>
        <div className="section-label">current members</div>
        {members.map((m,i)=>(
          <div key={i} className="invite-item">{m.users?.name} ({m.users?.email})</div>
        ))}
        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

// ── Sticky Note ───────────────────────────────────────────────────────────────
const StickyNote = ({ quote, canEdit, canDelete, onEdit, onDelete }) => {
  const [open,setOpen] = useState(false);
  const fontCss = FONT_MAP[quote.font] || "var(--font-hand)";
  const who  = quote.said_by  || null;
  const where= quote.location || null;
  const when = fmtDate(quote.date);
  const parts = [who&&`👤 ${who}`, where&&`📍 ${where}`, `📅 ${when}`].filter(Boolean);

  return (
    <div className={`sticky ${quote.color||"note-yellow"}`}
      style={{"--rot":`${quote.rotation||0}deg`,transform:`rotate(${quote.rotation||0}deg)`}}>
      <div className="sticky-actions">
        {canEdit   && <button className="icon-btn" title="edit"   onClick={()=>onEdit(quote)}>✏️</button>}
        {canDelete && <button className="icon-btn" title="delete" onClick={()=>onDelete(quote.id)}>🗑</button>}
      </div>
      <div className="sticky-quote" style={{fontFamily:fontCss}}>"{quote.text}"</div>
      <div className="sticky-summary" onClick={()=>setOpen(o=>!o)}>
        <span className={`s-arrow ${open?"open":""}`}>▼</span>
        <span style={{flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
          {open?"hide details":parts.join(" · ")}
        </span>
      </div>
      {open && (
        <div className="sticky-meta">
          {who   && <div className="meta-row">👤 {who}</div>}
          {where && <div className="meta-row">📍 {where}</div>}
          <div className="meta-row">📅 {when} at {fmtTime(quote.date)}</div>
          {quote.author_name && <div className="meta-row" style={{color:"#999",fontSize:"0.68rem"}}>added by {quote.author_name}</div>}
          {quote.tag && <div><div className="sticky-tag">#{quote.tag}</div></div>}
        </div>
      )}
      {!open && quote.tag && <div className="sticky-tag">#{quote.tag}</div>}
    </div>
  );
};

// ── Tag Accordion ─────────────────────────────────────────────────────────────
const TagAccordion = ({ tags, activeTag, onSelect }) => {
  const [open,setOpen] = useState(false);
  if (!tags.length) return null;
  return (
    <div className="tag-accordion">
      <div className="tag-accordion-header" onClick={()=>setOpen(o=>!o)}>
        <span>{activeTag?`Filtered: #${activeTag}`:"Filter by tag"}</span>
        <span className={`tag-arrow ${open?"open":""}`}>▼</span>
      </div>
      {open && (
        <div className="tag-accordion-body">
          <div className={`tag-pill ${!activeTag?"active":""}`} onClick={()=>{onSelect(null);setOpen(false);}}>all quotes</div>
          {tags.map(t=>(
            <div key={t} className={`tag-pill ${activeTag===t?"active":""}`}
              onClick={()=>{onSelect(t);setOpen(false);}}>#{t}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Read-Only Wall ────────────────────────────────────────────────────────────
const ReadOnlyWall = ({ shareParam }) => {
  const [quotes,setQuotes] = useState([]);
  const [tag,setTag]       = useState("");
  useEffect(()=>{
    try {
      const [t] = atob(shareParam).split("::");
      setTag(t);
      supabase.from("quotes").select("*").eq("tag",t).order("date",{ascending:false}).then(({data})=>setQuotes(data||[]));
    } catch { setQuotes([]); }
  },[]);
  return (
    <div className="app-wrapper"><FontLoader/>
      <div className="readonly-banner">👀 Read-only — <strong>{tag}</strong></div>
      <div style={{padding:"24px 20px 60px",maxWidth:1100,margin:"0 auto"}}>
        <div className="notes-grid">
          {quotes.map(q=><StickyNote key={q.id} quote={q} canEdit={false} canDelete={false} onEdit={()=>{}} onDelete={()=>{}}/>)}
        </div>
        {!quotes.length&&<div className="empty-state"><h2>Nothing pinned yet</h2><p>check back soon</p></div>}
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Quotzit() {
  const params     = new URLSearchParams(window.location.search);
  const shareParam = params.get("share");
  if (shareParam) return <ReadOnlyWall shareParam={shareParam}/>;

  const [user,     setUser]    = useState(Session.get);
  const [quotes,   setQuotes]  = useState([]);
  const [myTags,   setMyTags]  = useState([]);
  const [activeTag,setActive]  = useState(null);
  const [showAdd,  setShowAdd] = useState(false);
  const [editQ,    setEditQ]   = useState(null);
  const [shareTag, setShare]   = useState(null);
  const [loading,  setLoading] = useState(false);

  const loadQuotes = async (u) => {
    setLoading(true);
    // get groups user belongs to
    const { data:memberships } = await supabase.from("group_members").select("group_id, groups(name)").eq("user_id",u.id);
    const groupNames = (memberships||[]).map(m=>m.groups?.name).filter(Boolean);

    // get own quotes + quotes from shared groups
    let q = [];
    const { data:own } = await supabase.from("quotes").select("*").eq("author_id",u.id).order("date",{ascending:false});
    q = [...(own||[])];
    if (groupNames.length) {
      const { data:shared } = await supabase.from("quotes").select("*").in("tag",groupNames).neq("author_id",u.id).order("date",{ascending:false});
      q = [...q,...(shared||[])];
    }
    // dedupe and sort
    const seen = new Set(); q = q.filter(x=>{ if(seen.has(x.id)) return false; seen.add(x.id); return true; });
    q.sort((a,b)=>new Date(b.date)-new Date(a.date));
    setQuotes(q);
    setMyTags([...new Set(q.map(x=>x.tag).filter(Boolean))]);
    setLoading(false);
  };

  useEffect(()=>{ if(user) loadQuotes(user); },[user]);

  const handleAuth = u => { setUser(u); };

  const saveQuote = q => {
    setQuotes(prev => {
      const existing = prev.find(x=>x.id===q.id);
      return existing ? prev.map(x=>x.id===q.id?q:x) : [q,...prev];
    });
    setMyTags(prev=>[...new Set([...prev,q.tag].filter(Boolean))]);
  };

  const deleteQuote = async id => {
    await supabase.from("quotes").delete().eq("id",id);
    setQuotes(prev=>prev.filter(q=>q.id!==id));
  };

  const logout = () => { Session.clear(); setUser(null); setQuotes([]); setMyTags([]); };

  if (!user) return <><FontLoader/><AuthScreen onAuth={handleAuth}/></>;

  const visibleQuotes = quotes.filter(q=>!activeTag||q.tag===activeTag);

  return (
    <div className="app-wrapper">
      <FontLoader/>
      <div className="topbar">
        <div className="topbar-logo" onClick={()=>setActive(null)}>Quotzit</div>
        <div className="topbar-right">
          <span className="topbar-greeting">hey, {user.name}</span>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Pin Quote</button>
          {activeTag && <button className="btn btn-ghost btn-sm" onClick={()=>setShare(activeTag)}>Share Wall</button>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="wall-area">
        <div className="wall-header">
          <div className="wall-title">
            {activeTag?<><em>#</em>{activeTag}</>:<>The Wall <em>✦</em></>}
          </div>
        </div>
        <TagAccordion tags={myTags} activeTag={activeTag} onSelect={setActive}/>
        {loading ? (
          <div className="empty-state"><h2>loading your wall…</h2></div>
        ) : visibleQuotes.length===0 ? (
          <div className="empty-state">
            <h2>{activeTag?`Nothing tagged #${activeTag} yet`:"Nothing pinned yet"}</h2>
            <p>hit "Pin Quote" up top to save your first one</p>
          </div>
        ):(
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

      {(showAdd||editQ) && (
        <QuoteForm user={user} myTags={myTags} initial={editQ||null}
          onSave={saveQuote} onClose={()=>{setShowAdd(false);setEditQ(null);}}/>
      )}
      {shareTag && (
        <ShareModal tag={shareTag} user={user} onClose={()=>setShare(null)}/>
      )}
    </div>
  );
}
