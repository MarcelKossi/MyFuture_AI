/**
 * Composant de téléchargement de fichiers sécurisé
 * Validation des types de fichiers et limitation de taille
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface SecureFileUploadProps {
  onFileProcessed: (data: any) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // en Mo
  allowedTypes?: string[];
  className?: string;
}

const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFileProcessed,
  onError,
  maxFileSize = 5, // 5Mo par défaut
  allowedTypes = ['.pdf', '.txt', '.csv', '.json'],
  className = ''
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  /**
   * Valide un fichier avant traitement
   */
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Vérification de la taille
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `Fichier trop volumineux. Taille maximale: ${maxFileSize}Mo`
      };
    }

    // Vérification du type de fichier
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      };
    }

    // Vérification du nom de fichier (pas de caractères dangereux)
    const dangerousChars = /[<>:"/\\|?*]/;
    if (dangerousChars.test(file.name)) {
      return {
        isValid: false,
        error: 'Nom de fichier contient des caractères non autorisés'
      };
    }

    return { isValid: true };
  }, [maxFileSize, allowedTypes]);

  /**
   * Traite un fichier de manière sécurisée
   */
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      const validation = validateFile(file);
      if (!validation.isValid) {
        onError(validation.error!);
        toast.error(validation.error);
        return;
      }

      // Lecture sécurisée du fichier
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          // Traitement selon le type de fichier
          if (file.name.endsWith('.json')) {
            const parsedData = JSON.parse(content);
            onFileProcessed(parsedData);
          } else if (file.name.endsWith('.csv')) {
            // Traitement CSV basique (à améliorer selon les besoins)
            const lines = content.split('\n');
            const data = lines.map(line => line.split(','));
            onFileProcessed(data);
          } else {
            // Fichier texte simple
            onFileProcessed({ content, filename: file.name });
          }

          setUploadedFile(file);
          toast.success('Fichier traité avec succès');
          
        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          onError('Erreur lors du traitement du fichier');
          toast.error('Erreur lors du traitement du fichier');
        }
      };

      reader.onerror = () => {
        onError('Erreur lors de la lecture du fichier');
        toast.error('Erreur lors de la lecture du fichier');
      };

      // Lecture du fichier en tant que texte
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      onError('Erreur inattendue lors du traitement');
      toast.error('Erreur inattendue lors du traitement');
    } finally {
      setIsProcessing(false);
    }
  }, [validateFile, onFileProcessed, onError]);

  /**
   * Gestionnaire de dépôt de fichier
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      toast.error('Un seul fichier à la fois');
      return;
    }

    if (files.length === 1) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * Gestionnaire de sélection de fichier
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * Supprime le fichier sélectionné
   */
  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    // Reset de l'input file
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('upload.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-gray-600">{t('upload.processing')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {t('upload.drag_drop_or')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2"
                  >
                    {t('upload.browse_files')}
                  </Button>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{t('upload.max_size')}: {maxFileSize}Mo</p>
                  <p>{t('upload.allowed_types')}: {allowedTypes.join(', ')}</p>
                </div>
              </div>
            )}

            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{uploadedFile.name}</p>
                  <p className="text-sm text-green-700">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">{t('upload.security_notice')}</p>
                <p>{t('upload.security_message')}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecureFileUpload;