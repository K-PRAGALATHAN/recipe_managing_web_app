
import 'dotenv/config';
import { createSupabaseClient } from './src/lib/supabase.js';

async function analyzeDatabase() {
    console.log('Analyzing Supabase Database...');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing environment variables!');
        process.exit(1);
    }

    const supabase = createSupabaseClient();

    // Method 1: Try to list tables via postgres method if RPC is available (unlikely by default)
    // Method 2: Probe specific known tables from schema files

    const tablesToProbe = ['recipes', 'recipe_versions', 'menu_items', 'cook_day_menu'];
    const results = {};

    for (const table of tablesToProbe) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                results[table] = { status: 'Missing or Error', error: error.message };
            } else {
                results[table] = { status: 'Exists', rowCount: count };

                // precise column check: get one row
                const { data: sample } = await supabase.from(table).select('*').limit(1);
                if (sample && sample.length > 0) {
                    results[table].columns = Object.keys(sample[0]);
                } else {
                    results[table].columns = 'Unknown (Empty Table)';
                }
            }
        } catch (e) {
            results[table] = { status: 'Error', error: e.message };
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

analyzeDatabase();
