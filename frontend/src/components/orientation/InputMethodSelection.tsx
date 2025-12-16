
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface InputMethodSelectionProps {
  onMethodSelect: (method: "manual" | "upload") => void;
}

const InputMethodSelection = ({ onMethodSelect }: InputMethodSelectionProps) => {
  const { t } = useTranslation();
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('inputMethod.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full h-16 text-left flex items-center gap-4"
          onClick={() => onMethodSelect("manual")}
          aria-label={t('inputMethod.manual.title')}
        >
          <div className="p-2 bg-blue-100 rounded">
            📝
          </div>
          <div>
            <div className="font-medium">{t('inputMethod.manual.title')}</div>
            <div className="text-sm text-gray-600">{t('inputMethod.manual.description')}</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-16 text-left flex items-center gap-4"
          onClick={() => onMethodSelect("upload")}
          aria-label={t('inputMethod.upload.title')}
        >
          <div className="p-2 bg-green-100 rounded">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{t('inputMethod.upload.title')}</div>
            <div className="text-sm text-gray-600">{t('inputMethod.upload.description')}</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export default InputMethodSelection;
