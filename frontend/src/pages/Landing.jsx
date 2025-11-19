import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#0a1929] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/younivity-logo.png" alt="YOUNIVITY Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-white font-bold text-xl tracking-wider">YOUNIVITY</h1>
        </header>

        {/* Main content */}
        <div className="text-center space-y-12 max-w-2xl mt-8">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img src="/younivity-logo.png" alt="YOUNIVITY" className="w-32 h-32" />
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              UNIFY YOUR<br />ACADEMIC LIFE
            </h2>

            <p className="text-teal-200 text-lg max-w-md mx-auto">
              Manage assignments, collaborate with groups, and organize your schedule - all in one place
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 items-center">
            <Button
              data-testid="start-now-btn"
              onClick={() => navigate('/auth?mode=signup')}
              className="w-64 h-14 bg-white hover:bg-gray-100 text-[#0a1929] font-semibold text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
              style={{fontFamily: 'Space Grotesk, sans-serif'}}
            >
              Start Now
            </Button>

            <Button
              data-testid="login-btn"
              onClick={() => navigate('/auth?mode=login')}
              className="w-64 h-14 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
              style={{fontFamily: 'Space Grotesk, sans-serif'}}
            >
              Log In
            </Button>
          </div>

          {/* Ad Placement Zone */}
          <div className="mt-16 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <p className="text-teal-200/60 text-sm" style={{fontFamily: 'Inter, sans-serif'}}>Ad Space - Integration Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
