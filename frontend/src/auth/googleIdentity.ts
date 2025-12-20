type GoogleId = typeof window.google;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<void> | null = null;

export async function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return;

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity script")));
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function initGoogleIdentity(opts: {
  clientId: string;
  onCredential: (idToken: string) => void;
}): void {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity script not loaded");
  }

  window.google.accounts.id.initialize({
    client_id: opts.clientId,
    callback: (response) => {
      if (response?.credential) {
        opts.onCredential(response.credential);
      }
    },
    cancel_on_tap_outside: true,
    ux_mode: "popup",
  });
}

export function renderGoogleButton(container: HTMLElement, opts?: { locale?: string }): void {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity script not loaded");
  }

  // Clear container to avoid duplicate buttons when language/theme re-renders.
  container.innerHTML = "";

  const width = Math.min(400, Math.max(280, container.clientWidth || 320));
  window.google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width,
    locale: opts?.locale,
  });
}

export function promptGoogleOneTap(): void {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity script not loaded");
  }

  window.google.accounts.id.prompt();
}
