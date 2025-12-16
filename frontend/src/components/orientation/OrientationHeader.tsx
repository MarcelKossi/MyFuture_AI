
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface OrientationHeaderProps {
  onBack: () => void;
  currentStep: number;
}

const OrientationHeader = ({ onBack, currentStep }: OrientationHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2 w-fit" aria-label={t('back')}>
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Button>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-800">{t('orientation.header.title')}</h1>
        <p className="text-gray-600 text-sm" aria-live="polite">
          {t('orientation.header.step')} {currentStep} {t('orientation.header.of')} 3
        </p>
      </div>
    </div>
  );
};

export default OrientationHeader;
