import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { initGoogleIdentity, loadGoogleIdentityScript, renderGoogleButton } from "@/auth/googleIdentity";

export default function Login() {
  const { t, language } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "", []);
  const googleClientId = useMemo(
    () => (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "",
    []
  );

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const endpoint = (path: string) => {
    const base = apiBaseUrl.replace(/\/+$/, "");
    if (!base) return path;

    // Allow either `http://host:port` or `http://host:port/api`.
    if (base.toLowerCase().endsWith("/api") && path.startsWith("/api/")) {
      return `${base}${path.slice(4)}`;
    }

    return `${base}${path}`;
  };

  const handleGoogleCredential = useCallback(async (idToken: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { detail?: unknown } | null;
        const detail = typeof payload?.detail === "string" ? payload.detail : null;
        throw new Error(detail || t("auth.google.error.backendRejected"));
      }

      const data = (await res.json().catch(() => null)) as { access_token?: string } | null;
      if (!data?.access_token) {
        throw new Error(t("auth.google.error.missingToken"));
      }

      login(data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: t("auth.google.error.title"),
        description: err instanceof Error ? err.message : t("auth.google.error.generic"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [endpoint, from, login, navigate, t]);

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      if (!googleClientId) {
        return;
      }

      try {
        await loadGoogleIdentityScript();
        if (!isActive) return;

        initGoogleIdentity({ clientId: googleClientId, onCredential: handleGoogleCredential });

        if (googleBtnRef.current) {
          renderGoogleButton(googleBtnRef.current, { locale: language });
        }
      } catch {
        // Script load/init failure: show a small toast once.
        toast({
          title: t("auth.google.error.title"),
          description: t("auth.google.error.unavailable"),
          variant: "destructive",
        });
      }
    };

    init();

    return () => {
      isActive = false;
    };
  }, [googleClientId, handleGoogleCredential, language, t]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = (await res.json()) as { access_token: string };
      if (!data?.access_token) {
        throw new Error("Missing token");
      }

      login(data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: t("auth.error.title"),
        description: t("auth.error.signin"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupConfirmPassword && signupConfirmPassword !== signupPassword) {
      return;
    }

    const passwordBytes = new TextEncoder().encode(signupPassword).length;
    if (passwordBytes > 72) {
      setSignupError(t("auth.passwordRules.maxBytesError"));
      return;
    }

    setIsSubmitting(true);
    setSignupError(null);
    try {
      const res = await fetch(endpoint("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername.trim() || undefined,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
        const detail = typeof payload?.detail === "string" ? payload.detail : null;
        throw new Error(detail || t("auth.error.signup"));
      }

      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      toast({
        title: t("auth.signup"),
        description: data?.message || t("auth.signup.verifyNote"),
      });

      setSignupPassword("");
      setSignupConfirmPassword("");
      setSigninEmail(signupEmail);
      setSigninPassword("");
      setActiveTab("signin");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : t("auth.error.signup"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="text-sm text-muted-foreground">{t("auth.login")}</div>
            </div>
          </div>

          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
              <CardDescription>{t("auth.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                {googleClientId ? (
                  <div className="w-full">
                    <div ref={googleBtnRef} className="w-full flex justify-center" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center bg-white"
                    onClick={() =>
                      toast({
                        title: t("auth.google.error.title"),
                        description: t("auth.google.error.missingClientId"),
                        variant: "destructive",
                      })
                    }
                  >
                    {t("auth.google")}
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-muted-foreground">{t("auth.or")}</span>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
                    <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-4">
                    <form className="grid gap-4" onSubmit={handleSignIn}>
                      <div className="grid gap-2">
                        <Label htmlFor="signin-email">{t("auth.email")}</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          autoComplete="email"
                          value={signinEmail}
                          onChange={(e) => setSigninEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="signin-password">{t("auth.password")}</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          autoComplete="current-password"
                          value={signinPassword}
                          onChange={(e) => setSigninPassword(e.target.value)}
                          required
                        />
                        <div className="text-right">
                          <Link
                            to="/forgot-password"
                            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                          >
                            {t("auth.forgot.link")}
                          </Link>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {t("auth.signin")}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-4">
                    <form className="grid gap-4" onSubmit={handleSignUp}>
                      {signupError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                          {signupError}
                        </div>
                      ) : null}

                      <div className="grid gap-2">
                        <Label htmlFor="signup-username">{t("auth.username.optional")}</Label>
                        <Input
                          id="signup-username"
                          type="text"
                          autoComplete="username"
                          inputMode="text"
                          value={signupUsername}
                          onChange={(e) => {
                            setSignupUsername(e.target.value);
                            if (signupError) setSignupError(null);
                          }}
                          placeholder={t("auth.username.placeholder")}
                        />
                        <p className="text-xs text-muted-foreground">{t("auth.username.help")}</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="signup-email">{t("auth.email")}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          value={signupEmail}
                          onChange={(e) => {
                            setSignupEmail(e.target.value);
                            if (signupError) setSignupError(null);
                          }}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="signup-password">{t("auth.password")}</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignupPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={signupPassword}
                            onChange={(e) => {
                              setSignupPassword(e.target.value);
                              if (signupError) setSignupError(null);
                            }}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                            aria-label={showSignupPassword ? t("auth.password.hide") : t("auth.password.show")}
                            onClick={() => setShowSignupPassword((v) => !v)}
                          >
                            {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium">{t("auth.passwordRules.title")}</div>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>{t("auth.passwordRules.min")}</li>
                            <li>{t("auth.passwordRules.upper")}</li>
                            <li>{t("auth.passwordRules.lower")}</li>
                            <li>{t("auth.passwordRules.number")}</li>
                            <li>{t("auth.passwordRules.special")}</li>
                            <li>{t("auth.passwordRules.maxBytes")}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="signup-confirm-password">{t("auth.confirmPassword")}</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showSignupConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={signupConfirmPassword}
                            onChange={(e) => {
                              setSignupConfirmPassword(e.target.value);
                              if (signupError) setSignupError(null);
                            }}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                            aria-label={showSignupConfirmPassword ? t("auth.password.hide") : t("auth.password.show")}
                            onClick={() => setShowSignupConfirmPassword((v) => !v)}
                          >
                            {showSignupConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {signupConfirmPassword && signupConfirmPassword !== signupPassword ? (
                          <p className="text-xs text-destructive">{t("auth.password.mismatch")}</p>
                        ) : null}
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          (signupConfirmPassword.length > 0 && signupConfirmPassword !== signupPassword)
                        }
                        className="w-full"
                      >
                        {t("auth.signup")}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">{t("auth.signup.verifyNote")}</p>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
