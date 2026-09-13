import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-8 shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[12px] text-[#9CA3AF] hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>

        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#00C896] mx-auto" />
            <h2 className="text-[18px] font-bold text-white">Check your inbox</h2>
            <p className="text-[13px] text-[#9CA3AF]">
              If an account exists for {email}, password recovery instructions have been sent.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-[20px] font-bold text-white mb-1">Reset your password</h1>
            <p className="text-[13px] text-[#9CA3AF] mb-6">
              Enter your email address and we’ll send you a recovery link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#00C896] text-[#0D1117] text-[13px] font-bold rounded-[6px] hover:bg-[#00b084] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Recovery Instructions'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
