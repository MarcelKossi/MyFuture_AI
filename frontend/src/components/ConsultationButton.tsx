
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Globe, MessageCircle, UserCheck } from "lucide-react";
import { consultationConfig } from "@/config/consultationConfig";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { validateShareUrl } from "@/lib/security";
import { globalRateLimiter } from "@/lib/rateLimit";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";

interface ConsultationButtonProps {
  variant?: "compact" | "full";
  className?: string;
}

const ConsultationButton = ({ variant = "compact", className = "" }: ConsultationButtonProps) => {
  const { t } = useTranslation();
  const { logSecurityAlert } = useSecurityMonitor();
  
  if (!consultationConfig.enabled) {
    return null;
  }

  const handleContactMethod = (method: string, value: string) => {
    const rateLimitResult = globalRateLimiter.recordAttempt('consultation', method);
    
    if (!rateLimitResult.allowed) {
      toast.error(t('errors.rateLimit'));
      logSecurityAlert({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        message: `Rate limit exceeded for consultation ${method}`
      });
      return;
    }

    // Validation des URLs pour website et whatsapp
    if ((method === 'website' || method === 'whatsapp') && !validateShareUrl(value)) {
      toast.error(t('errors.invalidUrl'));
      logSecurityAlert({
        type: 'INVALID_INPUT',
        severity: 'HIGH',
        message: `Invalid URL in consultation ${method}: ${value}`
      });
      return;
    }

    switch (method) {
      case 'phone':
        window.open(`tel:${value}`, '_self');
        toast.success(t('consultation.opened.phone'));
        break;
      case 'email':
        window.open(`mailto:${value}?subject=Demande de consultation - MyFuture AI`, '_self');
        toast.success(t('consultation.opened.email'));
        break;
      case 'website':
        window.open(value, '_blank');
        toast.success(t('consultation.opened.website'));
        break;
      case 'whatsapp':
        const message = encodeURIComponent("Bonjour, je souhaiterais une consultation pour mon orientation suite à mon test MyFuture AI.");
        const cleanNumber = value.replace(/[\s\-\(\)]/g, '');
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        toast.success(t('consultation.opened.whatsapp'));
        break;
    }
  };

  if (variant === "compact") {
    return (
      <Button 
        variant="outline" 
        className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none hover:from-purple-700 hover:to-blue-700 ${className}`}
        onClick={() => handleContactMethod('website', consultationConfig.website)}
      >
        <UserCheck className="h-4 w-4 mr-2" />
        {t('consultation.title')}
      </Button>
    );
  }

  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <UserCheck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">{consultationConfig.name}</h3>
          <p className="text-sm text-gray-600">{consultationConfig.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {consultationConfig.preferredMethods.phone && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleContactMethod('phone', consultationConfig.phone)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Phone className="h-4 w-4 mr-1" />
              {t('consultation.call')}
            </Button>
          )}
          
          {consultationConfig.preferredMethods.email && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleContactMethod('email', consultationConfig.email)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 mr-1" />
              {t('consultation.email')}
            </Button>
          )}
          
          {consultationConfig.preferredMethods.website && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleContactMethod('website', consultationConfig.website)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Globe className="h-4 w-4 mr-1" />
              {t('consultation.website')}
            </Button>
          )}
          
          {consultationConfig.preferredMethods.whatsapp && consultationConfig.whatsapp && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleContactMethod('whatsapp', consultationConfig.whatsapp)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {t('consultation.whatsapp')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationButton;
