import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { testConnection } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/i18n';

export default function Settings() {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      if (result.error) {
        setTestResult({ success: false, message: result.error });
      } else {
        setTestResult({ success: true, message: t('settings.connectionSuccess') });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || t('settings.connectionError') });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-accent" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" />
            {t('settings.dbConnection')}
          </CardTitle>
          <CardDescription>
            {t('settings.dbConnectionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t('settings.mysqlConnection')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.mysqlConnectionDesc')}</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-[#9F121A]/15 text-[#9F121A] border-[#9F121A]/30">
              MySQL
            </Badge>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('settings.testing')}</>
              ) : t('settings.testConnection')}
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testResult.success 
                ? 'bg-[#9F121A]/10 text-[#9F121A] border border-[#9F121A]/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {testResult.success 
                ? <CheckCircle2 className="w-4 h-4 text-[#9F121A] flex-shrink-0" /> 
                : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
