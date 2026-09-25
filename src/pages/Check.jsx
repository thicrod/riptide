import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, imageToPayload } from '../lib/api.js';
import { EXAMPLES } from '../lib/examples.js';
import { PEPPERDINE } from '../../shared/categories.js';
import RichText from '../components/RichText.jsx';
import FlagList from '../components/FlagList.jsx';
import ReportPanel from '../components/ReportPanel.jsx';
import { RiskMeter } from '../components/Verdict.jsx';
import { PageHeader } from '../components/ui.jsx';
import {
  ShieldCheck, Upload, Lock, CheckCircle, Hook, Users, Info, XIcon, Phone, Arrow, Clipboard, Trash, Type, Image, Octagon, Alert, Refresh,
} from '../components/Icons.jsx';

const STEPS = ['Checking sender and domains…', 'Following every link…', 'Scanning for pressure tactics…', 'Asking the AI analyst…', 'Combining the evidence…'];
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function Loading({ ai, image }) {
  const steps = ai ? (image ? ['Reading your screenshot…', ...STEPS.slice(0, 3), STEPS[4]] : STEPS) : STEPS.filter((s) => !s.includes('AI'));
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), image ? 1800 : 900);
    return () => clearInterval(t);
  }, [steps.length, image]);
  return (
    <div className="card p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-100 border-t-sunset-500" />
        <span className="font-semibold text-navy-950">{steps[i]}</span>
      </div>
      <ol className="mt-4 flex gap-1.5" aria-hidden="true">
        {steps.map((s, k) => <li key={s} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${k <= i ? 'bg-sunset-500' : 'bg-slate-100'}`} />)}
      </ol>
      <div className="mt-6 space-y-2.5">
        <div className="shimmer h-12 rounded-xl" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
        <div className="shimmer h-28 rounded-xl" />
      </div>
    </div>
  );
}

function EmptyState() {
  const tips = [
    ['Include the From: line', "The sender's real address is often the biggest giveaway."],
    ['Keep the links', 'Riptide checks where every link really goes, not what it says.'],
    ['Screenshots work too', 'Snap a text or DM and drop it in. QR codes get decoded.'],
  ];
  return (
    <div className="card flex h-full min-h-80 flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-800"><ShieldCheck className="h-8 w-8" /></div>
      <p className="mt-4 font-display text-lg font-bold text-navy-950">Your verdict will appear here</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">Paste a message on the left, or try one of the examples.</p>
      <ul className="mt-6 grid grid-cols-1 w-full max-w-lg gap-2 text-left sm:grid-cols-3">
        {tips.map(([t, d]) => (
          <li key={t} className="rounded-xl bg-sand-50 p-3 ring-1 ring-slate-100">
            <div className="text-xs font-semibold text-navy-950">{t}</div>
            <div className="mt-0.5 text-xs leading-snug text-slate-500">{d}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QRFound({ codes, aiOn }) {
  if (!codes?.length) {
    return <p className="mt-2 text-xs text-slate-500">No QR code found in this image.</p>;
  }
  return (
    <div className="mt-3 rounded-xl border border-navy-100 bg-navy-50 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-950"><QRIcon className="h-4 w-4" /> QR code found. It leads to:</div>
      <ul className="mt-1.5 space-y-1">
        {codes.map((c) => <li key={c} className="break-all rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-800">{c}</li>)}
      </ul>
      <p className="mt-1.5 text-xs text-slate-500">Decoded on your device. {aiOn ? 'Riptide will check this link along with the message.' : 'Riptide will check this link.'} Don't scan it with your phone until you know it's safe.</p>
    </div>
  );
}

function QRIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h7v-4M17 17h.01" />
    </svg>
  );
}

const ACTION_TONE = {
  scam: { wrap: 'bg-navy-900 text-white', title: 'Do this now', icon: Octagon, iconCls: 'bg-critical text-white', num: 'bg-white/15', text: 'text-navy-50' },
  suspicious: { wrap: 'bg-navy-900 text-white', title: 'Verify before you act', icon: Alert, iconCls: 'bg-warning text-navy-950', num: 'bg-white/15', text: 'text-navy-50' },
  safe: { wrap: 'card', title: 'Looks okay. Stay alert', icon: CheckCircle, iconCls: 'bg-green-50 text-good-ink', num: 'bg-navy-50 text-navy-900', text: 'text-slate-700' },
};

export default function Check({ health }) {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeN, setActiveN] = useState(null);
  const [share, setShare] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const resultRef = useRef(null);
  const textRef = useRef(null);
  const aiOn = !!health?.ai;

  const items = useMemo(() => (result?.flags || []).map((f, i) => ({ ...f, n: i + 1 })), [result]);

  const onFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please choose an image file (PNG or JPG).'); return; }
    setMode('image');
    try { setImage(await imageToPayload(file)); } catch (e) { setError(e.message); }
  }, []);

  // Paste a screenshot from the clipboard anywhere on the page (Cmd/Ctrl + V).
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
      if (file) { e.preventDefault(); onFile(file); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);

  async function analyze(payloadText) {
    const t = payloadText ?? text;
    const imageMode = mode === 'image' && payloadText == null;
    setError('');
    setResult(null);
    setShare('idle');
    setActiveN(null);
    setLoading({ image: imageMode });
    if (window.innerWidth < 1024) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const body = imageMode ? { image: image && { mediaType: image.mediaType, data: image.data }, qr: image?.qr || [] } : { text: t };
      const r = await api.analyze(body);
      setResult(r);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function tryExample(ex) {
    setMode('text');
    setText(ex.text);
    analyze(ex.text);
  }

  async function pasteText() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) { setText(t.slice(0, 10000)); setMode('text'); textRef.current?.focus(); }
    } catch {
      setError('Your browser blocked clipboard access. Click in the box and press ' + (isMac ? '⌘' : 'Ctrl') + ' + V instead.');
    }
  }

  function reset() {
    setText(''); setImage(null); setResult(null); setError(''); setMode('text');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => textRef.current?.focus(), 250);
  }

  async function doShare() {
    setShare('sending');
    try {
      await api.share(result.text, result);
      setShare('done');
    } catch (e) {
      setShare('idle');
      setError(e.message);
    }
  }

  const imageBlocked = mode === 'image' && !aiOn && !image?.qr?.length;
  const canSubmit = !loading && (mode === 'text' ? text.trim().length > 0 : !!image) && !imageBlocked;
  const tone = result ? ACTION_TONE[result.verdict] || ACTION_TONE.suspicious : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <PageHeader
        eyebrow="Scam checker"
        icon={ShieldCheck}
        title="Is this a scam?"
        description="Paste a suspicious email, text or DM, or drop in a screenshot. You'll get a risk score, every red flag highlighted, and exactly what to do next."
      />

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---------- Input ---------- */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div
            className={`card p-4 transition sm:p-5 ${dragging ? 'ring-4 ring-sea-300' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0]); }}
          >
            <div role="tablist" aria-label="Input type" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
              {[['text', 'Paste text', Type], ['image', 'Screenshot', Image]].map(([id, label, Ico]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => { setMode(id); setError(''); }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === id ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Ico className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {mode === 'text' ? (
              <div className="mt-3">
                <label htmlFor="msg" className="sr-only">Message to check</label>
                <textarea
                  id="msg"
                  ref={textRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 10000))}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) { e.preventDefault(); analyze(); } }}
                  rows={11}
                  placeholder={'From: Pepperdine IT <helpdesk@...>\nSubject: Action required\n\nPaste the whole message here…'}
                  className="field resize-y p-3.5 font-mono text-[13px] leading-relaxed text-slate-800"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={pasteText} className="btn btn-outline btn-sm"><Clipboard className="h-4 w-4" /> Paste</button>
                  {text && <button type="button" onClick={() => { setText(''); textRef.current?.focus(); }} className="btn btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Trash className="h-4 w-4" /> Clear</button>}
                  <span className="ml-auto text-xs tabular text-slate-400">{text.length.toLocaleString()} / 10,000</span>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                {!aiOn && (
                  <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-warning-ink ring-1 ring-amber-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" /> The AI layer is off, so Riptide can't read the words in a screenshot right now. It can still check where a QR code in it leads. For a full check, paste the text.
                  </p>
                )}
                {image ? (
                  <div>
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-sand-50">
                      <img src={image.preview} alt="Uploaded screenshot" className="max-h-80 w-full object-contain" />
                      <button onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 shadow ring-1 ring-slate-200 transition hover:bg-white" aria-label="Remove screenshot"><XIcon className="h-4 w-4" /></button>
                    </div>
                    <QRFound codes={image.qr} aiOn={aiOn} />
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-sand-50 px-4 py-12 text-center transition hover:border-navy-700 hover:bg-navy-50"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-navy-800 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105"><Upload className="h-6 w-6" /></span>
                    <span className="mt-3 font-semibold text-navy-950">Drop a screenshot or click to upload</span>
                    <span className="mt-1 text-xs text-slate-500">PNG or JPG, up to 5 MB · or paste with <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span> <span className="kbd">V</span></span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Screenshots are sent to the AI provider as-is. Crop out anything personal first.
                  {health?.ai?.provider === 'Gemini' && " This demo uses Google Gemini's free tier, where Google may use what's sent to improve its models."}
                </p>
              </div>
            )}

            <button onClick={() => analyze()} disabled={!canSubmit} className="btn btn-primary btn-lg mt-4 w-full">
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ShieldCheck className="h-5 w-5" />}
              {loading ? 'Checking…' : 'Check this message'}
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Not stored. Personal numbers removed before AI.</span>
              {mode === 'text' && <span className="hidden sm:inline"><span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span> <span className="kbd">Enter</span> to check</span>}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="text-sm font-semibold text-navy-950">Try an example</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => tryExample(ex)} disabled={!!loading} className="rounded-full border border-slate-200 bg-sand-50 px-3 py-1.5 text-sm text-slate-700 transition hover:-translate-y-px hover:border-navy-700 hover:bg-white hover:text-navy-950 disabled:opacity-50">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Result ---------- */}
        <div ref={resultRef} className="min-w-0 scroll-mt-24">
          {error && (
            <div className="fade-in mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-critical-ink" role="alert">
              <Info className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {loading && <Loading ai={aiOn} image={loading.image} />}
          {!loading && !result && !error && <EmptyState />}
          {!loading && result && (
            <div className="space-y-4">
              {/* 1. Verdict */}
              <div className="card pop-in p-5 sm:p-6">
                <RiskMeter score={result.score} verdict={result.verdict} layers={result.layers} />
                <p className="mt-5 text-lg font-medium leading-snug text-navy-950">{result.summary}</p>
                {result.engine.aiError && <p className="mt-2 text-xs text-warning-ink">{result.engine.aiError}</p>}
              </div>

              {/* 2. What to do */}
              <div className={`fade-in rounded-[1.25rem] p-5 sm:p-6 ${tone.wrap}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.iconCls}`}><tone.icon className="h-5 w-5" /></span>
                  <h2 className={`text-lg font-bold ${result.verdict === 'safe' ? 'text-navy-950' : ''}`}>{tone.title}</h2>
                </div>
                <ol className="mt-4 space-y-2.5">
                  {result.actions.map((a, i) => (
                    <li key={a} className={`flex gap-3 text-sm leading-relaxed ${tone.text}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone.num}`}>{i + 1}</span>
                      <span className="pt-0.5">{a}</span>
                    </li>
                  ))}
                </ol>
                {result.verdict !== 'safe' && (
                  <div className="mt-5 flex flex-wrap gap-2 text-sm">
                    <a href="tel:+13105064357" className="btn btn-sm bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"><Phone className="h-4 w-4" /> Tech Support {PEPPERDINE.techSupportPhone}</a>
                    <a href="#report" onClick={(e) => { e.preventDefault(); document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="btn btn-sm bg-white text-navy-950 hover:bg-navy-50"><Hook className="h-4 w-4" /> How to report it</a>
                  </div>
                )}
              </div>

              {/* 3. The evidence */}
              <div className="card fade-in p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-navy-950">{items.length ? 'The message, with red flags highlighted' : 'The message'}</h2>
                  {items.length > 0 && <span className="text-xs text-slate-500">Hover or tap a highlight</span>}
                </div>
                {result.fromImage && (
                  <p className="mt-1 text-xs text-slate-500">
                    {result.qr?.only
                      ? "Only the QR code was checked (the AI layer is off, so the screenshot's words weren't read)."
                      : `Text read from your screenshot by the AI${result.qr ? ', plus where its QR code leads' : ''}.`}
                  </p>
                )}
                <div className="mt-3 max-h-[26rem] overflow-auto rounded-xl bg-sand-50 p-4 pt-7 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-100">
                  <RichText text={result.text} items={items} activeN={activeN} onActivate={setActiveN} />
                </div>
              </div>

              {items.length > 0 && (
                <div className="card fade-in p-5 sm:p-6">
                  <h2 className="mb-3 font-bold text-navy-950">{items.length} red flag{items.length === 1 ? '' : 's'}</h2>
                  <FlagList items={items} activeN={activeN} onActivate={setActiveN} showSource />
                </div>
              )}

              {result.signals.length > 0 && (
                <div className="card fade-in p-5 sm:p-6">
                  <h2 className="mb-2 font-bold text-navy-950">Good signs</h2>
                  <ul className="space-y-1.5">
                    {result.signals.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-good-ink" />{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Report + share */}
              {result.verdict !== 'safe' && <div id="report" className="scroll-mt-24"><ReportPanel result={result} /></div>}

              {result.verdict !== 'safe' && (
                <div className="card p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sunset-50 text-sunset-600"><Users className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <h2 className="font-bold text-navy-950">Help others spot this one</h2>
                      <p className="mt-1 text-sm text-slate-600">Share it anonymously. Phone and ID numbers are removed, and Pepperdine IT reviews it before it becomes a training round.</p>
                      {share === 'done' ? (
                        <p className="pop-in mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-good-ink"><CheckCircle className="h-4 w-4" /> Thanks! Sent for review.</p>
                      ) : (
                        <button onClick={doShare} disabled={share === 'sending'} className="btn btn-outline btn-sm mt-3">
                          {share === 'sending' ? 'Sharing…' : 'Share anonymously'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <details className="card group p-5 text-sm text-slate-600 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-navy-950">
                  <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Privacy: what happened to your message</span>
                  <span className="text-slate-400 transition group-open:rotate-90"><Arrow className="h-4 w-4" /></span>
                </summary>
                <ul className="mt-3 space-y-1.5">
                  <li>• Stored on our server: <b>no</b> (only anonymous counts)</li>
                  <li>• Analyzed by: rules engine{result.engine.ai ? ` + AI (${result.engine.ai.provider}, ${result.engine.ai.model})` : ' only'}</li>
                  <li>• Items removed before AI: <b>{result.privacy.redactions}</b>{result.privacy.redactionTypes.length ? ` (${result.privacy.redactionTypes.join(', ')})` : ''}</li>
                </ul>
                {result.privacy.sentToAI && (
                  <>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Exactly what the AI saw</div>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-sand-50 p-3 font-mono text-xs">{result.privacy.sentToAI}</pre>
                  </>
                )}
              </details>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button onClick={reset} className="btn btn-outline btn-lg w-full"><Refresh className="h-5 w-5" /> Check another message</button>
                <a href="#/train" className="btn btn-dark btn-lg w-full">Practice with Spot the Phish <Arrow className="h-5 w-5" /></a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
