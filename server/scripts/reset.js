// Clears all stored stats, reports and scores (removes the sample data).
import { replaceState } from '../lib/store.js';

replaceState({});
console.log('Riptide data reset. The dashboard is now empty.');
