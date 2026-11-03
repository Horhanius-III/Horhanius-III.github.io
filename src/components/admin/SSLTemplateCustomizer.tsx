import { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  FileEdit,
  FileText,
  HelpCircle,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import {
  ACADEMIC_PREPARATION_PRESETS,
  SERVICE_ACTIVITY_PRESETS,
} from '../../data/sslPresets';
import { storageService } from '../../services/storage';
import { FormSection2Template } from '../../types';
import { populateOriginalMcpsFormPdf } from '../../utils/pdfGenerator';

interface SSLTemplateCustomizerProps {
  adminName: string;
  onClose?: () => void;
}

export function SSLTemplateCustomizer({ adminName, onClose }: SSLTemplateCustomizerProps) {
  const currentTemplate = storageService.getSection2Template();

  const [academicPresetId, setAcademicPresetId] = useState<string>(() => {
    const match = ACADEMIC_PREPARATION_PRESETS.find(
      (p) => p.text === currentTemplate.academicPreparationText
    );
    return match ? match.id : currentTemplate.academicPreparationText ? 'custom' : 'empty';
  });

  const [academicText, setAcademicText] = useState(
    currentTemplate.academicPreparationText || ''
  );

  const [activityPresetId, setActivityPresetId] = useState<string>(() => {
    const match = SERVICE_ACTIVITY_PRESETS.find(
      (p) => p.text === currentTemplate.activityDescriptionText
    );
    return match ? match.id : currentTemplate.activityDescriptionText ? 'custom' : 'empty';
  });

  const [activityText, setActivityText] = useState(
    currentTemplate.activityDescriptionText || ''
  );

  const [serviceType, setServiceType] = useState<'DIRECT' | 'INDIRECT' | 'ADVOCACY'>(
    currentTemplate.serviceType || 'DIRECT'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const handleAcademicPresetChange = (presetId: string) => {
    setAcademicPresetId(presetId);
    if (presetId === 'custom') return;
    const preset = ACADEMIC_PREPARATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setAcademicText(preset.text);
    }
  };

  const handleActivityPresetChange = (presetId: string) => {
    setActivityPresetId(presetId);
    if (presetId === 'custom') return;
    const preset = SERVICE_ACTIVITY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setActivityText(preset.text);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FormSection2Template = {
      ...currentTemplate,
      academicPreparationText: academicText.trim(),
      activityDescriptionText: activityText.trim(),
      serviceType,
    };
    storageService.updateSection2Template(updated, adminName);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToEmpty = () => {
    setAcademicPresetId('empty');
    setAcademicText('');
    setActivityPresetId('empty');
    setActivityText('');
    setServiceType('DIRECT');

    const updated: FormSection2Template = {
      ...currentTemplate,
      academicPreparationText: '',
      activityDescriptionText: '',
      serviceType: 'DIRECT',
    };
    storageService.updateSection2Template(updated, adminName);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestDownloadPdf = async () => {
    setIsGeneratingSample(true);
    try {
      const sampleForm = storageService.getSSLForms()[0] || {
        id: 'ssl-sample-test',
        sessionIds: ['sess-1'],
        volunteerId: 'vol-marcus-chen',
        sweId: 'MC-4821',
        studentName: 'Marcus Chen',
        studentEmail: 'marcus.chen@student.mcpsmd.net',
        studentId: 'MCPS-938210',
        school: 'Richard Montgomery High School',
        grade: '11th Grade',
        organization: 'So What Else, Inc.',
        ein: '27-0899847',
        facilityName: 'Rockville Warehouse & Main Food Hub',
        supervisorName: adminName,
        supervisorTitle: 'Director of Volunteer Operations',
        supervisorEmail: 'sjenkins@sowhatelse.org',
        supervisorPhone: '(240) 668-4500',
        dateRange: { start: '2026-10-26', end: '2026-10-26' },
        totalVerifiedHours: 3.5,
        activityDescription: activityText,
        serviceType,
        status: 'issued',
        shareToken: 'test-token',
        createdAt: new Date().toISOString(),
        supervisorSignature: `${adminName}, Dir. Volunteer Ops`,
      };

      const templateToUse: FormSection2Template = {
        ...currentTemplate,
        academicPreparationText: academicText.trim(),
        activityDescriptionText: activityText.trim(),
        serviceType,
      };

      await populateOriginalMcpsFormPdf(sampleForm, templateToUse, true);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-lg">
              MCPS Form 560-51 Section II Customizer
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Configure default text for the two Section II description fields on the official MCPS SSL Form.
            By default, these fields are <strong>left empty</strong> as placeholders for manual fill. You can select pre-approved dropdown choices below.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestDownloadPdf}
            disabled={isGeneratingSample}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors shadow-2xs"
            title="Download test MCPS Form 560-51 with these settings"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span>{isGeneratingSample ? 'Generating...' : 'Preview Test PDF'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold"
            >
              Back to SSL List
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Section II description settings saved successfully! All newly generated and downloaded PDFs will reflect this choice.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Field 1: Academic Preparation */}
        <div className="p-5 rounded-2xl border border-stone-200/80 bg-stone-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span>Field 1: Academic Preparation Description</span>
            </label>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                academicText.trim()
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {academicText.trim() ? '✓ Will Print on PDF' : 'Empty Placeholder (Default)'}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Form prompt: <em>"Describe how you taught the student about the community organization and/or the community need that they addressed:"</em>
          </p>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Select Preset from Dropdown Menu
            </label>
            <select
              value={academicPresetId}
              onChange={(e) => handleAcademicPresetChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium bg-white focus:ring-2 focus:ring-orange-500 min-h-[44px]"
            >
              {ACADEMIC_PREPARATION_PRESETS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">-- Custom Text --</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Exact Text Printed onto PDF (or leave blank for empty box)
            </label>
            <textarea
              rows={2}
              value={academicText}
              onChange={(e) => {
                setAcademicText(e.target.value);
                setAcademicPresetId('custom');
              }}
              placeholder="Leave blank to print empty box on PDF (default placeholder)..."
              className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Field: Service Action Type (Checkbox 29aa / 29bb / 29cc) */}
        <div className="p-5 rounded-2xl border border-stone-200/80 bg-stone-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-orange-600" />
              <span>Service Action Type (MCPS Checkbox)</span>
            </label>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
              Active Checkbox: {serviceType}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Form prompt: <em>"Type of Service Action (check one): Direct [ ] Indirect [ ] Advocacy [ ]"</em>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'DIRECT',
                title: 'Direct Action',
                desc: 'Hands-on, in-person assistance directly aiding community members (food distribution, hot meal packing).',
              },
              {
                id: 'INDIRECT',
                title: 'Indirect Action',
                desc: 'Channeling resources, warehouse non-perishable sorting, pantry kit assembly, logistics.',
              },
              {
                id: 'ADVOCACY',
                title: 'Advocacy Action',
                desc: 'Raising awareness, organizing hunger alleviation campaigns, community education.',
              },
            ].map((option) => (
              <label
                key={option.id}
                onClick={() => setServiceType(option.id as 'DIRECT' | 'INDIRECT' | 'ADVOCACY')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  serviceType === option.id
                    ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 border-stone-200 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-stone-900">{option.title}</span>
                    <input
                      type="radio"
                      name="serviceActionType"
                      checked={serviceType === option.id}
                      onChange={() => setServiceType(option.id as 'DIRECT' | 'INDIRECT' | 'ADVOCACY')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">{option.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-orange-600 mt-2">
                  {serviceType === option.id ? '✓ Checkbox Marked with X' : 'Click to select'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Field 2: Service Activity Description */}
        <div className="p-5 rounded-2xl border border-stone-200/80 bg-stone-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Field 2: Service Activity Description</span>
            </label>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                activityText.trim()
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activityText.trim() ? '✓ Will Print on PDF' : 'Empty Placeholder (Default)'}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Form prompt: <em>"Describe the service activity that the student completed to address the identified community need:"</em>
          </p>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Select Preset from Dropdown Menu
            </label>
            <select
              value={activityPresetId}
              onChange={(e) => handleActivityPresetChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium bg-white focus:ring-2 focus:ring-orange-500 min-h-[44px]"
            >
              {SERVICE_ACTIVITY_PRESETS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">-- Custom Text --</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Exact Text Printed onto PDF (or leave blank for empty box)
            </label>
            <textarea
              rows={2}
              value={activityText}
              onChange={(e) => {
                setActivityText(e.target.value);
                setActivityPresetId('custom');
              }}
              placeholder="Leave blank to print empty box on PDF (default placeholder)..."
              className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetToEmpty}
            className="flex items-center justify-center gap-1.5 px-4 py-3 min-h-[44px] rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Both Fields to Empty (Default)</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Custom Section II Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
