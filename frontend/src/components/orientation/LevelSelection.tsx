
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface LevelSelectionProps {
  onLevelSelect: (level: string) => void;
}

const LevelSelection = ({ onLevelSelect }: LevelSelectionProps) => {
  const { t } = useTranslation();
  
  const levels = [
    { value: "bepc", label: t('levels.bepc') },
    { value: "bac", label: t('levels.bac') },
    { value: "licence", label: t('levels.licence') },
    { value: "master", label: t('levels.master') },
    { value: "doctorat", label: t('levels.doctorat') }
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('orientation.step.level.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select onValueChange={onLevelSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('orientation.step.level.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {levels.map((levelOption) => (
              <SelectItem key={levelOption.value} value={levelOption.value}>
                {levelOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600 text-center">
          {t('orientation.step.level.description')}
        </p>
      </CardContent>
    </Card>
  );
};

export default LevelSelection;
