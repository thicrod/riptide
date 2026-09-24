// SAMPLE data for demos. The dashboard shows a "Sample data" badge while it is loaded,
// so nobody mistakes it for real campus numbers. Used by `npm run seed` and, on hosts
// without persistent storage (like Render's free plan), automatically at startup when
// SEED_SAMPLE_DATA=true.

import { replaceState } from './store.js';
import { analyzeWithRules } from './rules.js';

export function seedSampleData() {
  const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
  const daily = {};
  [31, 44, 38, 57, 49, 63, 41].forEach((n, i) => { daily[day(6 - i)] = n; });
  const checks = Object.values(daily).reduce((a, b) => a + b, 0);

  const samples = [
    `From: Pepperdine Payroll <payroll.dept@gmail.com>
Subject: Direct deposit update required

Dear Staff, your direct deposit will be suspended within 24 hours. Please verify your account at bit.ly/pepp-payroll to continue receiving payments.`,
    `From: Career Services <jobs@pepperdine-careers.net>
Subject: Remote assistant role - $500 per week

No experience needed! We will send you a check to purchase the equipment. Reply with your personal email to start.`,
    `From: Google Drive <drive-share@docs-google.share-files.net>
Subject: "Midterm_Grades.xlsx" shared with you

Please sign in with your Pepperdine account to view the file.`,
    `From: Pepperdine IT Service Desk <it-servicedesk@pepperdine-edu.org>
Subject: Password expires today

Your password expires today. Confirm your password here to keep access: https://pepperdine-edu.org/reset`,
  ];

  const submissions = samples.map((text, i) => {
    const r = analyzeWithRules(text);
    return {
      id: `sample-${i + 1}`,
      createdAt: new Date(Date.now() - (i + 1) * 3600000 * 5).toISOString(),
      text,
      verdict: r.verdict,
      score: r.score,
      flags: r.flags.map(({ quote, category, severity, why }) => ({ quote, category, severity, why })),
      status: i === 3 ? 'approved' : 'pending',
    };
  });

  replaceState({
    sampleData: true,
    stats: {
      checks,
      byVerdict: { safe: Math.round(checks * 0.34), suspicious: Math.round(checks * 0.27), scam: checks - Math.round(checks * 0.34) - Math.round(checks * 0.27) },
      byCategory: {
        credentials: 118, lookalike_domain: 96, urgency: 141, sender_spoof: 74, job_scam: 52,
        money: 39, link_mismatch: 61, mfa_code: 23, risky_link: 58, impersonation: 31,
      },
      daily,
    },
    submissions,
    leaderboard: [
      { name: 'wave_rider', score: 1650, correct: 10, total: 10, createdAt: new Date().toISOString() },
      { name: 'seaver_sam', score: 1400, correct: 9, total: 10, createdAt: new Date().toISOString() },
      { name: 'malibu_mo', score: 1150, correct: 8, total: 10, createdAt: new Date().toISOString() },
    ],
  });
  return { checks, reports: submissions.length };
}
