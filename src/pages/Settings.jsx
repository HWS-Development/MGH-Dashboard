import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Key, Globe, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { testConnection } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const SETTING_KEYS = [
  { key: 'supabase_url', label: 'Supabase Project URL', placeholder: 'https://xxxx.supabase.co', icon: Globe, sensitive: false },
  { key: 'supabase_service_role_key', label: 'Supabase Service Role Key', placeholder: 'sb_secret_...', icon: Key, sensitive: true },
  { key: 'anthropic_api_key', label: 'Anthropic API Key', placeholder: 'sk-ant-...', icon: Key, sensitive: true },
];

export default function Settings() {
  const [values, setValues] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.app_settings.list(),
    initialData: [],
  });

  useEffect(() => {
    if (settings.length > 0) {
      const vals = {};
      settings.forEach(s => { vals[s.key] = s.value; });
      setValues(vals);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (newValues) => {
      for (const settingDef of SETTING_KEYS) {
        const existing = settings.find(s => s.key === settingDef.key);
        const val = newValues[settingDef.key] || '';
        if (existing) {
          await base44.entities.app_settings.update(existing.id, { value: val });
        } else if (val) {
          await base44.entities.app_settings.create({ key: settingDef.key, value: val });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: 'Paramètres enregistrés', description: 'Les paramètres ont été sauvegardés avec succès.', duration: 3000 });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(values);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      if (result.error) {
        setTestResult({ success: false, message: result.error });
      } else {
        setTestResult({ success: true, message: 'Connexion réussie ! Données accessibles.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Erreur de connexion' });
    }
    setTesting(false);
  };

  const maskValue = (val) => {
    if (!val || val.length < 8) return '••••••••';
    return val.slice(0, 6) + '••••••••' + val.slice(-4);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-accent" />
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">Configuration de la connexion Supabase et des services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" />
            Connexion Base de Données
          </CardTitle>
          <CardDescription>
            Configurez les clés d'accès à votre base Supabase et les services API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SETTING_KEYS.map(setting => (
            <div key={setting.key} className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <setting.icon className="w-3.5 h-3.5 text-muted-foreground" />
                {setting.label}
              </Label>
              <div className="relative">
                <Input
                  type={setting.sensitive && !showKeys[setting.key] ? 'password' : 'text'}
                  placeholder={setting.placeholder}
                  value={values[setting.key] || ''}
                  onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                  className="pr-10"
                />
                {setting.sensitive && (
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, [setting.key]: !showKeys[setting.key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[setting.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : 'Enregistrer'}
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Test en cours...</>
              ) : 'Tester la connexion'}
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success 
                ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> 
                : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}