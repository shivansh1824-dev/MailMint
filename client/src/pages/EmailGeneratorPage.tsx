import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  Copy,
  Check,
  Send,
  Calendar,
  Save,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Briefcase,
  FileText,
  Clock,
  Globe,
} from 'lucide-react';
import { api } from '../lib/api';
import { Profile, ResumeVersion, Company, Contact, Job, Email } from '../types';
import { OutreachChecklistModal } from '../components/common/OutreachChecklistModal';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { Avatar } from '../components/common/Avatar';

export const EmailGeneratorPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navState = location.state as any;

  // Context datasets
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Generator form controls
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [targetCompanyInput, setTargetCompanyInput] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [personalNote, setPersonalNote] = useState<string>('');
  const [tone, setTone] = useState<'Casual' | 'Warm' | 'Balanced' | 'Professional' | 'Formal'>('Balanced');
  const [length, setLength] = useState<'Ultra-Short' | 'Short' | 'Standard' | 'Detailed'>('Standard');
  const [language, setLanguage] = useState<string>('English');
  const [emailType, setEmailType] = useState<'cold-email' | 'referral' | 'thank-you' | 'alumni' | 'networking'>('cold-email');

  // Specialized fields
  const [referralRelation, setReferralRelation] = useState<string>('');
  const [interviewerName, setInterviewerName] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [interviewNotes, setInterviewNotes] = useState<string>('');
  const [confirmedCollege, setConfirmedCollege] = useState<string>('');

  // Generated email state
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [signals, setSignals] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);

  // Score & Benchmarks
  const [scoreData, setScoreData] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  // Modals
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Load prerequisites
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [profRes, resRes, compRes, contRes, jobsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/profile/resume/versions'),
          api.get('/companies'),
          api.get('/contacts'),
          api.get('/jobs'),
        ]);

        if (profRes.success) {
          setProfile(profRes.profile);
          if (profRes.profile?.university) setConfirmedCollege(profRes.profile.university);
        }
        if (resRes.success) {
          setResumeVersions(resRes.versions || []);
          const def = resRes.versions?.find((v: any) => v.is_default);
          if (def) setSelectedResumeId(def.id);
        }
        if (compRes.success) setCompanies(compRes.companies || []);
        if (contRes.success) setContacts(contRes.contacts || []);
        if (jobsRes.success) setJobs(jobsRes.jobs || []);

        // Pre-fill from navigation state or URL search parameters (e.g. Chrome Extension deep-link)
        const qCompany = searchParams.get('company') || navState?.companyName;
        const qCompanyId = navState?.companyId;
        const qName = searchParams.get('name');

        if (qCompanyId) {
          setSelectedCompanyId(qCompanyId);
          const found = compRes.companies?.find((c: any) => c.id === qCompanyId);
          if (found) setTargetCompanyInput(found.name);
        } else if (qCompany) {
          setTargetCompanyInput(qCompany);
          const found = compRes.companies?.find((c: any) => c.name.toLowerCase() === qCompany.toLowerCase());
          if (found) setSelectedCompanyId(found.id);
        }

        if (qName && contRes.contacts) {
          const matchedContact = contRes.contacts.find(
            (c: any) => c.name.toLowerCase().includes(qName.toLowerCase()) || qName.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchedContact) setSelectedContactId(matchedContact.id);
        }

        if (navState?.jobId) setSelectedJobId(navState.jobId);
        if (navState?.contactId) {
          setSelectedContactId(navState.contactId);
          const matchedContact = contRes.contacts?.find((c: any) => c.id === navState.contactId);
          if (matchedContact && matchedContact.company) {
            setTargetCompanyInput(matchedContact.company);
            const foundComp = compRes.companies?.find((c: any) => c.name.toLowerCase() === matchedContact.company.toLowerCase());
            if (foundComp) setSelectedCompanyId(foundComp.id);
          }
        }
        if (navState?.emailId) {
          setCurrentEmailId(navState.emailId);
          api.get(`/emails/${navState.emailId}`).then((eRes) => {
            if (eRes.success && eRes.email) {
              setSubject(eRes.email.subject || '');
              setBody(eRes.email.body || '');
              if (eRes.email.contact_id) setSelectedContactId(eRes.email.contact_id);
              if (eRes.email.job_id) setSelectedJobId(eRes.email.job_id);
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadContext();
  }, [navState, searchParams]);

  // Trigger score update when body or subject changes (debounced by 600ms)
  useEffect(() => {
    if (!body || body.trim().length <= 20) {
      setScoreData(null);
      return;
    }

    const timer = setTimeout(() => {
      const selectedComp = targetCompanyInput || companies.find((c) => c.id === selectedCompanyId)?.name;
      api.post('/ai/score-email', { subject, body, company: selectedComp }).then((res) => {
        if (res.success) setScoreData(res.score);
      }).catch((err) => {
        console.error('Scoring error:', err);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [body, subject, selectedCompanyId, targetCompanyInput, companies]);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const targetWords =
    length === 'Ultra-Short' ? 50 : length === 'Short' ? 100 : length === 'Standard' ? 150 : 200;
  const isOverLength = wordCount > targetWords + 20;

  const handleGenerate = async (overrides?: {
    tone?: 'Casual' | 'Warm' | 'Balanced' | 'Professional' | 'Formal';
    length?: 'Ultra-Short' | 'Short' | 'Standard' | 'Detailed';
  }) => {
    setIsGenerating(true);
    const activeTone = overrides?.tone ?? tone;
    const activeLength = overrides?.length ?? length;

    try {
      const res = await api.post('/ai/generate-email', {
        resumeVersionId: selectedResumeId || undefined,
        companyId: selectedCompanyId || undefined,
        companyName: targetCompanyInput || undefined,
        contactId: selectedContactId || undefined,
        jobId: selectedJobId || undefined,
        personalNote: personalNote || undefined,
        tone: activeTone,
        length: activeLength,
        language,
        type: emailType,
        referralRelation: emailType === 'referral' ? referralRelation : undefined,
        interviewerName: emailType === 'thank-you' ? interviewerName : undefined,
        interviewDate: emailType === 'thank-you' ? interviewDate : undefined,
        interviewNotes: emailType === 'thank-you' ? interviewNotes : undefined,
        confirmedCollege: emailType === 'alumni' ? confirmedCollege : undefined,
      });

      if (res.success) {
        setSubject(res.subject || '');
        setBody(res.body || '');
        setSignals(res.signals || []);
      }
    } catch (err: any) {
      alert(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickTweak = (tweak: 'shorter' | 'professional' | 'warmer' | 'direct') => {
    if (!body) return;
    if (tweak === 'shorter') {
      const sentences = body.split('. ');
      if (sentences.length > 2) {
        setBody(sentences.slice(0, Math.ceil(sentences.length * 0.7)).join('. ') + '.');
      }
    } else if (tweak === 'professional') {
      setTone('Professional');
      handleGenerate({ tone: 'Professional' });
    } else if (tweak === 'warmer') {
      setTone('Warm');
      handleGenerate({ tone: 'Warm' });
    } else if (tweak === 'direct') {
      setTone('Casual');
      setLength('Short');
      handleGenerate({ tone: 'Casual', length: 'Short' });
    }
  };

  const handleSaveDraft = async () => {
    if (!subject && !body) return;
    setIsSaving(true);
    try {
      if (currentEmailId) {
        await api.put(`/emails/${currentEmailId}`, {
          subject,
          body,
          contact_id: selectedContactId || null,
          job_id: selectedJobId || null,
          type: emailType,
        });
      } else {
        const res = await api.post('/emails', {
          subject,
          body,
          contact_id: selectedContactId || null,
          job_id: selectedJobId || null,
          type: emailType,
        });
        if (res.success) setCurrentEmailId(res.email.id);
      }
      alert('Draft saved to pipeline!');
    } catch (err: any) {
      alert(err.message || 'Failed to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmSend = async (includeSignature: boolean, manualRecipient?: string) => {
    setIsSending(true);
    try {
      const selectedContact = contacts.find((c) => c.id === selectedContactId);
      const activeRecipient = manualRecipient || selectedContact?.email || '';

      let emailIdToSend = currentEmailId;
      if (!emailIdToSend) {
        const createRes = await api.post('/emails', {
          subject,
          body,
          contact_id: selectedContactId || null,
          job_id: selectedJobId || null,
          type: emailType,
        });
        if (createRes.success) {
          emailIdToSend = createRes.email.id;
          setCurrentEmailId(createRes.email.id);
        }
      } else {
        // Sync draft content with backend
        await api.put(`/emails/${emailIdToSend}`, {
          subject,
          body,
          contact_id: selectedContactId || null,
          job_id: selectedJobId || null,
          type: emailType,
        });
      }

      const sendRes = await api.post(`/emails/${emailIdToSend}/send`, {
        manualConfirmation: true,
        includeSignature,
        recipientEmail: activeRecipient,
        subject,
        body,
      });

      if (sendRes.success) {
        setChecklistOpen(false);
        alert('✓ Email sent successfully from your Gmail inbox!');
      }
    } catch (err: any) {
      alert(err.message || 'Send failed. Please check inbox connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleSend = async () => {
    if (!scheduledDateTime) return;
    try {
      let emailId = currentEmailId;
      if (!emailId) {
        const createRes = await api.post('/emails', {
          subject,
          body,
          contact_id: selectedContactId || null,
          job_id: selectedJobId || null,
          type: emailType,
        });
        if (createRes.success) emailId = createRes.email.id;
      }

      await api.post(`/emails/${emailId}/schedule`, {
        scheduledAt: scheduledDateTime,
      });

      setScheduleOpen(false);
      alert('✓ Outreach scheduled! It will be sent automatically at the scheduled time.');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule email.');
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#17201C] dark:text-white tracking-tight font-sans">
          AI Email Generator
        </h1>
        <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]">
          Craft high-conviction, personalized recruiter emails with human-in-the-loop review
        </p>
      </div>

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: 40% (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161B22] border-l-4 border-l-[#00A878] dark:border-l-[#00C896] border-t border-r border-b border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] p-5 space-y-4 shadow-sm">
          
          {/* Visual Context Strip: Candidate & Target Company */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F7F8F6] dark:bg-[#111827] rounded-[6px] border border-[#DDE3DF] dark:border-[#2D3A4A] text-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={profile?.full_name || 'Shivansh Rai'} size="xs" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#87918C] dark:text-[#6B7280] block font-mono">CANDIDATE</span>
                <span className="font-semibold text-[#17201C] dark:text-white truncate block">{profile?.full_name || 'Shivansh Rai'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {targetCompanyInput ? (
                <CompanyLogo name={targetCompanyInput} size="xs" />
              ) : (
                <Building2 className="w-4 h-4 text-[#87918C] dark:text-[#6B7280] flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-[10px] text-[#87918C] dark:text-[#6B7280] block font-mono">TARGET</span>
                <span className="font-semibold text-[#17201C] dark:text-white truncate block">{targetCompanyInput || 'Target Company'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2 border-b border-[#DDE3DF] dark:border-[#2D3A4A] text-[13px] font-semibold text-[#17201C] dark:text-white">
            <Sliders className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
            <span>Generation Parameters</span>
          </div>

          {/* Email Type */}
          <div>
            <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
              Email Type
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
            >
              <option value="cold-email">Cold Outreach</option>
              <option value="referral">Referral Request</option>
              <option value="thank-you">Thank You (Post-Interview)</option>
              <option value="alumni">Alumni Connection</option>
              <option value="networking">General Networking</option>
            </select>
          </div>

          {/* Specialized Type Requirements */}
          {emailType === 'referral' && (
            <div className="p-3 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] space-y-1.5 animate-fadeIn">
              <label className="block text-[11px] font-semibold text-[#00A878] dark:text-[#00C896] uppercase font-mono">
                Relationship Context *
              </label>
              <input
                type="text"
                required
                value={referralRelation}
                onChange={(e) => setReferralRelation(e.target.value)}
                placeholder="How do you know them? (e.g. met at HackMIT, former teammate)"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[12px] text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
              />
            </div>
          )}

          {emailType === 'thank-you' && (
            <div className="p-3 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] space-y-2 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">Interviewer Name</label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="w-full px-2 py-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[12px] text-[#17201C] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[12px] text-[#17201C] dark:text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">Specific Topics Discussed</label>
                <input
                  type="text"
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Go microservices, database sharding"
                  className="w-full px-2 py-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[12px] text-[#17201C] dark:text-white outline-none"
                />
              </div>
            </div>
          )}

          {emailType === 'alumni' && (
            <div className="p-3 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] space-y-1.5 animate-fadeIn">
              <label className="block text-[11px] font-semibold text-[#00A878] dark:text-[#00C896] uppercase font-mono">
                Confirm Shared University / Alma Mater *
              </label>
              <input
                type="text"
                required
                value={confirmedCollege}
                onChange={(e) => setConfirmedCollege(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[12px] text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
              />
            </div>
          )}

          {/* Target Company & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                Target Company
              </label>
              <input
                type="text"
                value={targetCompanyInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetCompanyInput(val);
                  const matched = companies.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                  setSelectedCompanyId(matched ? matched.id : '');
                }}
                placeholder="Enter company name (e.g. Stripe, Google)"
                list="generator-company-options"
                className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white placeholder-[#87918C] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
              />
              <datalist id="generator-company-options">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                Target Contact
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setSelectedContactId(cid);
                  const matched = contacts.find((c) => c.id === cid);
                  if (matched && matched.company) {
                    setTargetCompanyInput(matched.company);
                    const compName = matched.company.toLowerCase();
                    const foundComp = companies.find((c) => c.name.toLowerCase() === compName);
                    if (foundComp) setSelectedCompanyId(foundComp.id);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
              >
                <option value="">-- Select Contact --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.job_title ? `(${c.job_title})` : ''} {c.company ? `@ ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Selection */}
          <div>
            <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
              Target Job / Role Context
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
            >
              <option value="">-- General Outreach / No Specific Job --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.company?.name ? `@ ${j.company.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Resume Version Override */}
          <div>
            <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
              Resume Profile Source
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
            >
              <option value="">Default Profile Data</option>
              {resumeVersions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Spectrum Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF]">
                Tone Spectrum
              </label>
              <span className="text-[11px] font-mono text-[#00A878] dark:text-[#00C896] font-semibold">
                {tone === 'Casual' && 'Like a message from a friend'}
                {tone === 'Warm' && 'Friendly but professional'}
                {tone === 'Balanced' && 'Confident & approachable'}
                {tone === 'Professional' && 'Polished & business-ready'}
                {tone === 'Formal' && 'Formal business letter'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 bg-[#F0F4F1] dark:bg-[#111827] p-1 rounded-[6px] border border-[#DDE3DF] dark:border-[#2D3A4A]">
              {(['Casual', 'Warm', 'Balanced', 'Professional', 'Formal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-1.5 text-[11px] font-medium rounded-[4px] transition-colors ${
                    tone === t
                      ? 'bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] font-bold shadow-sm'
                      : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Length & Language Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                Length Preset
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[12px] text-[#17201C] dark:text-white outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
              >
                <option value="Ultra-Short">Ultra-Short (~50w)</option>
                <option value="Short">Short (~100w)</option>
                <option value="Standard">Standard (~150w)</option>
                <option value="Detailed">Detailed (~200w)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[12px] text-[#17201C] dark:text-white outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Mandarin Chinese">Mandarin Chinese</option>
              </select>
            </div>
          </div>

          {/* Personal Note */}
          <div>
            <label className="block text-[12px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-1">
              Personal Note / Angle (optional)
            </label>
            <textarea
              rows={2}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="e.g. mention my open-source CLI project or distributed cache experiment"
              className="w-full px-3 py-1.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[12px] text-[#17201C] dark:text-white placeholder-[#87918C] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896] resize-none"
            />
          </div>

          {/* Ghostwriter Status */}
          {profile?.voice_profile && (
            <div className="p-2.5 rounded-[6px] bg-[#F0FDF8] dark:bg-[#111827] border border-[#00A878]/30 dark:border-[#00C896]/30 flex items-center justify-between text-[11px]">
              <span className="text-[#00A878] dark:text-[#00C896] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Voice Profile Active
              </span>
              <span className="text-[#6B7280]">Trained on your emails</span>
            </div>
          )}

          {/* Full-width Mint Green Generate Button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleGenerate()}
            className="w-full py-3 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-bold text-[14px] font-sans rounded-[6px] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,168,120,0.25)] dark:shadow-[0_0_16px_rgba(0,200,150,0.25)]"
          >
            {isGenerating ? (
              <span>Crafting Personalized Email...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Email</span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel: 60% (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="email-paper-surface rounded-[8px] p-6 shadow-xl flex flex-col min-h-[460px] border border-[#E5E9E6] dark:border-[#2D3A4A]">
            
            {/* Envelope Recipient / Sender Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E5E9E6] dark:border-[#2D3A4A]/60 text-[12px]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#87918C] dark:text-[#6B7280] font-mono uppercase text-[10px] tracking-wider">To:</span>
                <span className="font-semibold text-[#17201C] dark:text-white flex items-center gap-1.5 truncate">
                  {selectedContact ? `${selectedContact.name} <${selectedContact.email || 'no email'}>` : 'Recruiter / Hiring Lead'}
                  {targetCompanyInput && (
                    <span className="text-[#00A878] dark:text-[#00C896] font-normal">@{targetCompanyInput}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[#87918C] dark:text-[#6B7280] font-mono uppercase text-[10px] tracking-wider">From:</span>
                <span className="font-semibold text-[#17201C] dark:text-white">
                  {profile?.full_name || 'Candidate'}
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E9E6] dark:border-[#2D3A4A] mb-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickTweak('shorter')}
                  className="px-2 py-1 text-[11px] bg-[#F0F4F1] hover:bg-[#E5EBE7] dark:bg-[#111827] dark:hover:bg-[#1F2937] text-[#3D4C44] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded border border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors"
                >
                  Make Shorter
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTweak('professional')}
                  className="px-2 py-1 text-[11px] bg-[#F0F4F1] hover:bg-[#E5EBE7] dark:bg-[#111827] dark:hover:bg-[#1F2937] text-[#3D4C44] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded border border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors"
                >
                  More Professional
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTweak('warmer')}
                  className="px-2 py-1 text-[11px] bg-[#F0F4F1] hover:bg-[#E5EBE7] dark:bg-[#111827] dark:hover:bg-[#1F2937] text-[#3D4C44] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded border border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors"
                >
                  Make Warmer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTweak('direct')}
                  className="px-2 py-1 text-[11px] bg-[#F0F4F1] hover:bg-[#E5EBE7] dark:bg-[#111827] dark:hover:bg-[#1F2937] text-[#3D4C44] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded border border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors"
                >
                  More Direct
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F0F4F1] dark:hover:bg-[#1F2937] rounded transition-colors"
                  title="Copy email"
                >
                  {isCopied ? <Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || !body}
                  className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F0F4F1] dark:hover:bg-[#1F2937] rounded transition-colors disabled:opacity-40"
                  title="Save draft"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F0F4F1] dark:hover:bg-[#1F2937] rounded transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Email Subject */}
            <div className="mb-4">
              <label className="block text-[11px] font-mono uppercase text-[#87918C] dark:text-[#6B7280] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line appears here..."
                className="w-full px-3 py-2 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[15px] font-bold text-[#17201C] dark:text-white font-sans focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
              />
            </div>

            {/* Email Body in Lora Serif */}
            <div className="flex-1 flex flex-col mb-4">
              <label className="block text-[11px] font-mono uppercase text-[#87918C] dark:text-[#6B7280] mb-1">
                Body (Editable)
              </label>
              <textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Click 'Generate Email' on the left to craft a customized outreach draft..."
                className="flex-1 w-full p-4 bg-transparent border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[15px] text-[#17201C] dark:text-[#F0F0F0] font-serif leading-relaxed focus:border-[#00A878] dark:focus:border-[#00C896] outline-none resize-none"
              />
            </div>

            {/* Personalization Signal Chips */}
            {signals.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pt-2 border-t border-[#E5E9E6] dark:border-[#2D3A4A]/60">
                {signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#00A878]/10 dark:bg-[#00C896]/10 text-[#00A878] dark:text-[#00C896] border border-[#00A878]/20 dark:border-[#00C896]/20 font-semibold"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            )}

            {/* Live Word Count & Warning */}
            <div className="flex items-center justify-between text-[12px] pt-3 border-t border-[#E5E9E6] dark:border-[#2D3A4A] text-[#5E6863] dark:text-[#9CA3AF]">
              <div className="flex items-center gap-2">
                <span>
                  Words: <strong className="text-[#17201C] dark:text-white font-mono">{wordCount}</strong> / target ~{targetWords}
                </span>
                {isOverLength && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Longer than selected preset.
                  </span>
                )}
              </div>

              {/* Send & Schedule Triggers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!body}
                  onClick={() => setScheduleOpen(true)}
                  className="px-3 py-1.5 bg-[#E5EBE7] hover:bg-[#DDE3DF] dark:bg-[#1F2937] dark:hover:bg-[#2D3A4A] text-[#17201C] dark:text-white text-[12px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>

                <button
                  type="button"
                  disabled={!body}
                  onClick={() => setChecklistOpen(true)}
                  className="px-4 py-1.5 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[13px] font-semibold rounded-[6px] transition-colors flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,168,120,0.2)] dark:shadow-[0_0_12px_rgba(0,200,150,0.2)] disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cold Email Score Benchmark (Collapsible) */}
          {scoreData && (
            <div className="bg-white dark:bg-[#161B22] border border-[#E5E9E6] dark:border-[#2D3A4A] rounded-[8px] p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-bold text-[#17201C] dark:text-white">Email Analysis Benchmark</span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-[#00A878]/10 dark:bg-[#00C896]/15 text-[#00A878] dark:text-[#00C896] font-semibold">
                    Overall Score: {scoreData.overall}/100
                  </span>
                </div>
                {showAnalysis ? <ChevronUp className="w-4 h-4 text-[#5E6863] dark:text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#5E6863] dark:text-[#9CA3AF]" />}
              </button>

              {showAnalysis && (
                <div className="mt-5 space-y-4 animate-fadeIn">
                  {/* 5 Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(scoreData.scores).map(([metric, val]: [string, any]) => (
                      <div key={metric}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#5E6863] dark:text-[#9CA3AF] capitalize">
                            {metric.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-[#17201C] dark:text-white font-mono font-medium">{val}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E5EBE7] dark:bg-[#111827] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A878] dark:bg-[#00C896] rounded-full transition-all duration-500"
                            style={{ width: `${val}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning Cards */}
                  {scoreData.warnings && scoreData.warnings.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {scoreData.warnings.map((warn: string, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-700 dark:text-amber-300 flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-[#87918C] dark:text-[#6B7280] italic">
                    {scoreData.disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pre-Flight Checklist Modal */}
      <OutreachChecklistModal
        isOpen={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        onConfirmSend={handleConfirmSend}
        recipientEmail={selectedContact?.email}
        subject={subject}
        body={body}
        hasJobLinked={Boolean(selectedJobId)}
        isSending={isSending}
      />

      {/* Timezone-Aware Schedule Modal */}
      {scheduleOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6">
            <h3 className="text-[18px] font-bold text-white mb-2">Schedule Outreach Delivery</h3>
            <p className="text-[12px] text-[#9CA3AF] mb-4">
              Recommended: Tue–Thu, 9–11 AM in recipient timezone for optimal reply rates.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-[11px] font-mono text-[#9CA3AF] uppercase mb-1">
                  Delivery Time (Local & Recipient Timezone Aware)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-[13px] text-white focus:border-[#00C896] outline-none"
                />
              </div>

              {scheduledDateTime && (
                <div className="p-3 bg-[#111827] rounded text-[12px] text-[#00C896] font-mono">
                  Sends at: {new Date(scheduledDateTime).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!scheduledDateTime}
                onClick={handleScheduleSend}
                className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084] disabled:opacity-50"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
