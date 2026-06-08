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
        <h1 className="page-title flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="page-subtitle mt-0.5">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="section-title">
            <Database className="w-5 h-5 text-primary" />
            {t('settings.dbConnection')}
          </CardTitle>
          <CardDescription>
            {t('settings.dbConnectionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t('settings.mysqlConnection')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.mysqlConnectionDesc')}</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">
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
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                : 'bg-red-500/10 text-red-600 border border-red-200'
            }`}>
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
