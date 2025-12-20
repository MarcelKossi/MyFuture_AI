import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

type VerifyState =
  | { status: "missing_token" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "error" };

function classifyVerificationError(detail: unknown): "invalid" | "expired" {
  // Backend currently returns a generic message ("Invalid or expired token").
  // When a more specific message is available, use it to show a clearer UX.
  if (typeof detail === "string") {
    const lower = detail.toLowerCase();
    if (lower.includes("expired") && !lower.includes("invalid")) return "expired";
  }

  return "invalid";
}

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token") ?? "";

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "", []);

  const endpoint = (path: string) => {
    const base = apiBaseUrl.replace(/\/+$/, "");
    if (!base) return path;

    if (base.toLowerCase().endsWith("/api") && path.startsWith("/api/")) {
      return `${base}${path.slice(4)}`;
    }

    return `${base}${path}`;
  };

  const [state, setState] = useState<VerifyState>(() =>
    token ? { status: "loading" } : { status: "missing_token" }
  );

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setState({ status: "missing_token" });
      return;
    }

    (async () => {
      try {
        const url = `${endpoint("/api/auth/verify-email")}?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          method: "GET",
        });

        if (!isActive) return;

        if (res.ok) {
          setState({ status: "success" });
          return;
        }

        const payload = (await res.json().catch(() => null)) as { detail?: unknown } | null;
        const kind = classifyVerificationError(payload?.detail);
        setState({ status: kind });
      } catch {
        if (!isActive) return;
        setState({ status: "error" });
      }
    })();

    return () => {
      isActive = false;
    };
  }, [endpoint, token]);

  const title = (() => {
    switch (state.status) {
      case "missing_token":
        return t("auth.verify.missingToken");
      case "loading":
        return t("auth.verify.title");
      case "success":
        return t("auth.verify.successTitle");
      case "invalid":
        return t("auth.verify.invalidTitle");
      case "expired":
        return t("auth.verify.expiredTitle");
      case "error":
        return t("auth.verify.errorTitle");
    }
  })();

  const description = (() => {
    switch (state.status) {
      case "missing_token":
        return t("auth.verify.missingTokenDescription");
      case "loading":
        return t("auth.verify.description");
      case "success":
        return t("auth.verify.success");
      case "invalid":
        return t("auth.verify.invalid");
      case "expired":
        return t("auth.verify.expired");
      case "error":
        return t("auth.verify.error");
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="min-h-screen px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-full shadow-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="mt-3">
              <div className="font-semibold text-gray-900">{t("app.title")}</div>
              <div className="text-sm text-muted-foreground">{t("auth.verify.title")}</div>
            </div>
          </div>

          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {state.status === "loading" ? (
                  <div className="text-center text-sm text-muted-foreground">{t("auth.verify.loading")}</div>
                ) : null}

                {state.status === "invalid" ? (
                  <p className="text-xs text-muted-foreground text-center">
                    {t("auth.verify.noteInvalidOrExpired")}
                  </p>
                ) : null}

                {state.status === "expired" ? (
                  <p className="text-xs text-muted-foreground text-center">
                    {t("auth.verify.noteInvalidOrExpired")}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => navigate("/login", { replace: true })}
                  disabled={state.status === "loading"}
                >
                  {t("auth.verify.ctaLogin")}
                </Button>

                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/", { replace: true })}>
                  {t("auth.verify.ctaHome")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
