import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, X, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allParsedRows, setAllParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
    linkedin: '',
    source: '',
  });
  const [validation, setValidation] = useState<{
    validCount: number;
    errorCount: number;
    duplicateCount: number;
    errors: { row: number; reason: string }[];
  }>({ validCount: 0, errorCount: 0, duplicateCount: 0, errors: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalImportedCount, setFinalImportedCount] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      setHeaders(rawHeaders);

      // Auto-detect mappings
      const initialMap = {
        name: rawHeaders.find((h) => /name|full_name|contact/i.test(h)) || rawHeaders[0] || '',
        company: rawHeaders.find((h) => /company|organization|org/i.test(h)) || rawHeaders[1] || '',
        role: rawHeaders.find((h) => /role|title|job/i.test(h)) || '',
        email: rawHeaders.find((h) => /email|mail/i.test(h)) || '',
        linkedin: rawHeaders.find((h) => /linkedin|profile/i.test(h)) || '',
        source: '',
      };
      setMapping(initialMap);

      // Parse first 5 preview rows
      const previews: string[][] = [];
      const all: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        if (i <= 5) previews.push(row);

        const obj: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => {
          obj[h] = row[idx] || '';
        });
        all.push(obj);
      }

      setPreviewRows(previews);
      setAllParsedRows(all);
      setStep(2);
    };
    reader.readAsText(uploadedFile);
  };

  const handleProceedToValidation = () => {
    // Validate rows
    const errors: { row: number; reason: string }[] = [];
    const seenEmails = new Set<string>();
    let duplicates = 0;
    let valid = 0;

    allParsedRows.forEach((row, idx) => {
      const name = mapping.name ? row[mapping.name] : '';
      const email = mapping.email ? row[mapping.email] : '';

      if (!name || name.trim().length === 0) {
        errors.push({ row: idx + 2, reason: 'Missing contact name' });
        return;
      }

      if (email && email.includes('@')) {
        const lower = email.toLowerCase().trim();
        if (seenEmails.has(lower)) {
          duplicates++;
          errors.push({ row: idx + 2, reason: `Duplicate email within file (${lower})` });
          return;
        }
        seenEmails.add(lower);
      }

      valid++;
    });

    setValidation({
      validCount: valid,
      errorCount: errors.length,
      duplicateCount: duplicates,
      errors,
    });
    setStep(3);
  };

  const handleExecuteImport = async () => {
    setIsSubmitting(true);
    try {
      const contactsToImport = allParsedRows
        .map((row) => ({
          name: mapping.name ? row[mapping.name] : 'Contact',
          company: mapping.company ? row[mapping.company] : '',
          job_title: mapping.role ? row[mapping.role] : '',
          email: mapping.email ? row[mapping.email] : '',
          linkedin_url: mapping.linkedin ? row[mapping.linkedin] : '',
          source: 'csv-import',
        }))
        .filter((c) => c.name && c.name.trim().length > 0);

      const res = await api.post<{ success: boolean; importedCount: number }>('/contacts/import', {
        contacts: contactsToImport,
      });

      if (res.success) {
        setFinalImportedCount(res.importedCount);
        setStep(5);
        onImportSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded-[6px] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4 text-[12px] font-mono text-[#00C896]">
          <span>Step {step} of 5</span>
          <span className="text-[#6B7280]">/</span>
          <span className="text-[#9CA3AF]">
            {step === 1 && 'Upload CSV'}
            {step === 2 && 'Column Mapping'}
            {step === 3 && 'Validation Results'}
            {step === 4 && 'Confirm Import'}
            {step === 5 && 'Import Complete'}
          </span>
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[20px] font-bold text-white font-sans">
              Import Contacts from CSV
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Upload a CSV file containing recruiter contacts, alumni, or hiring managers. You’ll be able to map columns and validate records before importing.
            </p>

            <label className="border-2 border-dashed border-[#2D3A4A] hover:border-[#00C896] bg-[#111827] rounded-[8px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <Upload className="w-8 h-8 text-[#6B7280] group-hover:text-[#00C896] mb-3 transition-colors" />
              <span className="text-[14px] font-semibold text-white mb-1">
                Choose CSV file or drag and drop
              </span>
              <span className="text-[12px] text-[#6B7280]">
                Standard comma-separated format (.csv)
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* STEP 2: Preview & Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-white font-sans">
              Map Columns & Preview Rows
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Confirm which CSV column corresponds to each contact attribute.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#111827] p-3 rounded-[6px] border border-[#2D3A4A]">
              {(['name', 'company', 'role', 'email', 'linkedin'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-[11px] uppercase font-mono text-[#9CA3AF] mb-1">
                    {field} {field === 'name' ? '*' : ''}
                  </label>
                  <select
                    value={mapping[field]}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#161B22] border border-[#2D3A4A] rounded text-[12px] text-white focus:border-[#00C896] outline-none"
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview First 5 Rows */}
            <div className="overflow-x-auto border border-[#2D3A4A] rounded-[6px]">
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#111827] text-[#9CA3AF] border-b border-[#2D3A4A]">
                  <tr>
                    {headers.slice(0, 5).map((h) => (
                      <th key={h} className="p-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3A4A]/50 text-[#F0F0F0]">
                  {previewRows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#1F2937]/50">
                      {r.slice(0, 5).map((val, c) => (
                        <td key={c} className="p-2 truncate max-w-[140px]">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white"
              >
                Back
              </button>
              <button
                disabled={!mapping.name}
                onClick={handleProceedToValidation}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084]"
              >
                <span>Validate Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: Validation & Confirmation */}
        {(step === 3 || step === 4) && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-white font-sans">
              Validation Summary
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Review verified records and invalid items before adding them to your pipeline.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px]">
                <span className="text-[11px] text-[#9CA3AF] block">Valid to Import</span>
                <span className="text-[20px] font-bold text-[#00C896]">
                  {validation.validCount}
                </span>
              </div>
              <div className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px]">
                <span className="text-[11px] text-[#9CA3AF] block">Errors / Skipped</span>
                <span className="text-[20px] font-bold text-[#EF4444]">
                  {validation.errorCount}
                </span>
              </div>
              <div className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px]">
                <span className="text-[11px] text-[#9CA3AF] block">Duplicates</span>
                <span className="text-[20px] font-bold text-[#F59E0B]">
                  {validation.duplicateCount}
                </span>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto p-3 bg-red-500/10 border border-red-500/20 rounded-[6px] space-y-1 text-[12px] text-red-300">
                <div className="font-semibold text-red-200 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Skipped Rows ({validation.errors.length}):
                </div>
                {validation.errors.slice(0, 5).map((e, idx) => (
                  <div key={idx}>
                    Row {e.row}: {e.reason}
                  </div>
                ))}
                {validation.errors.length > 5 && (
                  <div className="text-[11px] text-red-400 font-mono">
                    ...and {validation.errors.length - 5} more issues.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white"
              >
                Re-map Columns
              </button>
              <button
                disabled={validation.validCount === 0 || isSubmitting}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084] disabled:opacity-50"
              >
                {isSubmitting ? 'Importing Contacts...' : `Confirm Import (${validation.validCount})`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success Summary */}
        {step === 5 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#00C896]/20 text-[#00C896] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-[20px] font-bold text-white font-sans">
              Contacts Imported Successfully!
            </h2>
            <p className="text-[14px] text-[#9CA3AF]">
              Added <strong className="text-white">{finalImportedCount}</strong> new verified contacts to your outreach pipeline.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084]"
            >
              Done & View Contacts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
