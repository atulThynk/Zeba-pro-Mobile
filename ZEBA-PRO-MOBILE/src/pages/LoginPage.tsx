import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logoImage from '../public/assets/zebaDark.png';
import { toast } from '@/hooks/use-toast';
import LoadingSmiley from '@/components/Loader'

const LoginPage = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        description: "Please enter both email and password.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      toast({
        description: "Successfully signed in!",
        variant: "default",
        duration: 3000,
      });
      navigate.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      toast({
        description: "Google login will be integrated with your API.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error('Google login failed:', error);
      toast({
        description: "Google login failed. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsSubmitting(true);
    try {
      toast({
        description: "Microsoft login will be integrated with your API.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error('Microsoft login failed:', error);
      toast({
        description: "Microsoft login failed. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const goBack = () => {
    setShowEmailForm(false);
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  // Effect to focus email input when showEmailForm changes to true
  React.useEffect(() => {
    if (showEmailForm) {
      const timer = setTimeout(() => {
        const emailInput = document.getElementById('email');
        if (emailInput) {
          emailInput.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showEmailForm]);
  React.useEffect(() => {
  const handlePopState = (event:any) => {
    if (showEmailForm) {
      event.preventDefault();
      goBack();
      window.history.pushState(null, "", window.location.href);
    }
  };
  if (showEmailForm) {
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
  }

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, [showEmailForm]);

  return (
    <div
      className="min-h-screen bg-center flex items-center justify-center p-4 bg-gradient-to-t from-gray-500 to-white"
    >
      {showEmailForm && (
        <button
          onClick={goBack}
          className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 ease-in-out mt-10"
          aria-label="Back to sign in options"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
        </button>
      )}

      {!showEmailForm ? (
        <div className="w-full max-w-md animate-fade-in bg-opacity-80 rounded-md p-8 text-gray-900 relative">
          <div className="space-y-6">
            <div>
              <img src={logoImage} alt="Logo" className="h-28 w-auto mx-auto mb-32" />
            </div>
            <div>
              <h1 className="text-3xl text-center mb-2">Welcome Back</h1>
              <h1 className="text-sm text-center mb-8 text-gray-500">Log in to your zeba account to continue</h1>
            </div>

            {/* <Button
              type="button"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 !rounded-3xl font-medium transition-colors duration-200 ease-in-out "
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <svg
                className="mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
              </svg>
              Sign in with Google
            </Button> */}

            {/* <Button
              type="button"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 !rounded-3xl font-medium transition-colors duration-200 ease-in-out "
              onClick={handleMicrosoftLogin}
              disabled={isSubmitting}
            >
              <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path fill="#f1511b" d="M11.4 4H4v7.4h7.4V4z" />
                <path fill="#80cc28" d="M20 4h-7.4v7.4H20V4z" />
                <path fill="#00adef" d="M11.4 12.6H4V20h7.4v-7.4z" />
                <path fill="#fbbc09" d="M20 12.6h-7.4V20H20v-7.4z" />
              </svg>
              Sign in with Microsoft
            </Button> */}

            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 !rounded-3xl font-medium transition-colors duration-200 ease-in-out "
              onClick={() => setShowEmailForm(true)}
              disabled={isSubmitting}
            >
              <Mail className="mr-3 h-5 w-5" />
              Sign in with Email
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full min-h-screen max-w-md animate-fade-in bg-opacity-80 rounded-md p-8 text-gray-900 relative mt-16">
          <div className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="!bg-gray-50 border-none text-gray-900 py-3 px-4 !rounded-3xl w-full focus:ring-2 focus:ring-blue-600 border-gray-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="!bg-gray-50 border-none text-gray-900 py-3 px-4 !rounded-3xl w-full pr-10 focus:ring-2 focus:ring-blue-600 border-gray-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 !rounded-3xl font-medium transition-colors duration-200 ease-in-out "
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;