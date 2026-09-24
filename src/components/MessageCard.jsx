import { useEffect, useState } from 'react';
import RichText from './RichText.jsx';
import { Mail, Phone, Mic, Chat, Paperclip, Info, Users, Lock } from './Icons.jsx';

const DETAIL_FIELDS = ['mailedBy', 'signedBy', 'to', 'replyTo'];

// Gmail-style "show details" values. mailed-by / signed-by default to the sender's own domain;
// signedBy: null means the message was not signed (Gmail simply omits the line).
export function emailDetails(card) {
  const d = card.details || {};
  const domain = (card.from?.address || '').split('@')[1] || '';
  return {
    replyTo: d.replyTo || null,
    to: d.to || 'you@pepperdine.edu',
    mailedBy: d.mailedBy || domain,
    signedBy: d.signedBy === null ? null : d.signedBy || domain,
  };
}

// Decide which field each flag highlights in (first field that contains its quote).
function assignFlags(card, items) {
  const det = card.channel === 'email' ? emailDetails(card) : {};
  const fields = [
    ['name', card.from?.name],
    ['address', card.from?.address],
    ['subject', card.subject],
    ['body', card.body],
    ...(card.attachments || []).map((a, i) => [`att${i}`, a.name]),
    ...DETAIL_FIELDS.map((k) => [k, det[k]]),
  ];
  const out = {};
  for (const it of items) {
    const hit = fields.find(([, v]) => v && v.includes(it.quote));
    if (hit) (out[hit[0]] ||= []).push(it);
  }
  return out;
}

function Avatar({ label, channel }) {
  const initial = (label || '?').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || '#';
  const tone = channel === 'sms' || channel === 'voicemail' ? 'bg-slate-200 text-slate-600' : 'bg-navy-100 text-navy-900';
  return <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}>{initial}</div>;
}

function FakeQR() {
  // Decorative, deterministic QR-looking pattern (not scannable on purpose).
  const cells = [];
  let seed = 7;
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      seed = (seed * 9301 + 49297) % 233280;
      if (finder) {
        const lx = x > 13 ? x - 14 : x;
        const ly = y > 13 ? y - 14 : y;
        const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
        if (ring) cells.push([x, y]);
      } else if (seed / 233280 > 0.55) cells.push([x, y]);
    }
  }
  return (
    <svg viewBox="-1 -1 23 23" className="h-32 w-32 rounded-md bg-white p-1 ring-1 ring-slate-200" aria-label="QR code image">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" />)}
    </svg>
  );
}

