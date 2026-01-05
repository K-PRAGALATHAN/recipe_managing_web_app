import 'dotenv/config';
import { createSupabaseClient } from './src/lib/supabase.js';

console.log('Checking env vars...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : 'MISSING');

try {
    console.log('Initializing Supabase client...');
    createSupabaseClient();
    console.log('Supabase client initialized.');
} catch (err) {
    console.error('Supabase init failed:', err.message);
}

try {
    console.log('Importing app...');
    await import('./src/app.js');
    console.log('App imported.');
} catch (err) {
    console.error('App import failed:', err);
}
