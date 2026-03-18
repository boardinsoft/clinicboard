'use client';

export default function DebugEnvPage() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return (
        <div className="p-10 font-mono">
            <h1>Debug Env Vars</h1>
            <div className="mt-4 space-y-2">
                <p>URL defined: {url ? '✅ Yes' : '❌ No'}</p>
                <p>Key defined: {key ? '✅ Yes' : '❌ No'}</p>
                {url && <p className="text-xs text-muted-foreground mt-2">URL: {url}</p>}
                {!url && !key && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-500">
                        Error: Missing environment variables in this deployment.
                    </div>
                )}
            </div>
        </div>
    );
}
