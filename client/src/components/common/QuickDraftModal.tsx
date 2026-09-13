import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, Building2, Briefcase } from 'lucide-react';
import { api } from '../../lib/api';
import { Company } from '../../types';

interface QuickDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickDraftModal: React.FC<QuickDraftModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [roleUrl, setRoleUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get<{ success: boolean; companies: Company[] }>('/companies').then((res) => {
        if (res.success) setCompanies(res.companies || []);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jobTitle) return;

    setIsGenerating(true);
    try {
      // Find or create company
      let targetCompany = companies.find(
        (c) => c.name.toLowerCase() === companyName.toLowerCase()
      );
      if (!targetCompany) {
        const compRes = await api.post<{ success: boolean; company: Company }>('/companies', {
          name: companyName,
        });
        if (compRes.success) targetCompany = compRes.company;
      }

      // Create quick job
      const jobRes = await api.post<{ success: boolean; job: any }>('/jobs', {
        company_id: targetCompany?.id,
        title: jobTitle,
        url: roleUrl,
      });

      // Navigate to generator with state
      onClose();
      navigate('/email-generator', {
        state: {
          companyId: targetCompany?.id,
          jobId: jobRes.success ? jobRes.job.id : undefined,
          autoGenerate: true,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded-[6px] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#00C896] mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-[12px] font-semibold tracking-wider uppercase font-mono">
            Quick Outreach Drafter
          </span>
        </div>
        <h2 className="text-[20px] font-bold text-white mb-2 font-sans">
          Draft a Recruiter Email in Seconds
        </h2>
        <p className="text-[13px] text-[#9CA3AF] mb-5">
          Uses your default profile and resume to craft a tailored outreach draft instantly.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Target Company *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Linear, Datadog"
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
                list="saved-companies"
              />
              <datalist id="saved-companies">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Role Title *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer Intern, Backend Developer"
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Role / Careers URL (optional)
            </label>
            <input
              type="url"
              value={roleUrl}
              onChange={(e) => setRoleUrl(e.target.value)}
              placeholder="https://company.com/careers/role"
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !companyName || !jobTitle}
              className="flex items-center gap-2 px-4 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084] disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(0,200,150,0.2)]"
            >
              {isGenerating ? (
                <span>Generating Draft...</span>
              ) : (
                <>
                  <span>Create Draft</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
