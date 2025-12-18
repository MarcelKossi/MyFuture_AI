import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token") ?? "";

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "", []);
  const endpoint = (path: string) => `${apiBaseUrl}${path}`;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({ title: t("auth.reset.missingToken"), variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: t("auth.reset.mismatch"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        throw new Error("Reset failed");
      }

      toast({ title: t("auth.reset.success") });
      navigate("/login", { replace: true });
    } catch (err) {
      toast({
        title: t("auth.reset.error"),
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
              <div className="text-sm text-muted-foreground">{t("auth.reset.title")}</div>
            </div>
          </div>

          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.reset.title")}</CardTitle>
              <CardDescription>{t("auth.reset.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="reset-new">{t("auth.reset.newPassword")}</Label>
                  <Input
                    id="reset-new"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reset-confirm">{t("auth.reset.confirmPassword")}</Label>
                  <Input
                    id="reset-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {t("auth.reset.submit")}
                </Button>

                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}
                >
                  {t("auth.backToLogin")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
