import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await login({ email, password, remember });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ email: [t('login.invalidCredentials')] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0 animate-gradient-shift opacity-40"
        style={{
          background: 'linear-gradient(-45deg, #9F121A, #D4A853, #1a365d, #9F121A)',
          backgroundSize: '400% 400%',
        }}
      />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[100px]" />

      {/* Decorative elements */}
      <div
        className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #9F121A 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative"
      >
        <Card className="relative overflow-hidden border border-border/60 shadow-xl bg-card/80 backdrop-blur-xl">
          {/* Gold accent top */}
          <div
            className="absolute top-0 left-0 w-full h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #D4A853, transparent)' }}
          />

          {/* Corner glows */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)' }}
          />

          <CardHeader className="text-center pt-8 pb-4 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.15) 0%, rgba(212,168,83,0.05) 100%)',
              }}
            >
              <img
                src="https://media.base44.com/images/public/69f10e36f5d3972acca5a916/87a1cfef6_Artboard47x-8.png"
                alt="HWS Logo"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
            <CardTitle className="text-xl font-display font-semibold tracking-tight">
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mgh-dashboard.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className="h-10 bg-background/50 backdrop-blur-sm border-border/60 focus:border-[#D4A853]/50 transition-all duration-200"
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.email[0]}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 bg-background/50 backdrop-blur-sm border-border/60 focus:border-[#D4A853]/50 transition-all duration-200"
                />
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.password[0]}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-border/60 text-[#9F121A] focus:ring-[#D4A853]/30 focus:ring-offset-0 transition-colors duration-200"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none group-hover:text-foreground transition-colors duration-200">
                    {t('login.rememberMe')}
                  </Label>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('login.signingIn')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t('login.signIn')}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
