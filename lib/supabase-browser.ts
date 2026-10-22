let supabasePromise: Promise<any> | null = null;

export function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("Supabase solo puede iniciarse en el navegador.");
  }

  if (supabasePromise) {
    return supabasePromise;
  }

  supabasePromise = new Promise((resolve, reject) => {
    const startClient = () => {
      const supabaseGlobal = (window as any).supabase;

      if (!supabaseGlobal) {
        reject(new Error("No se pudo cargar Supabase."));
        return;
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        reject(
          new Error(
            "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
          )
        );
        return;
      }

      resolve(
        supabaseGlobal.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
      );
    };

    if ((window as any).supabase) {
      startClient();
      return;
    }

    const existing = document.querySelector(
      'script[data-atenas-supabase="true"]'
    );

    if (existing) {
      existing.addEventListener("load", startClient, { once: true });
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";

    script.async = true;
    script.dataset.atenasSupabase = "true";

    script.onload = startClient;

    script.onerror = () =>
      reject(new Error("No se pudo descargar la librería de Supabase."));

    document.head.appendChild(script);
  });

  return supabasePromise;
}
