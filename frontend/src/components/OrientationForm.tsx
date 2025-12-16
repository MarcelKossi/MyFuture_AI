
import { useEffect, useRef, useState } from "react";
import GradeInput from "./GradeInput";
import CareerAspiration from "./CareerAspiration";
import ResultsPage from "./ResultsPage";
import LevelSelection from "./orientation/LevelSelection";
import InputMethodSelection from "./orientation/InputMethodSelection";
import FileUpload from "./orientation/FileUpload";
import OrientationProgress from "./orientation/OrientationProgress";
import OrientationHeader from "./orientation/OrientationHeader";
import { sanitizeUserInput } from "@/lib/security";

interface OrientationFormProps {
  onBack: () => void;
}

const OrientationForm = ({ onBack }: OrientationFormProps) => {
  const stepContainerRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState("");
  const [inputMethod, setInputMethod] = useState<"manual" | "upload" | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [gradingScale, setGradingScale] = useState<number>(20);
  const [hasCareerIdea, setHasCareerIdea] = useState<boolean | null>(null);
  const [careerGoal, setCareerGoal] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleLevelSelect = (selectedLevel: string) => {
    setLevel(selectedLevel);
    setStep(2);
  };

  const handleGradesSubmit = (gradesData: Record<string, number>, scale: number) => {
    setGrades(gradesData);
    setGradingScale(scale);
    setStep(3);
  };

  const handleCareerSubmit = (hasIdea: boolean, career?: string) => {
    setHasCareerIdea(hasIdea);
    if (career) {
      const sanitizedCareer = sanitizeUserInput(career);
      setCareerGoal(sanitizedCareer);
    }
    setShowResults(true);
  };

  const handleFileProcessComplete = (processedGrades: Record<string, number>, scale: number) => {
    setGrades(processedGrades);
    setGradingScale(scale);
    setStep(3);
  };

  useEffect(() => {
    stepContainerRef.current?.focus();
  }, [step, inputMethod]);

  if (showResults) {
    return (
      <ResultsPage 
        onBack={() => setShowResults(false)}
        level={level}
        grades={grades}
        gradingScale={gradingScale}
        hasCareerIdea={hasCareerIdea}
        careerGoal={careerGoal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <OrientationHeader onBack={onBack} currentStep={step} />
        <OrientationProgress currentStep={step} totalSteps={3} />

        {/* Step 1: Level Selection */}
        {step === 1 && (
          <div ref={stepContainerRef} tabIndex={-1} aria-live="polite" className="outline-none">
            <LevelSelection onLevelSelect={handleLevelSelect} />
          </div>
        )}

        {/* Step 2: Grade Input Method */}
        {step === 2 && !inputMethod && (
          <div ref={stepContainerRef} tabIndex={-1} aria-live="polite" className="outline-none">
            <InputMethodSelection onMethodSelect={setInputMethod} />
          </div>
        )}

        {/* Step 2: Manual Grade Input */}
        {step === 2 && inputMethod === "manual" && (
          <div ref={stepContainerRef} tabIndex={-1} aria-live="polite" className="outline-none">
            <GradeInput 
              level={level} 
              onSubmit={handleGradesSubmit}
              onBack={() => setInputMethod(null)}
            />
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 2 && inputMethod === "upload" && (
          <div ref={stepContainerRef} tabIndex={-1} aria-live="polite" className="outline-none">
            <FileUpload
              level={level}
              onProcessComplete={handleFileProcessComplete}
              onBack={() => setInputMethod(null)}
            />
          </div>
        )}

        {/* Step 3: Career Aspiration */}
        {step === 3 && (
          <div ref={stepContainerRef} tabIndex={-1} aria-live="polite" className="outline-none">
            <CareerAspiration onSubmit={handleCareerSubmit} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrientationForm;
