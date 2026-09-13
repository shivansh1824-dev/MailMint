import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Settings,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();

  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    email: string | null;
    updatedAt: string | null;
  }>({ connected: false, email: null, updatedAt: null });

  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<any>(null);

  // Free Gmail App Password State
  const [appPasswordEmail, setAppPasswordEmail] = useState(user?.email || 'shivanshrai282@gmail.com');
  const [appPassword, setAppPassword] = useState('');
  const [isConnectingAppPassword, setIsConnectingAppPassword] = useState(false);
  const [appPasswordError, setAppPasswordError] = useState('');
  const [connectMethod, setConnectMethod] = useState<'app_password' | 'oauth'>('app_password');

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const [statusRes, settingsRes] = await Promise.all([
        api.get('/integrations/gmail/status'),
        api.get('/settings'),
      ]);
      if (statusRes.success) {
        setGmailStatus({
          connected: statusRes.connected,
          email: statusRes.email,
          updatedAt: statusRes.updatedAt,
        });
        if (statusRes.email) setAppPasswordEmail(statusRes.email);
      }
      if (settingsRes.success) setSettings(settingsRes.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check mock oauth query params
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mock_gmail_auth') === 'true') {
      api.get('/integrations/gmail/callback?code=mock_code').then(() => {
        refreshUser();
        fetchStatus();
      });
    }
  }, [location.search]);

  const handleConnectAppPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppPasswordError('');
    setIsConnectingAppPassword(true);
    try {
      const res = await api.post('/integrations/gmail/app-password', {
        email: appPasswordEmail,
        appPassword,
      });
      if (res.success) {
        alert(res.message || 'Connected Gmail via App Password!');
        refreshUser();
        fetchStatus();
        setAppPassword('');
      }
    } catch (err: any) {
      setAppPasswordError(err.message || 'Failed to connect. Please verify your App Password.');
    } finally {
      setIsConnectingAppPassword(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await api.get<{ success: boolean; url: string }>('/integrations/gmail/auth');
      if (res.success && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start Gmail auth.');
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Disconnect your Gmail account? You will not be able to send emails until reconnected.')) return;
    try {
      await api.delete('/integrations/gmail');
      refreshUser();
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/integrations/gmail/test');
      if (res.success) {
        setTestResult(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Test email failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
          Settings & Integrations
        </h1>
        <p className="text-[13px] text-[#9CA3AF]">
          Manage your email inbox connection, daily outreach limits, and security configuration
        </p>
      </div>

      {/* Gmail Inbox Connection Card */}
      <div className="p-6 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D3A4A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#111827] border border-[#2D3A4A] flex items-center justify-center text-[#00C896]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white font-sans flex items-center gap-2">
                Gmail Inbox Integration
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30">
                  100% Free
                </span>
              </h2>
              <p className="text-[12px] text-[#9CA3AF]">
                Send recruiter outreach emails directly from your personal Gmail address with zero Google Cloud fees
              </p>
            </div>
          </div>

          {gmailStatus.connected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#00C896]/15 text-[#00C896] text-[12px] font-mono font-semibold border border-[#00C896]/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gmail Connected
            </span>
          )}
        </div>

        {!gmailStatus.connected && (
          <div className="space-y-4">
            {/* Method Selector Tabs */}
            <div className="flex items-center gap-2 p-1 bg-[#111827] rounded-[6px] border border-[#2D3A4A] w-fit">
              <button
                type="button"
                onClick={() => setConnectMethod('app_password')}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
                  connectMethod === 'app_password'
                    ? 'bg-[#00C896] text-[#0D1117] font-bold shadow-xs'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Free Google App Password (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setConnectMethod('oauth')}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
                  connectMethod === 'oauth'
                    ? 'bg-[#00C896] text-[#0D1117] font-bold shadow-xs'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Google Cloud OAuth 2.0
              </button>
            </div>

            {connectMethod === 'app_password' ? (
              <form onSubmit={handleConnectAppPassword} className="space-y-4 max-w-xl animate-fadeIn">
                <div className="p-3.5 bg-[#111827] rounded-[6px] border border-[#00C896]/30 text-[12px] space-y-2 text-[#9CA3AF]">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00C896]" />
                    How to get your free 16-character Google App Password in 1 minute:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                    <li>Make sure <strong>2-Step Verification</strong> is enabled in your Google Account.</li>
                    <li>
                      Go to{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00C896] hover:underline font-semibold inline-flex items-center gap-0.5"
                      >
                        myaccount.google.com/apppasswords &rarr;
                      </a>
                    </li>
                    <li>Enter App Name as <strong>MailMint</strong> and click <strong>Create</strong>.</li>
                    <li>Copy the 16-letter code generated by Google (spaces don't matter) and paste below.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1">
                      Your Gmail Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={appPasswordEmail}
                      onChange={(e) => setAppPasswordEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white focus:outline-none focus:border-[#00C896]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1">
                      16-Letter Google App Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      placeholder="abcd efgh ijkl mnop"
                      className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white focus:outline-none focus:border-[#00C896] font-mono"
                    />
                  </div>
                </div>

                {appPasswordError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/25 rounded text-[12px] text-red-400">
                    {appPasswordError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConnectingAppPassword || !appPassword}
                  className="px-6 py-2.5 bg-[#00C896] hover:bg-[#00b084] text-[#0D1117] font-bold text-[13px] rounded-[6px] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_12px_rgba(0,200,150,0.2)]"
                >
                  {isConnectingAppPassword ? (
                    <span>Verifying with Google...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Connect Free Gmail</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3 max-w-xl animate-fadeIn">
                <p className="text-[12px] text-[#9CA3AF]">
                  Connect using Google Cloud OAuth 2.0 Client ID and Secret configured in your backend environment.
                </p>
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-bold text-[13px] rounded-[6px] hover:bg-[#00b084] transition-all shadow-[0_0_12px_rgba(0,200,150,0.2)]"
                >
                  Connect via Google OAuth
                </button>
              </div>
            )}
          </div>
        )}

        {gmailStatus.connected ? (
          <div className="space-y-4 text-[13px]">
            <div className="p-4 bg-[#111827] rounded-[6px] border border-[#2D3A4A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[#6B7280] block text-[11px] uppercase font-mono">Connected Account</span>
                <span className="text-white font-semibold">{gmailStatus.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleSendTestEmail}
                  className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#2D3A4A] text-white text-[12px] rounded border border-[#2D3A4A] transition-colors"
                >
                  {isTesting ? 'Sending...' : 'Send Test Email'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] rounded border border-red-500/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {testResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-[12px] text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{testResult}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#111827] rounded-[6px] border border-[#2D3A4A] space-y-2 text-[12px] text-[#9CA3AF]">
            <p>
              Connect your Gmail account using Google OAuth 2.0 to deliver personalized cold emails and follow-ups.
            </p>
            <p className="text-[11px] text-[#6B7280]">
              OAuth tokens are encrypted using AES-256 before storage. MailMint never asks for or stores your Google password.
            </p>
          </div>
        )}
      </div>

      {/* Outreach Quotas & Limits */}
      <div className="p-6 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
        <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00C896]" />
          <span>Outreach Quotas & Schedule Limits</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
          <div className="p-3 bg-[#111827] rounded border border-[#2D3A4A]">
            <span className="text-[#6B7280] block text-[11px]">Daily Email Quota</span>
            <span className="text-white font-mono font-bold text-[18px]">
              {settings?.outreachLimits?.maxDailyEmails || 10} emails / day
            </span>
          </div>

          <div className="p-3 bg-[#111827] rounded border border-[#2D3A4A]">
            <span className="text-[#6B7280] block text-[11px]">Contact Capacity</span>
            <span className="text-white font-mono font-bold text-[18px]">
              {settings?.outreachLimits?.maxContacts || 100} contacts
            </span>
          </div>

          <div className="p-3 bg-[#111827] rounded border border-[#2D3A4A]">
            <span className="text-[#6B7280] block text-[11px]">Active Plan</span>
            <span className="text-[#00C896] font-mono font-bold text-[18px] uppercase">
              {settings?.plan || 'Free'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Overview */}
      <div className="p-6 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-3">
        <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00C896]" />
          <span>Security Architecture & Token Protection</span>
        </h3>
        <ul className="space-y-2 text-[12px] text-[#9CA3AF]">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C896]" />
            <span>AES-256-CBC token encryption with random 16-byte initialization vectors (IV).</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C896]" />
            <span>15-minute JWT access tokens and 7-day refresh tokens securely stored in httpOnly cookies.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C896]" />
            <span>Strict user-level data isolation enforced on every PostgreSQL query.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C896]" />
            <span>No AI keys or Supabase service role keys are ever exposed to the client bundle.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
