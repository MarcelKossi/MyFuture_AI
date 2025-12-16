/**
 * Tableau de bord de sécurité pour surveiller l'état de l'application
 * Affiche les métriques et alertes de sécurité en temps réel
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { useSecurity } from '@/components/SecurityProvider';
import { globalErrorHandler } from '@/lib/errorHandler';
import { globalRateLimiter } from '@/lib/rateLimit';

interface SecurityDashboardProps {
  className?: string;
  showAdvanced?: boolean;
}

/**
 * Composant principal du tableau de bord de sécurité
 */
export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ 
  className = '',
  showAdvanced = false
}) => {
  const security = useSecurity();
  const [metrics, setMetrics] = useState(() => security.getSecurityMetrics());
  const [recentErrors, setRecentErrors] = useState(() => globalErrorHandler.getRecentErrors(5));
  const [refreshing, setRefreshing] = useState(false);

  // Actualisation automatique des métriques
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(security.getSecurityMetrics());
      setRecentErrors(globalErrorHandler.getRecentErrors(5));
    }, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, [security]);

  /**
   * Actualise manuellement les données
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMetrics(security.getSecurityMetrics());
    setRecentErrors(globalErrorHandler.getRecentErrors(10));
    setRefreshing(false);
  };

  /**
   * Obtient la couleur d'un badge selon la sévérité
   */
  const getSeverityColor = (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'default';
    }
  };

  /**
   * Obtient l'icône selon le type d'alerte
   */
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'XSS_ATTEMPT': return <XCircle className="h-4 w-4" />;
      case 'INJECTION_ATTEMPT': return <AlertTriangle className="h-4 w-4" />;
      case 'RATE_LIMIT': return <Clock className="h-4 w-4" />;
      case 'INVALID_INPUT': return <Info className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  /**
   * Calcule le statut global de sécurité
   */
  const getSecurityStatus = () => {
    if (metrics.isUnderAttack) {
      return { 
        status: 'Alerte', 
        color: 'destructive' as const, 
        icon: <AlertTriangle className="h-5 w-5" />
      };
    }
    
    if (metrics.totalAlerts > 10) {
      return { 
        status: 'Attention', 
        color: 'secondary' as const, 
        icon: <Eye className="h-5 w-5" />
      };
    }
    
    return { 
      status: 'Sécurisé', 
      color: 'default' as const, 
      icon: <CheckCircle className="h-5 w-5" />
    };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statut global */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord Sécurité</h2>
            <p className="text-gray-600">Surveillance en temps réel de la sécurité applicative</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={securityStatus.color} className="flex items-center gap-2">
            {securityStatus.icon}
            {securityStatus.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alertes (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAlerts}</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Dernière heure</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">XSS Détectées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.alertsByType.XSS_ATTEMPT || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-500">Tentatives bloquées</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Injections SQL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.alertsByType.INJECTION_ATTEMPT || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-gray-500">Tentatives bloquées</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Limite de Taux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.alertsByType.RATE_LIMIT || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-500">Dépassements</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte si sous attaque */}
      {metrics.isUnderAttack && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Application sous attaque détectée!</AlertTitle>
          <AlertDescription>
            Un nombre élevé d'alertes de sécurité a été détecté. 
            Surveillance renforcée activée automatiquement.
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets de détails */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Alertes Récentes</TabsTrigger>
          <TabsTrigger value="errors">Erreurs Système</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Avancé</TabsTrigger>}
        </TabsList>

        {/* Alertes récentes */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Alertes de Sécurité Récentes
              </CardTitle>
              <CardDescription>
                Les 10 dernières alertes détectées par le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {security.alertHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Aucune alerte récente</p>
                  <p className="text-sm">Votre application est sécurisée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {security.alertHistory.slice(-10).reverse().map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.type}</span>
                          <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erreurs système */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Erreurs Système Récentes
              </CardTitle>
              <CardDescription>
                Erreurs capturées par le gestionnaire global
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentErrors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Aucune erreur récente</p>
                  <p className="text-sm">Système stable</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">{error.code}</span>
                        <Badge variant="destructive" className="text-xs">
                          {error.statusCode}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{error.userMessage}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet avancé */}
        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Avancée</CardTitle>
                <CardDescription>
                  Outils de diagnostic et configuration système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => globalErrorHandler.clearErrorQueue()}
                  >
                    Vider le Cache d'Erreurs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      globalRateLimiter.cleanup();
                      console.log('Rate limit cache cleaned');
                    }}
                  >
                    Nettoyer Rate Limiting
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  <p>Version: 1.0.0</p>
                  <p>Dernière mise à jour: {new Date().toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};