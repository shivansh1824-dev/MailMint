import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_top,#001A11_0%,transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#111827] border border-[#2D3A4A] flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#00C896] shadow-[0_0_10px_#00C896]"></span>
            </div>
            <span className="font-sans font-bold text-[20px] text-white tracking-tight">
              MailMint
            </span>
          </Link>
          <h1 className="text-[22px] font-bold text-white mb-1">
            Create your account
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Start sending thoughtful, personalized recruiter emails
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-[6px] bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-[13px] text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
              />
            </div>
          </div>

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
                placeholder="alex@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-[#00C896] text-[#0D1117] text-[13px] font-bold rounded-[6px] hover:bg-[#00b084] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,200,150,0.2)]"
          >
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[#9CA3AF]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00C896] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
