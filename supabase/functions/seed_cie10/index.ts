import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (_req: Request) => {
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

        if (!supabaseUrl || !supabaseKey) {
            return new Response("Missing environment variables.", { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch the CIE-10 data from GitHub
        console.log("Fetching CIE-10 JSON from GitHub...");
        const res = await fetch("https://raw.githubusercontent.com/verasativa/CIE-10/master/codes.json");
        if (!res.ok) {
            throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        // The JSON is likely an array or an object. If it's the `codes.json` from verasativa, it might be an array of objects.
        // Let's parse it properly. Let's assume it's something like [{ code: 'A00', description: 'Cólera' }, ...]
        // or maybe an object mapping codes to descriptions { "A00": "Cólera", ... }

        let records = [];
        if (Array.isArray(data)) {
            records = data.map(item => ({
                code: item.code || item.id || item.codigo || item.c,
                description: item.description || item.desc || item.descripcion || item.d
            }));
        } else if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                records.push({
                    code: key,
                    description: typeof value === 'string' ? value : value.description || value.desc
                });
            }
        }

        // Filter out invalids
        records = records.filter(r => r.code && r.description);

        console.log(`Found ${records.length} records. Starting insertion...`);

        // Insert in chunks of 1000 to avoid POST size limits
        const chunkSize = 1000;
        let inserted = 0;

        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const { error } = await supabase
                .from('cie10')
                .upsert(chunk, { onConflict: 'code', ignoreDuplicates: true });

            if (error) {
                console.error("Error inserting chunk:", error);
                throw error;
            }
            inserted += chunk.length;
            console.log(`Inserted chunk ${i / chunkSize + 1}, total: ${inserted}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully seeded ${inserted} CIE-10 records.`
        }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
