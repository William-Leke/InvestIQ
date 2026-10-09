import { openUrl } from "@tauri-apps/plugin-opener";

/** Opens a link in the user's default browser (or a new tab when running in a plain browser). */
export async function openExternal(url: string) {
  if ("__TAURI_INTERNALS__" in window) {
    await openUrl(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}
