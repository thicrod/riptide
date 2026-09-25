// Game levels and scoring. Small on purpose: the web app imports this without the question bank.
export const LEVELS = {
  1: { name: 'Look closer', blurb: 'One tiny detail gives each scam away: a letter, a dash, a dot.' },
  2: { name: 'Pixel-perfect', blurb: 'Faked From lines, hidden headers, invisible lookalike letters.' },
  3: { name: 'AI-era', blurb: 'Flawless writing, hacked real accounts, cloned voices.' },
};

export const LEVEL_POINTS = { 1: 100, 2: 150, 3: 200 };
export const TWIN_POINTS = 250;
