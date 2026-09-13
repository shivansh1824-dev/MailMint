import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Send,
  MessageSquare,
  TrendingUp,
  Calendar,
  Clock,
  Moon,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { Email, Contact, Followup } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentEmails, setRecentEmails] = useState<Email[]>([]);
  const [followupsDue, setFollowupsDue] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, emailsRes, followupsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/emails'),
        api.get('/followups?status=pending-approval'),
      ]);

      if (overviewRes.success) setStats(overviewRes.stats);
      if (emailsRes.success) setRecentEmails(emailsRes.emails?.slice(0, 6) || []);
      if (followupsRes.success) setFollowupsDue(followupsRes.followups || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts?.value ?? 0, sparkline: stats?.totalContacts?.sparkline, icon: Users, to: '/contacts' },
    { label: 'Emails Drafted', value: stats?.drafted?.value ?? 0, sparkline: stats?.drafted?.sparkline, icon: FileText, to: '/email-generator' },
    { label: 'Emails Sent', value: stats?.sent?.value ?? 0, sparkline: stats?.sent?.sparkline, icon: Send, to: '/analytics' },
    { label: 'Replies Received', value: stats?.replies?.value ?? 0, sparkline: stats?.replies?.sparkline, icon: MessageSquare, to: '/analytics' },
    { label: 'Reply Rate', value: stats?.replyRate?.value ?? '0%', sparkline: stats?.replyRate?.sparkline, icon: TrendingUp, to: '/analytics' },
    { label: 'Scheduled Emails', value: stats?.scheduled?.value ?? 0, sparkline: stats?.scheduled?.sparkline, icon: Calendar, to: '/analytics' },
    { label: 'Follow-ups Due', value: stats?.followupsDue?.value ?? 0, sparkline: stats?.followupsDue?.sparkline, icon: Clock, to: '/campaigns', highlight: (stats?.followupsDue?.value || 0) > 0 },
    { label: 'Contacts Snoozed', value: stats?.snoozed?.value ?? 0, sparkline: stats?.snoozed?.sparkline, icon: Moon, to: '/contacts?status=snoozed' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight font-sans">
            Outreach Pipeline
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Overview of your active recruiter emails, responses, and pending review checkpoints
          </p>
        </div>

        <Link
          to="/email-generator"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084] transition-all shadow-[0_0_12px_rgba(0,200,150,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Outreach</span>
        </Link>
      </div>

      {/* Follow-ups Due Action Banner */}
      {followupsDue.length > 0 && (
        <div className="p-4 rounded-[8px] bg-[#161B22] border-l-4 border-amber-500 border-t border-r border-b border-[#2D3A4A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-[14px] font-semibold text-white">
                {followupsDue.length} follow-up email{followupsDue.length > 1 ? 's' : ''} awaiting approval
              </h4>
              <p className="text-[12px] text-[#9CA3AF]">
                Review and approve outreach cadences before delivery. MailMint never auto-sends without confirmation.
              </p>
            </div>
          </div>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[12px] font-medium transition-colors whitespace-nowrap"
          >
            <span>Review Follow-ups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4-Column Desktop Grid for Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.to}
              className={`p-5 rounded-[8px] bg-[#161B22] border border-[#2D3A4A] hover:bg-[#1F2937] transition-all flex flex-col justify-between group ${
                card.highlight ? 'ring-1 ring-amber-500/40' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#9CA3AF] font-medium tracking-wide">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-[#6B7280] group-hover:text-[#00C896] transition-colors" />
              </div>

              <div className="flex items-end justify-between mt-1">
                <span className="text-[26px] font-bold text-white tracking-tight">
                  {card.value}
                </span>

                {/* 7-day sparkline */}
                {card.sparkline && card.sparkline.length > 0 && (
                  <div className="w-20 h-9">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={card.sparkline}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={card.highlight ? '#F59E0B' : '#00C896'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Outreach Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-white font-sans">
              Recent Outreach
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              Latest personalized emails drafted and dispatched from your inbox
            </p>
          </div>

          <Link
            to="/email-generator"
            className="text-[12px] text-[#00C896] hover:underline font-medium flex items-center gap-1"
          >
            <span>View all in generator</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentEmails.length === 0 ? (
          <div className="p-12 text-center bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1F2937] text-[#00C896] flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-semibold text-white">No outreach drafted yet</h3>
            <p className="text-[13px] text-[#9CA3AF] max-w-sm mx-auto">
              Create your first AI-personalized recruiter email based on your confirmed skills and target company.
            </p>
            <Link
              to="/email-generator"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00C896] text-[#0D1117] text-[13px] font-bold rounded-[6px] hover:bg-[#00b084]"
            >
              <Plus className="w-4 h-4" /> Draft First Outreach
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#2D3A4A] rounded-[8px] bg-[#161B22]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#111827] text-[#9CA3AF] border-b border-[#2D3A4A] font-medium">
                <tr>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Subject & Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3A4A]/60">
                {recentEmails.map((email) => {
                  const companyName = email.contact?.company || email.job?.company?.name || 'Target Team';
                  const contactName = email.contact?.name || 'Hiring Lead';
                  return (
                    <tr
                      key={email.id}
                      onClick={() => navigate('/email-generator', { state: { emailId: email.id } })}
                      className="hover:bg-[#1F2937] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-white">
                        {companyName}
                      </td>
                      <td className="py-3.5 px-4 text-[#F0F0F0]">
                        {contactName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-white truncate max-w-xs">{email.subject}</span>
                          <span className="text-[11px] text-[#6B7280] font-mono">{email.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={email.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#9CA3AF] text-[12px] font-mono">
                        {new Date(email.updated_at || email.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
