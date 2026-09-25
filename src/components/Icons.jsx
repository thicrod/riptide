// Minimal inline icon set (stroke icons, 24px grid). Decorative unless given a title.

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };

function Icon({ children, className = 'w-5 h-5', title, ...rest }) {
  return (
    <svg {...base} className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...rest}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const WaveLogo = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="#00205B" />
    <path d="M8 38c6 0 8-6 14-6s8 6 14 6 8-6 14-6 6 3 6 3" fill="none" stroke="#E35205" strokeWidth="5" strokeLinecap="round" />
    <path d="M8 26c6 0 8-6 14-6s8 6 14 6 8-6 14-6 6 3 6 3" fill="none" stroke="#7fc8f8" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const Shield = (p) => <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /></Icon>;
export const ShieldCheck = (p) => <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
export const Check = (p) => <Icon {...p}><path d="m5 12 5 5L20 7" /></Icon>;
export const CheckCircle = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>;
export const XIcon = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const Alert = (p) => <Icon {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17.5v.01" /></Icon>;
export const Octagon = (p) => <Icon {...p}><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Z" /><path d="M12 8v5M12 16.5v.01" /></Icon>;
export const Info = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></Icon>;
export const Mail = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>;
export const Phone = (p) => <Icon {...p}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></Icon>;
export const Mic = (p) => <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>;
export const Chat = (p) => <Icon {...p}><path d="M4 5h16v11H9l-5 4V5Z" /></Icon>;
export const LinkIcon = (p) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>;
export const Paperclip = (p) => <Icon {...p}><path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" /></Icon>;
export const Upload = (p) => <Icon {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></Icon>;
export const Sparkles = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Icon>;
export const Lock = (p) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>;
export const Users = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></Icon>;
export const Arrow = (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const ArrowLeft = (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>;
export const Trophy = (p) => <Icon {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></Icon>;
export const Hook = (p) => <Icon {...p}><path d="M12 2v10a4 4 0 1 1-8 0v-1" /><path d="m2 13 2-2 2 2" /></Icon>;
export const Gauge = (p) => <Icon {...p}><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 18 4-6" /></Icon>;
export const Refresh = (p) => <Icon {...p}><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" /></Icon>;
export const Eye = (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const Cpu = (p) => <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></Icon>;
export const ListIcon = (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Icon>;
export const Flame = (p) => <Icon {...p}><path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 12 11 12c0-4 1-9 1-9Z" /></Icon>;
export const HomeIcon = (p) => <Icon {...p}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></Icon>;
export const BarChart = (p) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>;
export const Clipboard = (p) => <Icon {...p}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 11h6M9 15h4" /></Icon>;
export const Trash = (p) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Icon>;
export const Zap = (p) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Icon>;
export const Target = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon>;
export const ChevronRight = (p) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
export const Image = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></Icon>;
export const Type = (p) => <Icon {...p}><path d="M5 6V4h14v2M12 4v16M9 20h6" /></Icon>;
