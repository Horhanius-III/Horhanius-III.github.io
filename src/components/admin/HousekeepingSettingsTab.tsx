import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Edit2,
  FileCheck,
  FileText,
  MapPin,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ACADEMIC_PREPARATION_PRESETS,
  SERVICE_ACTIVITY_PRESETS,
} from '../../data/sslPresets';
import { storageService } from '../../services/storage';
import { FacilityLocation, FormSection2Template } from '../../types';

interface HousekeepingSettingsTabProps {
  adminName: string;
}

export function HousekeepingSettingsTab({ adminName }: HousekeepingSettingsTabProps) {
  // Facilities State
  const [facilities, setFacilities] = useState<FacilityLocation[]>(() =>
    storageService.getFacilities()
  );
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [editClosingTime, setEditClosingTime] = useState('17:00');
  const [editOperatingHours, setEditOperatingHours] = useState('');

  // Add Facility Modal
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [newFacName, setNewFacName] = useState('');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacLat, setNewFacLat] = useState('39.0531');
  const [newFacLng, setNewFacLng] = useState('-77.1082');
  const [newFacGeofence, setNewFacGeofence] = useState('300');
  const [newFacClosingTime, setNewFacClosingTime] = useState('17:00');
  const [newFacOperatingHours, setNewFacOperatingHours] = useState('Mon - Sat: 9:00 AM - 5:00 PM');
  const [newFacPhone, setNewFacPhone] = useState('(240) 668-4500');

  // Form Section 2 Text Template State
  const [formTemplate, setFormTemplate] = useState<FormSection2Template>(() =>
    storageService.getSection2Template()
  );
  const [academicText, setAcademicText] = useState(
    formTemplate.academicPreparationText || ACADEMIC_PREPARATION_PRESETS[1].text
  );
  const [activityText, setActivityText] = useState(
    formTemplate.activityDescriptionText || SERVICE_ACTIVITY_PRESETS[1].text
  );
  const [serviceType, setServiceType] = useState<'DIRECT' | 'INDIRECT' | 'ADVOCACY'>(
    formTemplate.serviceType || 'DIRECT'
  );

  // Activities State
  const [activities, setActivities] = useState<string[]>(() =>
    storageService.getActivities()
  );
  const [newActivityInput, setNewActivityInput] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Facility handlers
  const handleStartEditFacility = (fac: FacilityLocation) => {
    setEditingFacilityId(fac.id);
    setEditClosingTime(fac.closingTime || '17:00');
    setEditOperatingHours(fac.operatingHours || 'Mon - Sat: 9:00 AM - 5:00 PM');
  };

  const handleSaveFacilityHours = (facId: string) => {
    const updated = storageService.updateFacility(
      facId,
      {
        closingTime: editClosingTime,
        operatingHours: editOperatingHours,
      },
      adminName
    );
    setFacilities(updated);
    setEditingFacilityId(null);
    showToast('Facility hours and official closing time updated!');
  };

  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim() || !newFacAddress.trim()) return;

    const lat = parseFloat(newFacLat) || 39.0531;
    const lng = parseFloat(newFacLng) || -77.1082;
    const geofence = parseInt(newFacGeofence, 10) || 300;

    const updated = storageService.addFacility(
      {
        name: newFacName.trim(),
        address: newFacAddress.trim(),
        lat,
        lng,
        geofenceMeters: geofence,
        closingTime: newFacClosingTime,
        operatingHours: newFacOperatingHours.trim(),
        phone: newFacPhone.trim() || undefined,
      },
      adminName
    );

    setFacilities(updated);
    setShowAddFacilityModal(false);
    setNewFacName('');
    setNewFacAddress('');
    showToast(`New facility "${newFacName.trim()}" added to pantry network!`);
  };

  const handleDeleteFacility = (fac: FacilityLocation) => {
    if (confirm(`Remove location "${fac.name}" from active locations?`)) {
      const updated = storageService.deleteFacility(fac.id, adminName);
      setFacilities(updated);
      showToast(`Location "${fac.name}" removed.`);
    }
  };

  // Form template handler
  const handleSaveFormTemplate = () => {
    const updated: FormSection2Template = {
      ...formTemplate,
      academicPreparationText: academicText,
      activityDescriptionText: activityText,
      serviceType,
    };
    storageService.saveSection2Template(updated);
    setFormTemplate(updated);
    showToast('Official Form Section II description and academic presets saved!');
  };

  // Activity handlers
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityInput.trim()) return;
    const updated = storageService.addActivity(newActivityInput.trim(), adminName);
    setActivities(updated);
    setNewActivityInput('');
    showToast(`Activity "${newActivityInput.trim()}" added to check-in choices!`);
  };

  const handleRemoveActivity = (act: string) => {
    if (activities.length <= 1) {
      alert('You must have at least one active service activity.');
      return;
    }
    const updated = storageService.removeActivity(act, adminName);
    setActivities(updated);
    showToast(`Activity "${act}" removed from choices.`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#1c1c1c] text-white rounded-3xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              System Settings & Housekeeping
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Manage physical pantry locations, official facility closing hours for uniform sign-off, customizable SSL Section II descriptions, and volunteer service activity choices.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddFacilityModal(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Location</span>
        </button>
      </div>

      {/* SECTION 1: Facility Locations & Official Closing Hours */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                Facility Locations & Official Operating Hours
              </h3>
              <p className="text-xs text-stone-500">
                Official closing hours are used for 1-click uniform day-close of remaining active community volunteers.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
            {facilities.length} Active Locations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {facilities.map((fac) => {
            const isEditing = editingFacilityId === fac.id;

            return (
              <div
                key={fac.id}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:border-orange-300 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-base">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>{fac.address}</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600 shrink-0">
                      Geofence: {fac.geofenceMeters}m
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-3 mt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                          Official Closing Time (24h or format)
                        </label>
                        <input
                          type="time"
                          value={editClosingTime}
                          onChange={(e) => setEditClosingTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                          Operating Hours Text
                        </label>
                        <input
                          type="text"
                          value={editOperatingHours}
                          onChange={(e) => setEditOperatingHours(e.target.value)}
                          placeholder="e.g. Mon - Sat: 9:00 AM - 5:00 PM"
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFacilityId(null)}
                          className="flex-1 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveFacilityHours(fac.id)}
                          className="flex-1 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                        >
                          Save Hours
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-stone-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Official Closing Time:</span>
                        </span>
                        <span className="font-mono font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                          {fac.closingTime || '17:00'} (5:00 PM)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Operating Schedule:</span>
                        <span className="font-medium text-stone-800">
                          {fac.operatingHours || 'Mon - Sat: 9:00 AM - 5:00 PM'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => handleStartEditFacility(fac)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 p-1 min-h-[36px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Closing Hours</span>
                    </button>

                    {/* Delete button if there are more than 1 locations */}
                    {facilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFacility(fac)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 p-1 min-h-[36px]"
                        title="Remove location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Form Specific Texts for Selection (MCPS SSL Section II) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                Form-Specific Texts & Descriptions (MCPS Form 560-51)
              </h3>
              <p className="text-xs text-stone-500">
                Configure default text templates for Academic Preparation and Service Action filled in Section II.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveFormTemplate}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm min-h-[40px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Form Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Academic Preparation Template */}
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Section II: Academic Preparation Text
              </label>
              <select
                onChange={(e) => {
                  const p = ACADEMIC_PREPARATION_PRESETS.find((x) => x.id === e.target.value);
                  if (p) setAcademicText(p.text);
                }}
                className="px-2 py-1 rounded-lg border border-stone-300 text-[11px] bg-white text-stone-700 font-medium"
              >
                <option value="">Load Preset...</option>
                {ACADEMIC_PREPARATION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={4}
              value={academicText}
              onChange={(e) => setAcademicText(e.target.value)}
              placeholder="e.g. Staff provided on-site orientation on Montgomery County food insecurity, food rescue supply chains, and safe packaging standards."
              className="w-full p-3 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-stone-500">
              This text explains what students learned prior to or during their service.
            </p>
          </div>

          {/* Service Action & Activity Description Template */}
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Section II: Service Action Description
              </label>
              <select
                onChange={(e) => {
                  const p = SERVICE_ACTIVITY_PRESETS.find((x) => x.id === e.target.value);
                  if (p) setActivityText(p.text);
                }}
                className="px-2 py-1 rounded-lg border border-stone-300 text-[11px] bg-white text-stone-700 font-medium"
              >
                <option value="">Load Preset...</option>
                {SERVICE_ACTIVITY_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={4}
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              placeholder="e.g. Inspected, sorted, and packed emergency farm produce and grocery pantry boxes for direct distribution to low-income children and families in Montgomery County."
              className="w-full p-3 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-stone-500">
              This text details the exact community tasks performed by the student volunteers.
            </p>
          </div>
        </div>

        {/* Service Type Selection */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
          <label className="block font-bold text-stone-800 uppercase tracking-wider text-[11px]">
            Default Service Type Checkbox on Form 560-51
          </label>
          <div className="flex flex-wrap gap-3">
            {(['DIRECT', 'INDIRECT', 'ADVOCACY'] as const).map((st) => (
              <label
                key={st}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer font-bold transition-all ${
                  serviceType === st
                    ? 'border-orange-500 bg-orange-50 text-orange-950 ring-1 ring-orange-500'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value={st}
                  checked={serviceType === st}
                  onChange={() => setServiceType(st)}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span>{st} SERVICE</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Service Activities Dropdown Management */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                Check-In Service Activity Choices
              </h3>
              <p className="text-xs text-stone-500">
                These options appear in the volunteer kiosk check-in dropdown menu.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
            {activities.length} Activities
          </span>
        </div>

        {/* Existing Activities Pills */}
        <div className="flex flex-wrap gap-2">
          {activities.map((act) => (
            <div
              key={act}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 hover:border-stone-300"
            >
              <span>{act}</span>
              <button
                type="button"
                onClick={() => handleRemoveActivity(act)}
                className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                title={`Remove "${act}"`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Activity Form */}
        <form onSubmit={handleAddActivity} className="flex gap-2 max-w-md pt-2">
          <input
            type="text"
            required
            value={newActivityInput}
            onChange={(e) => setNewActivityInput(e.target.value)}
            placeholder="Add new activity (e.g. Garden Harvest)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white font-bold text-xs min-h-[42px] shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </form>
      </div>

      {/* Add Location Modal */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFacility}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Register New Pantry Location
                </h3>
                <p className="text-xs text-stone-500">
                  Add a new physical site to the So What Else pantry network
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Location / Facility Name
                </label>
                <input
                  type="text"
                  required
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="e.g. Gaithersburg Community Distribution Hub"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  required
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  placeholder="e.g. 800 S Frederick Ave, Gaithersburg, MD 20877"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacLat}
                    onChange={(e) => setNewFacLat(e.target.value)}
                    placeholder="39.1434"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacLng}
                    onChange={(e) => setNewFacLng(e.target.value)}
                    placeholder="-77.2014"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Official Closing Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newFacClosingTime}
                    onChange={(e) => setNewFacClosingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Geofence Radius (meters)
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={2000}
                    value={newFacGeofence}
                    onChange={(e) => setNewFacGeofence(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Operating Hours Schedule
                </label>
                <input
                  type="text"
                  value={newFacOperatingHours}
                  onChange={(e) => setNewFacOperatingHours(e.target.value)}
                  placeholder="e.g. Mon - Fri: 8:30 AM - 5:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={newFacPhone}
                  onChange={(e) => setNewFacPhone(e.target.value)}
                  placeholder="(240) 668-4500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowAddFacilityModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20"
              >
                Add Location
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
