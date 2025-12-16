import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, TrendingUp, BookOpen, Users, Download } from "lucide-react";
import ShareResults from "./ShareResults";
import ConsultationButton from "./ConsultationButton";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { sanitizeUserInput, validateShareUrl } from "@/lib/security";

interface ResultsPageProps {
  onBack: () => void;
  level: string;
  grades: Record<string, number>;
  gradingScale: number;
  hasCareerIdea: boolean | null;
  careerGoal: string;
}

const ResultsPage = ({ onBack, level, grades, gradingScale, hasCareerIdea, careerGoal }: ResultsPageProps) => {
  const { t } = useTranslation();

  // Calculate average grade
  const gradeValues = Object.values(grades);
  const averageGrade = gradeValues.length > 0 
    ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length 
    : 0;

  // Mock recommendations based on level and average grade
  const getRecommendations = () => {
    const baseRecommendations = {
      bepc: [
        // Filières générales
        { 
          name: "Série Scientifique (S)", 
          match: "85%", 
          description: "Idéal pour les sciences et mathématiques", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/au-lycee/bac-s-quels-debouches",
          studyUrl: "https://www.letudiant.fr/lycee/specialites-bac-general/article/bac-s-comment-reussir-en-terminale-scientifique.html"
        },
        { 
          name: "Série Littéraire (L)", 
          match: "70%", 
          description: "Parfait pour les langues et lettres", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/au-lycee/bac-l-quels-debouches",
          studyUrl: "https://www.letudiant.fr/lycee/specialites-bac-general/article/bac-l-les-conseils-pour-reussir.html"
        },
        { 
          name: "Série Économique (ES)", 
          match: "75%", 
          description: "Équilibre entre sciences et économie", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/au-lycee/bac-es-quels-debouches",
          studyUrl: "https://www.letudiant.fr/lycee/specialites-bac-general/article/bac-es-les-conseils-pour-reussir.html"
        },
        
        // Filières techniques nouvelles
        { name: "Filière F1 - Construction Mécanique", match: "80%", description: "Mécanique, usinage, maintenance industrielle", type: "technical" },
        { name: "Filière F2 - Électronique", match: "82%", description: "Électronique, télécommunications, automatisme", type: "technical" },
        { name: "Filière F3 - Électrotechnique", match: "78%", description: "Installation électrique, énergie, domotique", type: "technical" },
        { name: "Filière F4 - Génie Civil", match: "85%", description: "Construction, BTP, architecture", type: "technical" },
        { name: "Filière E - Économie et Gestion", match: "75%", description: "Commerce, comptabilité, administration", type: "technical" },
        { name: "Maçonnerie et Construction", match: "80%", description: "Techniques de construction, matériaux", type: "technical" },
        { name: "Menuiserie et Ébénisterie", match: "77%", description: "Travail du bois, mobilier, agencement", type: "technical" },
        { name: "Construction Métallique", match: "83%", description: "Soudure, charpente métallique, serrurerie", type: "technical" },
        { name: "Secrétariat Bureautique", match: "72%", description: "Administration, informatique de bureau, communication", type: "technical" }
      ],
      bac: [
        { 
          name: "Médecine", 
          match: "90%", 
          description: "Excellentes notes en sciences", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/etudes-de-medecine-quels-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/medecine-sante/comment-reussir-ses-etudes-de-medecine.html"
        },
        { 
          name: "Ingénierie Informatique", 
          match: "85%", 
          description: "Fortes compétences en mathématiques", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/ingenieur-informatique-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/ecoles-ingenieurs/comment-reussir-prepa-ingenieur.html"
        },
        { 
          name: "Droit", 
          match: "80%", 
          description: "Bon niveau général et expression", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/etudes-de-droit-quels-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/droit/comment-reussir-en-fac-de-droit.html"
        }
      ],
      licence: [
        { 
          name: "Master en IA", 
          match: "88%", 
          description: "Domaine très prometteur", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/intelligence-artificielle-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/master/master-intelligence-artificielle-conseils.html"
        },
        { 
          name: "Master Finance", 
          match: "82%", 
          description: "Secteur en croissance", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/master-finance-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/master/master-finance-conseils.html"
        },
        { 
          name: "Master Marketing Digital", 
          match: "79%", 
          description: "Métier d'avenir", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/marketing-digital-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/master/master-marketing-digital-conseils.html"
        }
      ],
      master: [
        { 
          name: "Doctorat en Recherche", 
          match: "85%", 
          description: "Poursuite académique", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/doctorat-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/doctorat/conseils-reussir-doctorat.html"
        },
        { 
          name: "MBA", 
          match: "80%", 
          description: "Leadership et management", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/mba-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/mba/conseils-reussir-mba.html"
        },
        { 
          name: "Spécialisation Professionnelle", 
          match: "78%", 
          description: "Expertise métier", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/specialisation-professionnelle-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/formation-continue/conseils-specialisation.html"
        }
      ],
      doctorat: [
        { 
          name: "Carrière Académique", 
          match: "90%", 
          description: "Enseignement supérieur", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/carriere-academique-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/doctorat/carriere-academique-conseils.html"
        },
        { 
          name: "Recherche Industrielle", 
          match: "85%", 
          description: "R&D en entreprise", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/recherche-industrielle-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/doctorat/recherche-industrielle-conseils.html"
        },
        { 
          name: "Consultance Experte", 
          match: "80%", 
          description: "Conseil stratégique", 
          type: "general",
          careerUrl: "https://www.onisep.fr/formation-et-handicap/mieux-vivre-sa-scolarite/dans-le-superieur/conseil-strategique-debouches",
          studyUrl: "https://www.letudiant.fr/etudes/formation-continue/conseil-strategique.html"
        }
      ]
    };

    return baseRecommendations[level as keyof typeof baseRecommendations] || [];
  };

  const { generatePDF, isGenerating } = usePDFGenerator();

  const downloadReport = async () => {
    const sanitizedCareerGoal = careerGoal ? sanitizeUserInput(careerGoal) : '';
    
    // Conversion des grades vers le format Subject
    const subjects = Object.entries(grades).map(([name, grade], index) => ({
      id: `subject-${index}`,
      name,
      grade,
      coefficient: 1,
      isRequired: true
    }));

    // Construction du profil utilisateur
    const userProfile = {
      level: level as any,
      subjects,
      careerAspiration: sanitizedCareerGoal || undefined,
      gradingScale: gradingScale as any,
      inputMethod: 'manual' as const
    };

    // Construction des recommandations au format attendu
    const recommendedFields = recommendations.slice(0, 5).map((rec, index) => ({
      id: `field-${index}`,
      name: rec.name,
      type: rec.type as 'general' | 'technical',
      compatibilityScore: parseInt(rec.match) || 75,
      requiredSubjects: Object.keys(grades).slice(0, 3),
      careerProspects: [rec.description],
      description: rec.description,
      minimumGrade: gradingScale * 0.6
    }));

    const analysisData = {
      analysisResult: {
        userProfile,
        generalAverage: averageGrade,
        recommendedFields,
        improvementAdvice: [
          "Améliorer les notes en mathématiques",
          "Renforcer les compétences en expression écrite",
          "Développer des projets personnels"
        ],
        generatedAt: new Date(),
        sessionId: `session-${Date.now()}`
      },
      includeCharts: false,
      includeAdvice: true,
      format: 'A4' as const
    };

    const result = await generatePDF(analysisData);
    
    if (result.success) {
      toast.success(t('toast.report_generated'));
    } else {
      const errorMessage = result.error?.message || 'Erreur lors de la génération';
      toast.error(errorMessage);
    }
  };

  const recommendations = getRecommendations();
  const generalRecommendations = recommendations.filter(r => r.type === "general");
  const technicalRecommendations = recommendations.filter(r => r.type === "technical");

  const improvements = [
    "Améliorer les notes en mathématiques (+2 points recommandés)",
    "Renforcer les compétences en expression écrite",
    "Développer des projets personnels dans le domaine visé"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('results.title')}</h1>
            <p className="text-gray-600">{t('results.based_on')} {level.toUpperCase()}</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('results.profile_summary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageGrade.toFixed(1)}/{gradingScale}</div>
              <p className="text-sm text-gray-600">{t('results.average')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(grades).length}</div>
              <p className="text-sm text-gray-600">{t('results.subjects_evaluated')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">Sur {gradingScale}</div>
              <p className="text-sm text-gray-600">{t('results.grading_scale')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {hasCareerIdea ? "✓" : "?"}
              </div>
              <p className="text-sm text-gray-600">
                {hasCareerIdea ? `${t('results.objective')} ${careerGoal}` : t('results.open_exploration')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filières générales */}
        {generalRecommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('results.general_fields')}
            </h2>
            <div className="grid gap-4">
              {generalRecommendations.map((rec, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{rec.name}</h3>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {rec.match} compatible
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{rec.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (validateShareUrl(rec.studyUrl)) {
                            window.open(rec.studyUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.error('URL invalide');
                          }
                        }}
                      >
                        {t('results.learn_more')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (validateShareUrl(rec.careerUrl)) {
                            window.open(rec.careerUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.error('URL invalide');
                          }
                        }}
                      >
                        {t('results.see_careers')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filières techniques (pour BEPC) */}
        {technicalRecommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('results.technical_fields')}
            </h2>
            <div className="grid gap-4">
              {technicalRecommendations.map((rec, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{rec.name}</h3>
                      <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {rec.match} compatible
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{rec.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        {t('results.technical_schools')}
                      </Button>
                      <Button size="sm" variant="outline">
                        {t('results.professional_careers')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('results.improvement_advice')}
          </h2>
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Consultation Expert Section - NEW */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Accompagnement personnalisé
          </h2>
          <ConsultationButton variant="full" />
        </div>

        {/* Next Steps - Updated with working download button */}
        <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">Prochaines étapes</h3>
            <p className="mb-6 opacity-90">
              Explorez davantage ces filières, rencontrez des professionnels du domaine et préparez votre dossier.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                variant="secondary" 
                onClick={downloadReport}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Génération..." : "Télécharger le rapport"}
              </Button>
              <ShareResults 
                level={level}
                grades={grades}
                gradingScale={gradingScale}
                hasCareerIdea={hasCareerIdea}
                careerGoal={careerGoal}
                averageGrade={averageGrade}
              />
              <ConsultationButton variant="compact" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsPage;
