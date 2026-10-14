// Sdílení. Nejdřív systémové sdílení (Web Share API), jinak schránka.
// Když nejde ani schránka, vrátí 'manual' a UI ukáže text k ručnímu zkopírování.
// Později jde vyměnit za Capacitor Share bez zásahu do hry.

// Vrací 'shared' | 'copied' | 'manual' | 'cancelled'
export async function shareText(text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ text, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      // jinak zkusíme schránku
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'manual';
  }
}
