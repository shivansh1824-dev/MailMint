import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Split,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';

export const AnalyticsPage: React.FC = () => {
  const [emailsOverTime, setEmailsOverTime] = useState<any[]>([]);
  const [replyRateTrend, setReplyRateTrend] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [companyHeatmap, setCompanyHeatmap] = useState<any[]>([]);
  const [skillsGap, setSkillsGap] = useState<any[]>([]);
  const [industryData, setIndustryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [timeRes, rateRes, campRes, compRes, gapRes, indRes] = await Promise.all([
          api.get('/analytics/emails-over-time'),
          api.get('/analytics/reply-rate'),
          api.get('/analytics/campaigns'),
          api.get('/analytics/companies'),
          api.get('/analytics/skills-gap'),
          api.get('/analytics/response-by-industry'),
        ]);

        if (timeRes.success) setEmailsOverTime(timeRes.data || []);
        if (rateRes.success) setReplyRateTrend(rateRes.data || []);
        if (campRes.success) setCampaignData(campRes.data || []);
        if (compRes.success) setCompanyHeatmap(compRes.data || []);
        if (gapRes.success) setSkillsGap(gapRes.skills || []);
        if (indRes.success) setIndustryData(indRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Custom dark tooltip matching spec (dark card, mint left border)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-[#111827] border-l-2 border-l-[#00C896] border-t border-r border-b border-[#2D3A4A] rounded-[6px] shadow-2xl text-[12px] space-y-1">
          <div className="font-semibold text-white mb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-[#9CA3AF]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#00C896' }}></span>
              <span>{entry.name}:</span>
              <strong className="text-white font-mono">{entry.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
          Outreach Analytics & Intelligence
        </h1>
        <p className="text-[13px] text-[#9CA3AF]">
          Deliverability metrics, response benchmarks, and job market skills gap analysis
        </p>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Outreach Over Time (Area Chart) */}
        <div className="p-5 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-white">Outreach Volume Over Time (Last 30 Days)</h3>
            <p className="text-[12px] text-[#9CA3AF]">Daily email volume sent directly through verified Gmail inbox</p>
          </div>
          <div className="h-64 bg-[#111827] p-3 rounded-[6px] border border-[#2D3A4A]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emailsOverTime}>
                <defs>
                  <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C896" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2D3A4A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sent" name="Emails Sent" stroke="#00C896" strokeWidth={2} fillOpacity={1} fill="url(#mintGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Reply Rate Trend (Line Chart - 8 Weeks) */}
        <div className="p-5 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-white">Reply Rate Trend (8 Weeks)</h3>
            <p className="text-[12px] text-[#9CA3AF]">Weekly percentage of personalized recruiter conversations started</p>
          </div>
          <div className="h-64 bg-[#111827] p-3 rounded-[6px] border border-[#2D3A4A]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={replyRateTrend}>
                <CartesianGrid stroke="#2D3A4A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis unit="%" stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" name="Reply Rate" stroke="#00C896" strokeWidth={2.5} dot={{ fill: '#00C896', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Campaign Comparison (Horizontal Bar Chart) */}
        <div className="p-5 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-white">Campaign Comparison</h3>
            <p className="text-[12px] text-[#9CA3AF]">Contacts outreach volume vs replies generated across cohorts</p>
          </div>
          <div className="h-64 bg-[#111827] p-3 rounded-[6px] border border-[#2D3A4A]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} layout="vertical">
                <CartesianGrid stroke="#2D3A4A" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={11} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" name="Sent" fill="#1F2937" radius={[0, 4, 4, 0]} />
                <Bar dataKey="replied" name="Replies" fill="#00C896" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Response Rate by Industry */}
        <div className="p-5 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-white">Response Rate by Industry</h3>
            <p className="text-[12px] text-[#9CA3AF]">Reply frequency across different technology verticals</p>
          </div>
          <div className="h-64 bg-[#111827] p-3 rounded-[6px] border border-[#2D3A4A]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid stroke="#2D3A4A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="industry" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis unit="%" stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="Response %" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Skills Gap Heatmap Analysis */}
      <div className="p-6 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-4">
        <div>
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            <span>Marketplace Skills Gap Analysis</span>
          </h3>
          <p className="text-[13px] text-[#9CA3AF]">
            Compares required keywords across your saved job descriptions with your verified profile skills. Missing market requirements are highlighted in amber.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {skillsGap.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-[6px] border flex flex-col justify-between transition-colors ${
                item.isGap
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[#111827] border-[#2D3A4A]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white text-[13px]">{item.skill}</span>
                {item.isGap ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C896]" />
                )}
              </div>

              <div className="text-[11px] text-[#6B7280] flex items-center justify-between">
                <span>In {item.marketDemand} saved jobs</span>
                <span className={`font-mono ${item.isGap ? 'text-amber-400' : 'text-[#00C896]'}`}>
                  {item.isGap ? 'Missing' : 'In Profile'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
