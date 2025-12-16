
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Brain, ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import LanguageSelector from "@/components/LanguageSelector";
import OrientationForm from "@/components/OrientationForm";
import AdviceSection from "@/components/AdviceSection";

const Index = () => {
  const [selectedOption, setSelectedOption] = useState<"orientation" | "advice" | null>(null);
  const { t } = useTranslation();
  const { useRenderTimer } = usePerformanceMonitor();

  // Surveille les performances de rendu de la page
  useRenderTimer('Index');

  const handleBackToHome = () => {
    setSelectedOption(null);
  };

  if (selectedOption === "orientation") {
    return <OrientationForm onBack={handleBackToHome} />;
  }

  if (selectedOption === "advice") {
    return <AdviceSection onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('app.subtitle')}
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
            <p className="text-blue-800 font-medium">{t('app.description')}</p>
          </div>
        </div>

        {/* Main Question */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            {t('main.question')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Option 1: Orientation */}
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300" 
                  onClick={() => setSelectedOption("orientation")}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-blue-800 text-xl">
                  {t('orientation.title')}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t('orientation.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>{t('orientation.feature1')}</li>
                  <li>{t('orientation.feature2')}</li>
                  <li>{t('orientation.feature3')}</li>
                  <li>{t('orientation.feature4')}</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 group-hover:scale-105 transition-all">
                  {t('orientation.button')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Option 2: Conseils */}
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-300"
                  onClick={() => setSelectedOption("advice")}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full mb-4 group-hover:from-green-200 group-hover:to-green-300 transition-all">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800 text-xl">
                  {t('advice.title')}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t('advice.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>{t('advice.feature1')}</li>
                  <li>{t('advice.feature2')}</li>
                  <li>{t('advice.feature3')}</li>
                  <li>{t('advice.feature4')}</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 group-hover:scale-105 transition-all">
                  {t('advice.button')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-800 mb-2">{t('footer.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('footer.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
