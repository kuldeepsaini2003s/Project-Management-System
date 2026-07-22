const MESSAGE_SOURCE = "uptodate-oauth";
const POPUP_NAME = "uptodate_oauth_popup";
const PROVIDERS = ["github", "slack", "notion", "gmail"];
const POPUP_W = 600;
const POPUP_H = 720;
const POLL_MS = 500;
const TIMEOUT_MS = 10 * 60 * 1000; 

const openCenteredPopup = () => {
  const y = window.top?.outerHeight
    ? Math.max(0, (window.top.outerHeight - POPUP_H) / 2 + window.top.screenY)
    : 100;
  const x = window.top?.outerWidth
    ? Math.max(0, (window.top.outerWidth - POPUP_W) / 2 + window.top.screenX)
    : 100;
  const popup = window.open(
    "about:blank",
    POPUP_NAME,
    `width=${POPUP_W},height=${POPUP_H},left=${x},top=${y},popup=yes,noopener=no`,
  );
  if (popup) {
    try {
      popup.document.write(
        '<p style="font-family:sans-serif;color:#888;padding:24px">Connecting…</p>',
      );
    } catch {}
  }
  return popup;
};

/** Wait for the popup to report a result, close, or time out. */
const waitForResult = (popup, provider) =>
  new Promise((resolve) => {
    let settled = false;
    let pollId = null;
    let timeoutId = null;

    const settle = (result) => {
      if (settled) return; // prevent duplicate success/close events
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(pollId);
      clearTimeout(timeoutId);
      resolve(result);
    };

    const onMessage = (event) => {
      // Security: only accept messages from our own origin and our popup.
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      const data = event.data;
      if (!data || data.source !== MESSAGE_SOURCE) return;
      if (data.provider !== provider) return;
      settle({
        status: data.status === "connected" ? "connected" : "error",
        message: data.message || "",
      });
    };

    window.addEventListener("message", onMessage);

    // Detect manual close. Small grace period so a message that raced the
    // close event still wins.
    pollId = setInterval(() => {
      if (popup.closed) {
        setTimeout(() => settle({ status: "closed" }), 250);
        clearInterval(pollId);
      }
    }, POLL_MS);

    timeoutId = setTimeout(() => settle({ status: "closed" }), TIMEOUT_MS);
  });

/**
 * @param provider        
 * @param fetchAuthorize 
 * @returns {Promise<{status: "connected"|"reconnected"|"error"|"closed"|"redirecting", message?: string}>}
 */
export const connectOAuthPopup = async ({ provider, fetchAuthorize }) => {
  const popup = openCenteredPopup(); // sync — before any await

  let data;
  try {
    data = await fetchAuthorize();
  } catch (err) {
    try {
      popup?.close();
    } catch {}
    throw err; // caller shows its existing error state
  }

  // Already connected / nothing to authorize — no popup needed.
  if (data?.reconnected || !data?.url) {
    try {
      popup?.close();
    } catch {}
    return { status: data?.reconnected ? "reconnected" : "closed" };
  }

  // Popup blocked → graceful fallback to the existing full-page redirect.
  if (!popup || popup.closed) {
    window.location.href = data.url;
    return { status: "redirecting" };
  }

  popup.location.href = data.url;
  return waitForResult(popup, provider);
};

/**
 * Popup-side bridge. Call once in main.jsx BEFORE mounting React.
 * Returns true when running inside the OAuth popup (the app should not mount).
 */
export const notifyOpenerOfOAuthResult = () => {
  if (window.name !== POPUP_NAME || !window.opener || window.opener === window)
    return false;

  const params = new URLSearchParams(window.location.search);
  for (const provider of PROVIDERS) {
    const raw = params.get(provider);
    if (!raw) continue;

    // Minimal metadata only — never tokens or sensitive data.
    const payload = {
      source: MESSAGE_SOURCE,
      provider,
      status: raw === "connected" ? "connected" : "error",
      message: params.get("message") || "",
    };
    try {
      // Explicit same-origin target: the opener is the page that started
      // the connect on this same domain.
      window.opener.postMessage(payload, window.location.origin);
    } catch {}

    document.body.innerHTML =
      '<p style="font-family:sans-serif;color:#888;padding:24px">Connection complete. You can close this window.</p>';
    setTimeout(() => window.close(), 100);
    return true;
  }
  return false;
};