export default function MessageCard({ card, items = [], revealed = false, activeN, onActivate }) {
  const a = assignFlags(card, items);
  const [showDetails, setShowDetails] = useState(false);
  const flaggedDetails = DETAIL_FIELDS.some((k) => a[k]?.length);
  useEffect(() => { setShowDetails(false); }, [card.id]);
  useEffect(() => { if (revealed && flaggedDetails) setShowDetails(true); }, [revealed, flaggedDetails]);
  const det = card.channel === 'email' ? emailDetails(card) : null;
  const rt = (field, text, extra = {}) => (
    <RichText text={text} items={a[field] || []} revealed={revealed} activeN={activeN} onActivate={onActivate} {...extra} />
  );
  const channelMeta = {
    email: { icon: Mail, label: 'Email' },
    sms: { icon: Phone, label: 'Text message' },
    voicemail: { icon: Mic, label: 'Voicemail' },
    dm: { icon: Chat, label: `${card.platform || 'Social'} message` },
  }[card.channel] || { icon: Mail, label: 'Message' };
  const ChannelIcon = channelMeta.icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5"><ChannelIcon className="h-4 w-4" />{channelMeta.label}</span>
        <span className="inline-flex items-center gap-2">
          {card.community && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunset-100 px-2 py-0.5 font-semibold text-sunset-600">
              <Users className="h-3.5 w-3.5" /> Reported at Pepperdine
            </span>
          )}
          {card.time}
        </span>
      </div>

      {card.context && (
        <div className="flex items-start gap-2 border-b border-sky-100 bg-sea-100 px-4 py-2 text-sm text-navy-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span><span className="font-semibold">Context:</span> {card.context}</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {card.channel === 'email' && (
          <>
            <div className="flex items-start gap-3">
              <Avatar label={card.from?.name} channel="email" />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold text-slate-900">{rt('name', card.from?.name)}</div>
                {card.from?.address && <div className="break-all text-slate-500">&lt;{rt('address', card.from.address)}&gt;</div>}
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-expanded={showDetails}
                  className="mt-0.5 inline-flex items-center gap-1 rounded text-xs text-slate-500 hover:text-navy-900"
                >
                  to me
                  <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition ${showDetails ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5z" /></svg>
                  <span className="underline decoration-dotted underline-offset-2">{showDetails ? 'hide details' : 'show details'}</span>
                </button>
              </div>
            </div>
            {showDetails && det && (
              <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <dt className="text-right text-slate-400">from:</dt>
                <dd className="break-all text-slate-700"><span className="font-semibold">{card.from?.name}</span> &lt;{card.from?.address}&gt;</dd>
                {det.replyTo && (<><dt className="text-right text-slate-400">reply-to:</dt><dd className="break-all text-slate-700">{rt('replyTo', det.replyTo)}</dd></>)}
                <dt className="text-right text-slate-400">to:</dt>
                <dd className="break-all text-slate-700">{rt('to', det.to)}</dd>
                <dt className="text-right text-slate-400">date:</dt>
                <dd className="text-slate-700">{card.time}</dd>
                <dt className="text-right text-slate-400">subject:</dt>
                <dd className="text-slate-700">{card.subject}</dd>
                <dt className="text-right text-slate-400">mailed-by:</dt>
                <dd className="break-all text-slate-700">{rt('mailedBy', det.mailedBy)}</dd>
                {det.signedBy && (<><dt className="text-right text-slate-400">signed-by:</dt><dd className="break-all text-slate-700">{rt('signedBy', det.signedBy)}</dd></>)}
                <dt className="text-right text-slate-400">security:</dt>
                <dd className="flex items-center gap-1 text-slate-700"><Lock className="h-3 w-3" /> Standard encryption (TLS)</dd>
              </dl>
            )}
            {card.subject && <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-900">{rt('subject', card.subject)}</h3>}
            <div className="mt-3 text-[15px] leading-relaxed text-slate-800">{rt('body', card.body, { links: card.links })}</div>
          </>
        )}

        {(card.channel === 'sms' || card.channel === 'voicemail' || card.channel === 'dm') && (
          <>
            <div className="flex items-center gap-3">
              <Avatar label={card.from?.name} channel={card.channel} />
              <div className="min-w-0 text-sm">
                <div className="break-all font-semibold text-slate-900">{rt('name', card.from?.name)}</div>
                {card.from?.address && <div className="text-xs text-slate-500">{rt('address', card.from.address)}</div>}
              </div>
            </div>
            {card.channel === 'voicemail' ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-white">
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
                    {Array.from({ length: 42 }, (_, i) => (
                      <span key={i} className="w-1 rounded-full bg-slate-300" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 80}%` }} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">0:21</span>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Transcript</div>
                <div className="mt-1 text-[15px] leading-relaxed text-slate-800">{rt('body', card.body, { links: card.links })}</div>
              </div>
            ) : (
              <div className={`mt-4 max-w-[92%] rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed ${card.channel === 'dm' ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-900'}`}>
                {rt('body', card.body, { links: card.links })}
              </div>
            )}
          </>
        )}

        {card.qr && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <FakeQR />
            {revealed && (
              <div className="text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">This QR code opens</div>
                <div className="mt-1 break-all font-mono text-critical-ink">{card.qr}</div>
              </div>
            )}
          </div>
        )}

        {card.attachments?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.attachments.map((att, i) => (
              <div key={att.name} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-800">{rt(`att${i}`, att.name)}</span>
                <span className="text-xs text-slate-400">{att.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
