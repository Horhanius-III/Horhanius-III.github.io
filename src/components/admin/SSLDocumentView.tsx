import { useState } from 'react';
import { CheckCircle2, Download, FileText, Printer, Share2, ShieldCheck, X } from 'lucide-react';
import { storageService } from '../../services/storage';
import { SSLForm } from '../../types';
import { populateOriginalMcpsFormPdf } from '../../utils/pdfGenerator';

interface SSLDocumentViewProps {
  form: SSLForm;
  onClose?: () => void;
  onCopyLink?: (token: string) => void;
}

export function SSLDocumentView({ form, onClose, onCopyLink }: SSLDocumentViewProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadOriginalMcps = async () => {
    setIsGeneratingPdf(true);
    try {
      const template = storageService.getSection2Template();
      await populateOriginalMcpsFormPdf(form, template, true);
    } catch (err) {
      console.error('Failed to download MCPS PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareUrl = `${window.location.origin}?ssl=${form.shareToken}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Bar (hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              Official MCPS Form 560-51 SSL Verification
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadOriginalMcps}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download MCPS Form (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Page</span>
            </button>

            {onCopyLink && (
              <button
                type="button"
                onClick={() => onCopyLink(form.shareToken)}
                className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close SSL Modal"
                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Official SSL Document Content */}
        <div className="p-6 sm:p-12 space-y-6 text-stone-900 font-sans print:p-8">
          {/* Header with Official Nonprofit Details & Brand Logo */}
          <div className="border-b-2 border-stone-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <img
                src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
                alt="So What Else"
                className="w-14 h-14 rounded-2xl object-contain bg-[#1c1c1c] border border-stone-800 shrink-0 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-neutral-900 font-sans">
                    SO WHAT ELSE, INC.
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800">
                    501(c)(3) Non-Profit
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium mt-1">
                  Local Food Bank, Hunger Relief & Youth Development Programs
                </p>
                <p className="text-xs text-stone-500">
                  4924 Wyaconda Rd, Rockville, MD 20852 • (240) 668-4500 • info@sowhatelse.org
                </p>
                <p className="text-xs text-stone-500">
                  Federal Tax ID / EIN: <span className="font-mono font-bold text-stone-800">{form.ein}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <span className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-[#1c1c1c] text-white">
                SSL VERIFICATION FORM
              </span>
              <p className="text-xs font-mono text-stone-500 mt-1">
                Ref ID: {form.id}
              </p>
              <p className="text-xs text-stone-500">
                Issued: {form.createdAt.split('T')[0]}
              </p>
            </div>
          </div>

          {/* Student Profile Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1">
              Part I: Student Volunteer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Student Full Name:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {form.studentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Unique SWE ID:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {form.sweId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">School District / School:</span>
                <span className="font-medium text-slate-800">
                  {form.school || 'Montgomery County Public Schools (MCPS)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Grade / Student ID:</span>
                <span className="font-medium text-slate-800">
                  {form.grade || 'High School'} • {form.studentId || 'N/A'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Student Registered Email:</span>
                <span className="font-medium text-slate-800">
                  {form.studentEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Service Hours & Description Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1">
              Part II: Community Service & Verified Hours
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Service Date Range
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {form.dateRange.start} — {form.dateRange.end}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Facility Location
                </span>
                <span className="font-bold text-slate-900 text-xs truncate block">
                  {form.facilityName}
                </span>
              </div>

              <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-300 text-center">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase block">
                  Total Verified SSL Hours
                </span>
                <span className="font-black text-emerald-950 text-2xl">
                  {form.totalVerifiedHours}{' '}
                  <span className="text-xs font-normal">hours</span>
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 block">
                Description of Community Service Completed:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {form.activityDescription}
              </p>
            </div>
          </div>

          {/* Supervisor Verification & Signature Section */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-1">
              Part III: Supervisor Certification & Official Sign-Off
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Supervisor Name & Title:</span>
                <span className="font-bold text-slate-800">
                  {form.supervisorName}, {form.supervisorTitle}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Email & Phone:</span>
                <span className="font-medium text-slate-800">
                  {form.supervisorEmail} • {form.supervisorPhone}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <span className="text-slate-400 block text-[11px]">Authorized Digital Signature:</span>
                <div className="font-serif italic text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-400 pb-1 pt-1 min-w-[240px]">
                  {form.supervisorSignature}
                </div>
              </div>

              {/* Official Seal Mockup */}
              <div className="border-2 border-emerald-800 rounded-xl p-2.5 text-center text-emerald-900 bg-emerald-50/50">
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    OFFICIAL VERIFICATION
                  </span>
                </div>
                <p className="text-[9px] text-emerald-800 font-mono mt-0.5">
                  SO WHAT ELSE • TAX EXEMPT 501(c)(3)
                </p>
              </div>
            </div>
          </div>

          {/* Student Self-Download Link Box (Screen only) */}
          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 print:hidden flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="truncate">
              Direct Student Link:{' '}
              <span className="font-mono text-emerald-800 font-semibold">{shareUrl}</span>
            </span>
            <button
              type="button"
              onClick={() => onCopyLink?.(form.shareToken)}
              className="px-3 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-xs shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
