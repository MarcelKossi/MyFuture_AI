/**
 * Hook pour génération PDF optimisée avec gestion d'erreurs
 * Génération asynchrone, templates configurables, compression
 */

import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import type { AnalysisResult, PDFExportData, AppError } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface PDFGenerationState {
  isGenerating: boolean;
  progress: number;
  error: AppError | null;
}

interface PDFGenerationResult {
  success: boolean;
  filename?: string;
  error?: AppError;
}

/**
 * Hook pour générer des PDFs de manière optimisée
 */
export const usePDFGenerator = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<PDFGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null
  });

  /**
   * Met à jour le progrès de génération
   */
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  /**
   * Génère un PDF à partir des résultats d'analyse
   */
  const generatePDF = useCallback(async (
    data: PDFExportData
  ): Promise<PDFGenerationResult> => {
    setState({
      isGenerating: true,
      progress: 0,
      error: null
    });

    try {
      // Import dynamique de jsPDF pour le code splitting
      updateProgress(10);
      const { default: jsPDF } = await import('jspdf');
      
      updateProgress(20);
      
      // Créer le document PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: data.format === 'letter' ? 'letter' : 'a4'
      });

      // Configuration des couleurs et styles
      const primaryColor: [number, number, number] = [41, 128, 185]; // Bleu principal
      const textColor: [number, number, number] = [44, 62, 80]; // Gris foncé
      const lightColor: [number, number, number] = [236, 240, 241]; // Gris clair

      updateProgress(30);

      // En-tête du document
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pdf.internal.pageSize.width, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MyFuture AI', 20, 25);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('results.title'), 20, 35);

      updateProgress(40);

      // Informations du profil
      let yPosition = 60;
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('results.profile_summary'), 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const profileInfo = [
        `${t('results.average')}: ${data.analysisResult.generalAverage.toFixed(2)}`,
        `${t('results.subjects_evaluated')}: ${data.analysisResult.userProfile.subjects.length}`,
        `${t('results.grading_scale')}: /${data.analysisResult.userProfile.gradingScale}`
      ];

      profileInfo.forEach(info => {
        pdf.text(info, 25, yPosition);
        yPosition += 8;
      });

      updateProgress(60);

      // Recommandations
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('results.general_fields'), 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      data.analysisResult.recommendedFields
        .filter(field => field.type === 'general')
        .slice(0, 5)
        .forEach(field => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`• ${field.name}`, 25, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`  ${t('results.compatible')}: ${field.compatibilityScore}%`, 25, yPosition);
          yPosition += 10;
          
          // Vérifier si on doit changer de page
          if (yPosition > pdf.internal.pageSize.height - 40) {
            pdf.addPage();
            yPosition = 30;
          }
        });

      updateProgress(80);

      // Conseils d'amélioration si demandés
      if (data.includeAdvice && data.analysisResult.improvementAdvice.length > 0) {
        yPosition += 10;
        
        if (yPosition > pdf.internal.pageSize.height - 60) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('results.improvement_advice'), 20, yPosition);
        
        yPosition += 15;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        data.analysisResult.improvementAdvice.slice(0, 3).forEach(advice => {
          const lines = pdf.splitTextToSize(advice, pdf.internal.pageSize.width - 50);
          pdf.text(lines, 25, yPosition);
          yPosition += lines.length * 6 + 5;
        });
      }

      updateProgress(90);

      // Pied de page
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `${t('app.title')} - ${new Date().toLocaleDateString()}`,
          20,
          pdf.internal.pageSize.height - 10
        );
        pdf.text(
          `${i}/${pageCount}`,
          pdf.internal.pageSize.width - 30,
          pdf.internal.pageSize.height - 10
        );
      }

      updateProgress(95);

      // Téléchargement
      const filename = `myfuture-results-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);

      updateProgress(100);

      setState({
        isGenerating: false,
        progress: 100,
        error: null
      });

      return { success: true, filename };

    } catch (error) {
      const appError: AppError = {
        code: 'PDF_GENERATION_ERROR',
        message: t('toast.report_error'),
        details: error,
        timestamp: new Date()
      };

      setState({
        isGenerating: false,
        progress: 0,
        error: appError
      });

      return { success: false, error: appError };
    }
  }, [t, updateProgress]);

  /**
   * Génère un screenshot d'un élément et l'ajoute au PDF
   */
  const captureElementToPDF = useCallback(async (
    element: HTMLElement,
    pdf: any,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> => {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(imgData, 'JPEG', x, y, width, height);
    } catch (error) {
      console.warn('Erreur capture screenshot:', error);
    }
  }, []);

  return {
    ...state,
    generatePDF,
    captureElementToPDF
  };
};