// Fills the dashboard with SAMPLE data for demos. Undo with `npm run reset`.
import { seedSampleData } from '../lib/sample.js';

const { checks, reports } = seedSampleData();
console.log(`Seeded sample data: ${checks} checks, ${reports} community reports, 3 leaderboard scores.`);
