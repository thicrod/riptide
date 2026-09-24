import { useEffect, useMemo, useRef, useState } from 'react';
import { api, imageToPayload } from '../lib/api.js';
import { EXAMPLES } from '../lib/examples.js';
import { PEPPERDINE } from '../../shared/categories.js';
import RichText from '../components/RichText.jsx';
import FlagList from '../components/FlagList.jsx';
import { RiskMeter } from '../components/Verdict.jsx';
import {
  ShieldCheck, Upload, Lock, CheckCircle, Hook, Users, Info, XIcon, Phone, Arrow,
} from '../components/Icons.jsx';

const STEPS = ['Checking sender and domains…', 'Following every link…', 'Scanning for pressure tactics…', 'Asking the AI analyst…', 'Combining the evidence…'];

function Loading({ ai }) {
  const steps = ai ? STEPS : STEPS.filter((s) => !s.includes('AI'));
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 900);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-100 border-t-navy-900" />
        <span className="font-medium text-navy-950">{steps[i]}</span>
      </div>
      <div className="mt-5 space-y-2">
        <div className="shimmer h-10 rounded-lg" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
        <div className="shimmer h-24 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center">
      <ShieldCheck className="h-10 w-10 text-navy-100" />
      <p className="mt-3 font-semibold text-navy-950">Your results will appear here</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">Tip: include the <b>From:</b> line. The sender's real address is often the biggest giveaway.</p>
    </div>
  );
}

