
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { validateGrade, validateSubject } from "@/lib/security";
import { sanitizeHTML } from "@/lib/security";
import { toast } from "sonner";

interface GradeInputProps {
  level: string;
  onSubmit: (grades: Record<string, number>, gradingScale: number) => void;
  onBack: () => void;
}

const GradeInput = ({ level, onSubmit, onBack }: GradeInputProps) => {
  const { t } = useTranslation();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [gradingScale, setGradingScale] = useState<number>(20);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  const gradingScales = [
    { value: 20, label: t("grading.scale_20") },
    { value: 100, label: t("grading.scale_100") },
    { value: 10, label: t("grading.scale_10") },
    { value: 4, label: t("grading.scale_4") }
  ];

  const subjectsByLevel = {
    bepc: [
      t("subjects.french"), t("subjects.mathematics"), t("subjects.history_geography"), t("subjects.physics"), 
      t("subjects.biology"), t("subjects.english"), t("subjects.arts"), t("subjects.physical_education")
    ],
    bac: [
      t("subjects.french"), t("subjects.mathematics"), t("subjects.history_geography"), t("subjects.philosophy"),
      t("subjects.physics"), t("subjects.biology"), t("subjects.english"), 
      t("subjects.spanish"), t("subjects.economics"), t("subjects.arts"), t("subjects.physical_education")
    ],
    licence: [],
    master: [],
    doctorat: []
  };

  const defaultSubjects = subjectsByLevel[level as keyof typeof subjectsByLevel] || [];
  const allSubjects = [...defaultSubjects, ...customSubjects];

  const handleGradeChange = (subject: string, value: string) => {
    const validatedGrade = validateGrade(value, gradingScale);
    if (validatedGrade !== null) {
      setGrades(prev => ({ ...prev, [subject]: validatedGrade }));
    } else if (value === '') {
      // Permet la suppression de la note
      setGrades(prev => {
        const { [subject]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    e?.preventDefault();
    const validatedSubject = validateSubject(newSubject);
    if (validatedSubject && !allSubjects.includes(validatedSubject)) {
      setCustomSubjects(prev => [...prev, validatedSubject]);
      setNewSubject("");
      toast.success(t('orientation.grades.subject_added'));
    } else if (validatedSubject && allSubjects.includes(validatedSubject)) {
      toast.error(t('orientation.grades.subject_exists'));
    } else {
      toast.error(t('orientation.grades.subject_invalid'));
    }
  };

  const handleRemoveCustomSubject = (subject: string) => {
    setCustomSubjects(prev => prev.filter(s => s !== subject));
    setGrades(prev => {
      const { [subject]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = () => {
    onSubmit(grades, gradingScale);
  };

  const isValid = Object.keys(grades).length >= 6;
  const enteredGradesCount = Object.keys(grades).length;

  // Tous les niveaux peuvent maintenant ajouter des matières
  const canAddCustomSubjects = true;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('orientation.grades.title')} - {level.toUpperCase()}
        </CardTitle>
        <p className="text-center text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('orientation.grades.description')) }} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Choix du barème */}
        <div className="space-y-2">
          <Label>{t('orientation.grades.grading_system')}</Label>
          <Select value={gradingScale.toString()} onValueChange={(value) => {
            const newScale = parseInt(value);
            setGradingScale(newScale);
            setGrades({}); // Reset grades when changing scale
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gradingScales.map((scale) => (
                <SelectItem key={scale.value} value={scale.value.toString()}>
                  {scale.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ajout de matières personnalisées pour tous les niveaux */}
        {canAddCustomSubjects && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800">{t('orientation.grades.add_subjects')}</h3>
            <form onSubmit={handleAddCustomSubject} className="flex gap-2">
              <Input
                placeholder={t('orientation.grades.subject_placeholder')}
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-sm text-blue-600">
              💡 {t('orientation.grades.tip')}
            </p>
          </div>
        )}

        {/* Liste des matières */}
        <div className="grid md:grid-cols-2 gap-4">
          {allSubjects.map((subject) => (
            <div key={subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={subject}>{subject}</Label>
                {customSubjects.includes(subject) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomSubject(subject)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                id={subject}
                type="number"
                min="0"
                max={gradingScale}
                step={gradingScale === 4 ? "0.1" : gradingScale === 20 ? "0.5" : "1"}
                placeholder={`${t("labels.grade_placeholder")} ${gradingScale}`}
                onChange={(e) => handleGradeChange(subject, e.target.value)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {allSubjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>{t("orientation.grades.add_subjects_prompt")}</p>
          </div>
        )}

        {/* Indicateur de progression */}
        <div className={`p-4 rounded-lg ${enteredGradesCount >= 6 ? 'bg-green-50' : 'bg-orange-50'}`}>
          <p className={`text-sm font-medium ${enteredGradesCount >= 6 ? 'text-green-800' : 'text-orange-800'}`}>
            📊 <strong>{t('orientation.grades.progress')}</strong> {enteredGradesCount}/6 {t("labels.subjects_minimum")} 
            {enteredGradesCount >= 6 ? ` ✅ ${t('orientation.grades.continue_text')}` : ` ⚠️ ${t('orientation.grades.add_more')}`}
          </p>
          {enteredGradesCount < 6 && (
            <p className="text-sm text-orange-600 mt-2">
              💡 {t('orientation.grades.tip')}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            {t('back')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className={`flex-1 ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('orientation.grades.continue_button')} ({enteredGradesCount} {t("labels.subjects")})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradeInput;
