
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Plus, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FileUploadProps {
  level: string;
  onProcessComplete: (grades: Record<string, number>, scale: number) => void;
  onBack: () => void;
}

const FileUpload = ({ level, onProcessComplete, onBack }: FileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const readableLimit = useMemo(() => "10 MB", []);
  const maxBytes = 10 * 1024 * 1024;
  const acceptedTypes = useMemo(() => ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"], []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > maxBytes) {
        setError(t('file_upload.max_size'));
        continue;
      }
      if (!acceptedTypes.includes(file.type)) {
        setError(t('file_upload.formats'));
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleProcessDocuments = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    console.log("Processing documents:", uploadedFiles);
    
    // Simuler le traitement des documents
    setTimeout(() => {
      // Générer des notes d'exemple basées sur le niveau
      const mockGrades: Record<string, number> = {};
      const subjectsByLevel = {
        bepc: ["Français", "Mathématiques", "Histoire-Géographie", "Sciences Physiques"],
        bac: ["Français", "Mathématiques", "Histoire-Géographie", "Philosophie", "Sciences Physiques"],
        licence: ["Analyse", "Algèbre", "Statistiques", "Économétrie"],
        master: ["Recherche", "Méthodologie", "Projet", "Stage"],
        doctorat: ["Thèse", "Publications", "Enseignement"]
      };
      
      const subjects = subjectsByLevel[level as keyof typeof subjectsByLevel] || [];
      subjects.forEach(subject => {
        mockGrades[subject] = Math.floor(Math.random() * 5) + 15; // Notes entre 15 et 20
      });
      
      setIsProcessing(false);
      onProcessComplete(mockGrades, 20);
    }, 2000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('file_upload.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">{t('file_upload.drag_drop')}</p>
          <p className="text-sm text-gray-500 mb-4">{t('file_upload.or_click')}</p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" type="button">{t('file_upload.choose_files')}</Button>
          </label>
        </div>
        
        {/* Liste des fichiers uploadés */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">{t('file_upload.selected_files')}</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        
        <div className="text-sm text-gray-600 space-y-1">
          <p>{t('file_upload.formats')}</p>
          <p>{t('file_upload.max_size')} ({readableLimit})</p>
          <p>{t('file_upload.resolution')}</p>
        </div>

        <input
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
          id="additional-file-upload"
        />
        <label htmlFor="additional-file-upload">
          <Button variant="outline" className="w-full flex items-center gap-2" type="button">
            <Plus className="h-4 w-4" />
            {t('file_upload.add_another')}
          </Button>
        </label>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Retour
          </Button>
          <Button 
            onClick={handleProcessDocuments} 
            disabled={uploadedFiles.length === 0 || isProcessing}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isProcessing ? t('file_upload.analyzing') : t('file_upload.analyze')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
