import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This runs once, at module load / page refresh — not on button click.
// If either of these logs "undefined" or "MISSING", that IS your root cause,
// independent of anything in App.jsx.
console.log("[APP_DEBUG] VITE_SUPABASE_URL:", url ?? "MISSING");
console.log("[APP_DEBUG] VITE_SUPABASE_ANON_KEY present:", !!anonKey);

if (!url || !anonKey) {
  console.error(
    "[APP_DEBUG] Supabase env vars are missing. Check that .env is in the project root, " +
      "vars are prefixed VITE_, and you restarted `vite` after editing .env."
  );
}

export const supabase = createClient(url, anonKey);