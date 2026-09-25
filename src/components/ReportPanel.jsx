import { useState } from 'react';
import { PEPPERDINE } from '../../shared/categories.js';
import { buildReport } from '../lib/report.js';
import { Hook, Phone, Mail, Check, Alert, Lock } from './Icons.jsx';

/** Pepperdine's real reporting paths: Phish Alert Button normally, the Information Security Office if you already took the bait. */
export default function ReportPanel({ result }) {
  const [path, setPath] = useState('safe');
  const [copied, setCopied] = useState(false);
  const report = buildReport(result);
  const subject = 'Security incident: I may have responded to a phishing message';
  const mailto = `mailto:${PEPPERDINE.isoEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`To: ${PEPPERDINE.isoEmail}\nSubject: ${subject}\n\n${report}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked: the email button still works */ }
  }

  const tab = (id, label) => (
    <button
      role="tab"
      aria-selected={path === id}
      onClick={() => setPath(id)}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${path === id ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunset-50 text-sunset-600"><Hook className="h-5 w-5" /></span><h2 className="font-bold text-navy-950">Report it to Pepperdine</h2></div>
      <div role="tablist" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {tab('safe', "I didn't click anything")}
        {tab('hooked', 'I clicked or replied')}
      </div>

      {path === 'safe' ? (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <ol className="space-y-2">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-900">1</span><span className="pt-0.5">Open the message in Gmail, in Chrome, signed in with your Pepperdine account.</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-900">2</span><span className="pt-0.5">Click the <b>orange fish hook</b> (Phish Alert Button) above the message. It reports it to IT and removes it from your inbox.</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-900">3</span><span className="pt-0.5">Got it as a text? Don't reply. Forward it to <b>7726</b> (SPAM), then delete it.</span></li>
          </ol>
          <p className="flex items-start gap-2 rounded-lg bg-sand-50 p-3 text-xs text-slate-600"><Alert className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" /><span>Pepperdine IT asks people <b>not to forward</b> suspected phishing emails. Use the Phish Alert Button instead.</span></p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p className="rounded-lg bg-red-50 p-3 font-medium text-critical-ink ring-1 ring-red-200">Act now. The first few minutes matter most, because attackers move fast once they have a password or code.</p>
          <ol className="space-y-2">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-critical text-xs font-bold text-white">1</span><span className="pt-0.5"><b>Call the Information Security Office: {PEPPERDINE.isoPhone}</b>. If it goes to voicemail, follow the message to have them paged, 24/7.</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-critical text-xs font-bold text-white">2</span><span className="pt-0.5">Change your Pepperdine password from a device you trust, and anywhere else you use the same one.</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-critical text-xs font-bold text-white">3</span><span className="pt-0.5">Follow up by email with the details. Riptide filled in what it found; you add your name, callback number and what you shared.</span></li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:+1${PEPPERDINE.isoPhone.replace(/\D/g, '')}`} className="inline-flex items-center gap-1.5 rounded-lg bg-critical px-3 py-2 font-semibold text-white transition hover:bg-critical-ink"><Phone className="h-4 w-4" /> Call ISO</a>
            <a href={mailto} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 font-semibold text-white transition hover:bg-navy-800"><Mail className="h-4 w-4" /> Email the report</a>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-navy-950 transition hover:border-navy-900">
              {copied ? <><Check className="h-4 w-4 text-good-ink" /> Copied</> : 'Copy report'}
            </button>
          </div>
          <details className="rounded-lg bg-sand-50 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-navy-950">Preview the report</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700">{report}</pre>
          </details>
          <p className="flex items-start gap-2 text-xs text-slate-500"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> The report opens in your own email app. Riptide doesn't send or store it. Links are "defanged" (hxxp, [.]) so nobody opens them by accident.</p>
        </div>
      )}
    </div>
  );
}
