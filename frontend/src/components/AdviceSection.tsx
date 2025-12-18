
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, TrendingUp, Users, Lightbulb, ExternalLink } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { validateShareUrl } from "@/lib/security";
import { toast } from "sonner";

interface AdviceSectionProps {
  onBack: () => void;
  onStartOrientation: () => void;
}

const AdviceSection = ({ onBack, onStartOrientation }: AdviceSectionProps) => {
  const { t } = useTranslation();
  const popularFields = [
    {
      title: t('advice.fields.science_tech.title'),
      description: t('advice.fields.science_tech.description'),
      icon: "🔬",
      trend: t('advice.fields.science_tech.trend'),
      searchQuery: "sciences technologies informatique ingénierie carrières"
    },
    {
      title: t('advice.fields.health.title'),
      description: t('advice.fields.health.description'),
      icon: "🏥",
      trend: t('advice.fields.health.trend'),
      searchQuery: "médecine santé pharmacie infirmière carrières"
    },
    {
      title: t('advice.fields.business.title'),
      description: t('advice.fields.business.description'),
      icon: "💼",
      trend: t('advice.fields.business.trend'),
      searchQuery: "commerce gestion marketing finance entrepreneuriat"
    },
    {
      title: t('advice.fields.education.title'),
      description: t('advice.fields.education.description'),
      icon: "📚",
      trend: t('advice.fields.education.trend'),
      searchQuery: "éducation enseignement formation pédagogie carrières"
    },
    {
      title: t('advice.fields.environment.title'),
      description: t('advice.fields.environment.description'),
      icon: "🌱",
      trend: t('advice.fields.environment.trend'),
      searchQuery: "environnement développement durable écologie énergie renouvelable"
    },
    {
      title: t('advice.fields.communication.title'),
      description: t('advice.fields.communication.description'),
      icon: "📺",
      trend: t('advice.fields.communication.trend'),
      searchQuery: "communication médias journalisme relations publiques digital"
    },
    {
      title: t('advice.fields.law.title'),
      description: t('advice.fields.law.description'),
      icon: "⚖️",
      trend: t('advice.fields.law.trend'),
      searchQuery: "droit sciences politiques avocat magistrature administration"
    },
    {
      title: t('advice.fields.arts.title'),
      description: t('advice.fields.arts.description'),
      icon: "🎨",
      trend: t('advice.fields.arts.trend'),
      searchQuery: "arts design graphique architecture arts visuels carrières"
    }
  ];

  const adviceCards = [
    {
      title: t('advice.cards.choose_field.title'),
      content: t('advice.cards.choose_field.content'),
      icon: <Lightbulb className="h-6 w-6" />,
      link: "https://www.google.com/search?q=comment+choisir+sa+filière+universitaire+conseils"
    },
    {
      title: t('advice.cards.future_jobs.title'),
      content: t('advice.cards.future_jobs.content'),
      icon: <TrendingUp className="h-6 w-6" />,
      link: "https://www.google.com/search?q=métiers+d'avenir+2024+intelligence+artificielle+développement+durable"
    },
    {
      title: t('advice.cards.testimonials.title'),
      content: t('advice.cards.testimonials.content'),
      icon: <Users className="h-6 w-6" />,
      link: "https://www.google.com/search?q=témoignages+étudiants+université+filières+expériences"
    }
  ];

  const handleFieldClick = (searchQuery: string) => {
    if (!validateShareUrl('https://www.google.com/search')) {
      toast.error(t('errors.invalidUrl'));
      return;
    }
    
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  const handleLearnMoreClick = (link: string) => {
    if (!validateShareUrl(link)) {
      toast.error(t('errors.invalidUrl'));
      return;
    }
    
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <PublicHeader />

        {/* Header */}
        <div className="flex items-center gap-4 mt-6 mb-8">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('advice.section.title')}</h1>
            <p className="text-gray-600">{t('advice.section.subtitle')}</p>
          </div>
        </div>

        {/* Popular Fields */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('advice.popular_fields')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularFields.map((field, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => handleFieldClick(field.searchQuery)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-2">{field.icon}</div>
                  <CardTitle className="text-lg">{field.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 mb-3">{field.description}</p>
                  <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mb-3">
                    <TrendingUp className="h-3 w-3" />
                    {field.trend}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                    <ExternalLink className="h-3 w-3" />
                    {t('advice.click_to_explore')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advice Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('advice.orientation_advice')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {adviceCards.map((advice, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {advice.icon}
                    </div>
                    <CardTitle className="text-lg">{advice.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{advice.content}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleLearnMoreClick(advice.link)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('results.learn_more')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-green-50">
            <CardContent className="p-8">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {t('advice.ready_for_personalized')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('advice.get_specific_recommendations')}
              </p>
              <Button 
                onClick={onStartOrientation}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {t('advice.start_orientation')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdviceSection;
