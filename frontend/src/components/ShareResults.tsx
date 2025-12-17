import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ConsultationButton from "./ConsultationButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { validateShareUrl } from "@/lib/security";
import { globalRateLimiter } from "@/lib/rateLimit";
import type { PDFExportData, AnalysisResult } from "@/types";

interface ShareResultsProps {
  level: string;
  grades: Record<string, number>;
  gradingScale: number;
  hasCareerIdea: boolean | null;
  careerGoal: string;
  averageGrade: number;
}

const ShareResults = ({ level, grades, gradingScale, hasCareerIdea, careerGoal, averageGrade }: ShareResultsProps) => {
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { sanitizeAndValidate, logSecurityAlert } = useSecurityMonitor();
  const { generatePDF, isGenerating, progress, error } = usePDFGenerator();

  const shareUrl = window.location.href;

  const handleCopyLink = async () => {
    const rateLimitResult = globalRateLimiter.recordAttempt('share_results', 'copy_link');
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      logSecurityAlert({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        message: 'Rate limit exceeded for copy link'
      });
      return;
    }

    if (!validateShareUrl(shareUrl)) {
      toast.error(t('errors.invalidUrl'));
      logSecurityAlert({
        type: 'INVALID_INPUT',
        severity: 'HIGH',
        message: 'Invalid share URL detected'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('shareResults.copy.success'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('shareResults.copy.error'));
    }
  };

  const handleGeneratePDF = async () => {
    const sanitizedName = sanitizeAndValidate(userName, 'userName');
    
    if (!sanitizedName || !sanitizedName.trim()) {
      toast.error(t('shareResults.pdf.nameRequired'));
      return;
    }

    const rateLimitResult = globalRateLimiter.recordAttempt('pdf_generation', 'generate');
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      logSecurityAlert({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        message: 'Rate limit exceeded for PDF generation'
      });
      return;
    }

    // Créer les données d'analyse pour le PDF
    const analysisResult: AnalysisResult = {
      generalAverage: averageGrade,
      userProfile: {
        level: level as any,
        subjects: Object.entries(grades).map(([name, grade], index) => ({ 
          id: `subject-${index}`,
          name, 
          grade,
          isRequired: true
        })),
        gradingScale: gradingScale as any,
        inputMethod: 'manual' as const,
        hasCareerIdea: hasCareerIdea || false,
        careerGoal: careerGoal || ''
      },
      recommendedFields: [
        {
          id: 'field-1',
          name: hasCareerIdea ? careerGoal : 'Exploration générale',
          type: 'general' as const,
          compatibilityScore: Math.round(averageGrade / gradingScale * 100),
          description: `Basé sur votre moyenne de ${averageGrade.toFixed(1)}/${gradingScale}`,
          requiredSubjects: [],
          careerProspects: ['Excellent potentiel'],
          minimumGrade: 10
        }
      ],
      improvementAdvice: [
        `Continuez à maintenir votre moyenne de ${averageGrade.toFixed(1)}/${gradingScale}`,
        'Explorez des domaines connexes à vos matières fortes',
        'Considérez des stages ou projets pratiques'
      ]
    };

    const pdfData: PDFExportData = {
      analysisResult,
      studentName: sanitizedName,
      includeAdvice: true,
      format: 'A4' as const
    };

    const result = await generatePDF(pdfData);
    
    if (result.success) {
      toast.success(t('shareResults.pdf.success'));
      setIsOpen(false);
    } else {
      toast.error(result.error?.message || t('shareResults.pdf.error'));
    }
  };

  const handleWhatsAppShare = () => {
    const rateLimitResult = globalRateLimiter.recordAttempt('share_results', 'whatsapp');
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      return;
    }

    if (!validateShareUrl(shareUrl)) {
      toast.error(t('errors.invalidUrl'));
      return;
    }

    const message = `Découvrez mes recommandations d'orientation avec MyFuture AI ! 📚✨ Moyenne: ${averageGrade.toFixed(1)}/${gradingScale} - Niveau: ${level.toUpperCase()}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramShare = () => {
    const rateLimitResult = globalRateLimiter.recordAttempt('share_results', 'instagram');
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      return;
    }

    if (!validateShareUrl(shareUrl)) {
      toast.error(t('errors.invalidUrl'));
      return;
    }

    navigator.clipboard.writeText(shareUrl);
    toast.success(t('shareResults.instagram.copied'));
  };

  const handleSnapchatShare = () => {
    const rateLimitResult = globalRateLimiter.recordAttempt('share_results', 'snapchat');
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      return;
    }

    if (!validateShareUrl(shareUrl)) {
      toast.error(t('errors.invalidUrl'));
      return;
    }

    navigator.clipboard.writeText(shareUrl);
    toast.success(t('shareResults.snapchat.copied'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
          <Share2 className="h-4 w-4 mr-2" />
          {t('shareResults.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('shareResults.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Nom utilisateur pour le PDF */}
          <div className="space-y-2">
            <Label htmlFor="userName">{t('shareResults.nameLabel')}</Label>
            <Input
              id="userName"
              placeholder={t('shareResults.namePlaceholder')}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          {/* Génération PDF */}
          <Button 
            onClick={handleGeneratePDF} 
            disabled={isGenerating || !userName.trim()}
            className="w-full"
          >
            {isGenerating ? `${t('shareResults.generating')} ${progress}%` : t('shareResults.downloadPdf')}
          </Button>
          
          {error && (
            <p className="text-sm text-red-600">{error.message}</p>
          )}

          {/* Copier le lien */}
          <div className="flex items-center space-x-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button onClick={handleCopyLink} size="sm" variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Options de partage social */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('shareResults.socialShare')}</p>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={handleWhatsAppShare} variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                {t('shareResults.whatsapp')}
              </Button>
              <Button onClick={handleInstagramShare} variant="outline" size="sm" className="text-pink-600 border-pink-200 hover:bg-pink-50">
                {t('shareResults.instagram')}
              </Button>
              <Button onClick={handleSnapchatShare} variant="outline" size="sm" className="text-yellow-500 border-yellow-200 hover:bg-yellow-50">
                {t('shareResults.snapchat')}
              </Button>
            </div>
          </div>

          {/* Nouveau : Consultation d'expert */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('shareResults.needHelp')}</p>
            <ConsultationButton variant="full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareResults;
