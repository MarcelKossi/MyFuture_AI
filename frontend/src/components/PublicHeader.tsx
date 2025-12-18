import { Link } from "react-router-dom";

import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

export default function PublicHeader() {
  const { t } = useTranslation();

  return (
    <header className="w-full flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-full">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-gray-900">{t("app.title")}</span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelector />
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">{t("auth.login")}</Link>
        </Button>
      </div>
    </header>
  );
}
