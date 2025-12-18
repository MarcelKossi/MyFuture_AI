import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "", []);
  const endpoint = (path: string) => `${apiBaseUrl}${path}`;

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch(endpoint("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setIsDone(true);
    } catch (err) {
      toast({
        title: t("auth.error.title"),
        description: t("auth.forgot.error"),
        variant: "destructive",
      });
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
              <div className="text-sm text-muted-foreground">{t("auth.forgot.title")}</div>
            </div>
          </div>

          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.forgot.title")}</CardTitle>
              <CardDescription>{t("auth.forgot.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {!isDone ? (
                <form className="grid gap-4" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-email">{t("auth.email")}</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {t("auth.forgot.submit")}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}
                  >
                    {t("auth.backToLogin")}
                  </Button>
                </form>
              ) : (
                <div className="grid gap-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("auth.forgot.neutral")}</p>
                  <p className="text-xs text-muted-foreground">{t("auth.google.notice")}</p>

                  <Button type="button" className="w-full" onClick={() => navigate("/login")}
                  >
                    {t("auth.backToLogin")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
