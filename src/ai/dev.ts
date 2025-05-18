import { config } from 'dotenv';
config();

import '@/ai/flows/generate-passphrase.ts';
import '@/ai/flows/enhance-recovery-prompt.ts';
import '@/ai/flows/analyze-passphrase-strength.ts'; // Added new flow