export default function Check({ health }) {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeN, setActiveN] = useState(null);
  const [share, setShare] = useState('idle');
  const fileRef = useRef(null);
  const resultRef = useRef(null);
  const aiOn = !!health?.ai;

  const items = useMemo(() => (result?.flags || []).map((f, i) => ({ ...f, n: i + 1 })), [result]);

  async function onFile(file) {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please choose an image file (PNG or JPG).'); return; }
    try { setImage(await imageToPayload(file)); } catch (e) { setError(e.message); }
  }

  async function analyze(payloadText) {
    const t = payloadText ?? text;
    setError('');
    setResult(null);
    setShare('idle');
    setActiveN(null);
    setLoading(true);
    try {
      const body = mode === 'image' && payloadText == null ? { image: image && { mediaType: image.mediaType, data: image.data } } : { text: t };
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

  const canSubmit = !loading && (mode === 'text' ? text.trim().length > 0 : !!image);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-navy-950">Is this a scam?</h1>
        <p className="mt-2 text-slate-600">Paste a suspicious email, text or DM, or upload a screenshot. You'll get a risk score, every red flag highlighted, and what to do next.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Input */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div role="tablist" className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
              {[['text', 'Paste text'], ['image', 'Screenshot']].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => { setMode(id); setError(''); }}
                  className={`rounded-md px-3 py-1.5 transition ${mode === id ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'text' ? (
              <>
                <label htmlFor="msg" className="sr-only">Message to check</label>
                <textarea
                  id="msg"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 10000))}
                  rows={12}
                  placeholder={'From: Pepperdine IT <helpdesk@...>\nSubject: Action required\n\nPaste the whole message here…'}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-sand-50 p-3 font-mono text-sm leading-relaxed text-slate-800 outline-none transition focus:border-navy-700 focus:bg-white focus:ring-4 focus:ring-navy-100"
                />
                <div className="mt-1 text-right text-xs text-slate-400">{text.length.toLocaleString()} / 10,000</div>
              </>
            ) : (
              <div>
                {!aiOn && (
                  <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-warning-ink">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" /> Reading screenshots needs the AI layer, which is off right now. Paste the text instead.
                  </p>
                )}
                {image ? (
                  <div className="relative">
                    <img src={image.preview} alt="Uploaded screenshot" className="max-h-80 w-full rounded-xl border border-slate-200 object-contain" />
                    <button onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow" aria-label="Remove screenshot"><XIcon className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-sand-50 px-4 py-12 text-center transition hover:border-navy-700"
                  >
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="mt-2 font-medium text-navy-950">Drop a screenshot or click to upload</span>
                    <span className="mt-1 text-xs text-slate-500">PNG or JPG, up to 5 MB</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <p className="mt-2 text-xs text-slate-500">Screenshots are sent to the AI provider as-is. Crop out anything personal first.</p>
              </div>
            )}

            <button
              onClick={() => analyze()}
              disabled={!canSubmit || (mode === 'image' && !aiOn)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sunset-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-sunset-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-5 w-5" /> {loading ? 'Checking…' : 'Check this message'}
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Not stored. Phone and ID numbers are removed before AI analysis.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-navy-950">Try an example</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => tryExample(ex)} disabled={loading} className="rounded-full border border-slate-200 bg-sand-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-navy-700 hover:text-navy-950 disabled:opacity-50">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        <div ref={resultRef} className="scroll-mt-20">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-critical-ink" role="alert">
              <Info className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {loading && <Loading ai={aiOn} />}
          {!loading && !result && !error && <EmptyState />}
          {!loading && result && (
            <div className="fade-in space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <RiskMeter score={result.score} verdict={result.verdict} layers={result.layers} />
                <p className="mt-4 text-lg font-medium text-navy-950">{result.summary}</p>
                {result.engine.aiError && <p className="mt-2 text-xs text-warning-ink">{result.engine.aiError}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-navy-950">The message, with red flags highlighted</h2>
                  {items.length > 0 && <span className="text-xs text-slate-500">Hover or tap a highlight</span>}
                </div>
                {result.fromImage && <p className="mt-1 text-xs text-slate-500">Text read from your screenshot by the AI.</p>}
                <div className="mt-3 max-h-96 overflow-auto rounded-xl bg-sand-50 p-4 pt-8 text-sm leading-relaxed text-slate-800">
                  <RichText text={result.text} items={items} activeN={activeN} onActivate={setActiveN} />
                </div>
              </div>

              {items.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 font-semibold text-navy-950">{items.length} red flag{items.length === 1 ? '' : 's'}</h2>
                  <FlagList items={items} activeN={activeN} onActivate={setActiveN} showSource />
                </div>
              )}

              {result.signals.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-2 font-semibold text-navy-950">Good signs</h2>
                  <ul className="space-y-1.5">
                    {result.signals.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-good-ink" />{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-navy-900 bg-navy-900 p-5 text-white">
                <h2 className="font-semibold">What to do now</h2>
                <ol className="mt-3 space-y-2">
                  {result.actions.map((a, i) => (
                    <li key={a} className="flex gap-3 text-sm text-navy-50">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">{i + 1}</span>
                      <span className="pt-0.5">{a}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <a href="tel:+13105064357" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20"><Phone className="h-4 w-4" /> Tech Support {PEPPERDINE.techSupportPhone}</a>
                  <a href={PEPPERDINE.reportIncidentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20"><Hook className="h-4 w-4" /> Report to Pepperdine IT</a>
                </div>
              </div>

              {result.verdict !== 'safe' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-sunset-600" />
                    <div className="flex-1">
                      <h2 className="font-semibold text-navy-950">Help others spot this one</h2>
                      <p className="mt-1 text-sm text-slate-600">Share this message anonymously. Phone and ID numbers are removed, and Pepperdine IT reviews it before it becomes a training round.</p>
                      {share === 'done' ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-good-ink"><CheckCircle className="h-4 w-4" /> Thanks! Sent for review.</p>
                      ) : (
                        <button onClick={doShare} disabled={share === 'sending'} className="mt-3 rounded-lg border border-navy-900 px-3 py-1.5 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white disabled:opacity-50">
                          {share === 'sending' ? 'Sharing…' : 'Share anonymously'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <details className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                <summary className="cursor-pointer font-semibold text-navy-950">Privacy: what happened to your message</summary>
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

              <a href="#/train" className="flex items-center justify-between rounded-2xl bg-sunset-100 p-5 font-semibold text-sunset-600 transition hover:bg-orange-100">
                Want to spot these on your own? Play Spot the Phish <Arrow className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
