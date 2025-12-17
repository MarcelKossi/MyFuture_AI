
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { useFormSecurity } from "@/hooks/useSecurityMonitor";

interface CareerAspirationProps {
  onSubmit: (hasIdea: boolean, career?: string) => void;
}

const CareerAspiration = ({ onSubmit }: CareerAspirationProps) => {
  const { t } = useTranslation();
  const { validateField } = useFormSecurity();
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);
  const [careerInput, setCareerInput] = useState("");
  const [careerError, setCareerError] = useState<string | null>(null);

  const popularCareers = [
    "Médecin", "Ingénieur informatique", "Avocat", "Enseignant", "Architecte",
    "Comptable", "Journaliste", "Psychologue", "Pharmacien", "Designer",
    "Marketing", "Vétérinaire", "Entrepreneur", "Chercheur", "Développeur web"
  ];

  const handleSubmit = () => {
    if (hasIdea === true) {
      const validation = validateField(careerInput, 'careerGoal', true);
      
      if (!validation.isValid) {
        setCareerError(validation.error || 'Erreur de validation');
        return;
      }
      
      setCareerError(null);
      onSubmit(true, validation.sanitizedValue);
    } else if (hasIdea === false) {
      setCareerError(null);
      onSubmit(false);
    }
  };

  const handleCareerSelect = (career: string) => {
    const validation = validateField(career, 'careerSelection');
    
    if (validation.isValid) {
      setCareerInput(validation.sanitizedValue || career);
      setCareerError(null);
    } else {
      setCareerError(validation.error || 'Sélection invalide');
    }
  };

  const isValid = hasIdea === false || (hasIdea === true && careerInput.trim().length > 0);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('orientation.career.title')}</CardTitle>
        <p className="text-center text-gray-600">
          {t('orientation.career.question')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yes/No Choice */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={hasIdea === true ? "default" : "outline"}
              className="h-16"
              onClick={() => setHasIdea(true)}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div>{t('orientation.career.yes')}</div>
              </div>
            </Button>
            <Button
              variant={hasIdea === false ? "default" : "outline"}
              className="h-16"
              onClick={() => setHasIdea(false)}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">❌</div>
                <div>{t('orientation.career.no')}</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Career Input (if Yes selected) */}
        {hasIdea === true && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="career">{t('orientation.career.enter_job')}</Label>
              <Input
                id="career"
                value={careerInput}
                onChange={(e) => {
                  setCareerInput(e.target.value);
                  setCareerError(null);
                }}
                placeholder={t('orientation.career.job_placeholder')}
                className="w-full"
              />
              {careerError && (
                <p className="text-sm text-red-600 mt-1">{careerError}</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">{t('orientation.career.popular_jobs')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {popularCareers.map((career) => (
                  <Button
                    key={career}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleCareerSelect(career)}
                  >
                    {career}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Information message for "No" choice */}
        {hasIdea === false && (
          <div className="bg-green-50 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
            <p className="text-green-800 text-sm">
              💡 {t('orientation.career.no_problem')}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          {t('orientation.career.get_recommendations')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CareerAspiration;
