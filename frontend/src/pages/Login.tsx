import { useMemo, useState } from "react";
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

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 533.5 544.3"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.3H272.1v95.2h146.9c-6.3 34.1-25 63-53.2 82.4v68h85.9c50.2-46.3 81.8-114.6 81.8-195.3z"
        fill="#4285f4"
      />
      <path
        d="M272.1 544.3c72.6 0 133.5-24.1 178-65.6l-85.9-68c-23.9 16.1-54.5 25.6-92.1 25.6-70.1 0-129.5-47.2-150.7-110.6H32.8v69.4c44.3 88 135.4 149.2 239.3 149.2z"
        fill="#34a853"
      />
      <path
        d="M121.4 325.7c-10.8-32.4-10.8-67.4 0-99.8v-69.4H32.8c-43 85.7-43 187.9 0 273.6l88.6-69.4z"
        fill="#fbbc04"
      />
      <path
        d="M272.1 107.7c39.5-.6 77.7 14.6 106.7 42.6l79.5-79.5C411.2 24.3 344.7-1.2 272.1 0 168.2 0 77.1 61.2 32.8 149.2l88.6 69.4c21.2-63.4 80.6-110.6 150.7-110.9z"
        fill="#ea4335"
      />
    </svg>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "", []);

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

  const endpoint = (path: string) => `${apiBaseUrl}${path}`;

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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 bg-white"
                  onClick={() => toast({ title: t("auth.google.todo") })}
                >
                  <GoogleGIcon className="h-5 w-5" />
                  {t("auth.google")}
                </Button>

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
