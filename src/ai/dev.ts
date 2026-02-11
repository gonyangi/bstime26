import { config } from 'dotenv';
config();

import '@/ai/flows/generate-timetable-from-constraints.ts';
import '@/ai/flows/optimize-existing-timetable.ts';
import '@/ai/flows/generate-timetable-from-requirements.ts';