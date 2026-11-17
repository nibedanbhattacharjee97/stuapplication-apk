/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Mail,
  Search,
  Smartphone,
  Star,
  Upload,
} from 'lucide-react';
import AndroidProjectExplorer from './components/AndroidProjectExplorer';
import {
  CHAT_TIMING,
  FaqItem,
  HELPLINE_PHONE,
  OFFICIAL_FAQS,
  REVIEW_URL,
  SUPPORTED_LANGUAGES,
  SUPPORT_EMAIL,
  WHATSAPP_DEFAULT_MESSAGE,
  WHATSAPP_PHONE,
} from './data/faqCatalog';

type ScreenMode = 'role_selection' | 'new_student' | 'existing_student' | 'dashboard';
type StudentType = 'NEW_STUDENT' | 'EXISTING_STUDENT';

interface SessionState {
  token: string;
  expiresAtEpochMs: number;
  studentType: StudentType;
  name: string;
  studentId?: string;
  mobileNumber?: string;
  pinCode?: string;
  state?: string;
}

const SESSION_STORAGE_KEY = 'anudip_student_care_session_v1';

async function parseJsonResponse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(`Empty response from server (HTTP ${res.status}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Server returned an unexpected response (HTTP ${res.status}). Please refresh and try again.`
    );
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  const [screen, setScreen] = useState<ScreenMode>('role_selection');
  const [session, setSession] = useState<SessionState | null>(null);

  // New Student Form State
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newState, setNewState] = useState('');
  const [lookingUpPin, setLookingUpPin] = useState(false);

  // Existing Student Form State
  const [exName, setExName] = useState('');
  const [exMobile, setExMobile] = useState('');
  const [exStudentId, setExStudentId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Help Tooltip Modal
  const [helpModal, setHelpModal] = useState<{ title: string; text: string } | null>(null);

  // Dashboard State
  const [faqs, setFaqs] = useState<FaqItem[]>(OFFICIAL_FAQS);
  const [languages, setLanguages] = useState<string[]>([...SUPPORTED_LANGUAGES]);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem>(OFFICIAL_FAQS[0]);
  const [faqSearch, setFaqSearch] = useState('');
  const [showFaqPicker, setShowFaqPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [translatedQuestion, setTranslatedQuestion] = useState(OFFICIAL_FAQS[0].question);
  const [translatedAnswer, setTranslatedAnswer] = useState(OFFICIAL_FAQS[0].answer);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Support Query Modal
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketFileName, setTicketFileName] = useState<string | null>(null);
  const [ticketFileData, setTicketFileData] = useState<{ base64: string; mime: string } | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as SessionState;
        if (parsed.token && parsed.expiresAtEpochMs > Date.now()) {
          setSession(parsed);
          setScreen('dashboard');
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    fetch('/api/faqs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.faqs?.length) {
          setFaqs(data.faqs);
          setSelectedFaq(data.faqs[0]);
          setTranslatedQuestion(data.faqs[0].question);
          setTranslatedAnswer(data.faqs[0].answer);
        }
        if (data?.languages?.length) {
          setLanguages(data.languages);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-detect State when 6-digit Pin Code is typed
  useEffect(() => {
    if (newPin.length !== 6) return;
    let cancelled = false;
    setLookingUpPin(true);
    fetch(`/api/pincode/${newPin}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.state) {
          setNewState(data.state);
        }
      })
      .finally(() => {
        if (!cancelled) setLookingUpPin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [newPin]);

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqs;
    const q = faqSearch.toLowerCase();
    return faqs.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [faqs, faqSearch]);

  const runTranslation = async (faq: FaqItem, lang: string, activeToken?: string) => {
    const token = activeToken || session?.token;
    if (lang === 'English') {
      setTranslatedQuestion(faq.question);
      setTranslatedAnswer(faq.answer);
      setTranslateError(null);
      setTranslating(false);
      return;
    }
    if (!token) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: faq.question,
          answer: faq.answer,
          targetLanguage: lang,
        }),
      });
      const data = await parseJsonResponse<{
        message?: string;
        translatedQuestion?: string;
        translatedAnswer?: string;
      }>(res);
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.message || `Translation unavailable for ${lang}`);
      }
      setTranslatedQuestion(data.translatedQuestion || faq.question);
      setTranslatedAnswer(data.translatedAnswer || faq.answer);
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Unable to translate right now.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSelectFaq = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setShowFaqPicker(false);
    setFaqSearch('');
    runTranslation(faq, selectedLanguage);
  };

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    runTranslation(selectedFaq, lang);
  };

  const handleNewStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim() || !newMobile.trim() || !newPin.trim() || !newState.trim()) {
      setFormError('Please fill in Name, Mobile Number, Pin Code and State.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/students/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          mobileNumber: newMobile.trim(),
          pinCode: newPin.trim(),
          state: newState.trim(),
        }),
      });
      const data = await parseJsonResponse<{
        message?: string;
        token: string;
        expiresAtEpochMs: number;
        name: string;
        mobileNumber?: string;
        pinCode?: string;
        state?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.');
      }
      const nextSession: SessionState = {
        token: data.token,
        expiresAtEpochMs: data.expiresAtEpochMs,
        studentType: 'NEW_STUDENT',
        name: data.name,
        mobileNumber: data.mobileNumber,
        pinCode: data.pinCode,
        state: data.state,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setScreen('dashboard');
      setSelectedLanguage('English');
      setTranslatedQuestion(selectedFaq.question);
      setTranslatedAnswer(selectedFaq.answer);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExistingStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = exName.trim();
    const trimmedId = exStudentId.trim().toUpperCase();
    const trimmedMobile = exMobile.trim();

    if (!trimmedName) {
      setFormError('Please enter your Name.');
      return;
    }
    if (!trimmedId) {
      setFormError('Please enter your Student ID.');
      return;
    }
    if (!trimmedId.startsWith('AF0') || trimmedId.length < 5) {
      setFormError("Student ID is mandatory and must start with 'AF0' (e.g., AF05319302).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/students/existing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          mobileNumber: trimmedMobile || null,
          studentId: trimmedId,
        }),
      });
      const data = await parseJsonResponse<{
        message?: string;
        token: string;
        expiresAtEpochMs: number;
        name: string;
        studentId?: string;
        mobileNumber?: string | null;
      }>(res);
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.');
      }
      const nextSession: SessionState = {
        token: data.token,
        expiresAtEpochMs: data.expiresAtEpochMs,
        studentType: 'EXISTING_STUDENT',
        name: data.name,
        studentId: data.studentId,
        mobileNumber: data.mobileNumber || undefined,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setScreen('dashboard');
      setSelectedLanguage('English');
      setTranslatedQuestion(selectedFaq.question);
      setTranslatedAnswer(selectedFaq.answer);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to verify Student ID.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnotherEntry = () => {
    const prevType = session?.studentType;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setFormError(null);
    setScreen(prevType === 'NEW_STUDENT' ? 'new_student' : 'existing_student');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setFormError(null);
    setNewName('');
    setNewMobile('');
    setNewPin('');
    setNewState('');
    setExName('');
    setExMobile('');
    setExStudentId('');
    setScreen('role_selection');
  };

  const handleTicketFile = (file: File | undefined) => {
    if (!file) return;
    setTicketFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setTicketFileData({ base64, mime: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
  };

  const handleTicketSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketFeedback({ type: 'err', msg: 'Please fill in both subject and description.' });
      return;
    }
    setTicketLoading(true);
    setTicketFeedback(null);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          attachmentBase64: ticketFileData?.base64 || null,
          attachmentMimeType: ticketFileData?.mime || null,
        }),
      });
      const data = await parseJsonResponse<{ message?: string; ticketId?: string }>(res);
      if (!res.ok) throw new Error(data.message || 'Unable to submit query.');
      setTicketFeedback({ type: 'ok', msg: `${data.message} (Ref: ${data.ticketId})` });
      setTicketSubject('');
      setTicketMessage('');
      setTicketFileName(null);
      setTicketFileData(null);
    } catch (err) {
      setTicketFeedback({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Submission error.',
      });
    } finally {
      setTicketLoading(false);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    WHATSAPP_DEFAULT_MESSAGE
  )}`;

  return (
    <div className="min-h-screen bg-[#F5F9FA] text-[#232B2E]">
      {/* Top Navigation */}
      <header className="bg-white border-b border-[#D5E1E4] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007E8A] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              AC
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-[#005F69] leading-tight">
                Anudip Student Care
              </h1>
              <p className="text-xs text-[#5C6B73]">
                Native Android Kotlin &amp; Jetpack Compose Project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#EEF4F6] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'preview'
                  ? 'bg-white text-[#007E8A] shadow-xs'
                  : 'text-[#5C6B73] hover:text-[#232B2E]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile App Preview
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'source'
                  ? 'bg-white text-[#007E8A] shadow-xs'
                  : 'text-[#5C6B73] hover:text-[#232B2E]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Android Source &amp; APK Guide
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'source' ? (
          <AndroidProjectExplorer />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Android Smartphone Frame Preview */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[410px] bg-[#162026] rounded-[40px] p-3 shadow-2xl border-4 border-[#2D3B44]">
                <div className="bg-[#F5F9FA] rounded-[30px] overflow-hidden min-h-[720px] max-h-[820px] flex flex-col">
                  {/* Android Status Bar */}
                  <div className="bg-[#007A7A] text-white px-5 py-2 flex items-center justify-between text-[11px] font-medium">
                    <span>Anudip Student Care</span>
                    <span>Android 15 • Material 3</span>
                  </div>

                  {/* Screen Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {screen !== 'role_selection' && screen !== 'dashboard' && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setFormError(null);
                            setScreen('role_selection');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5E1E4] text-xs font-semibold text-[#232B2E] hover:bg-[#EEF4F6]"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Change
                        </button>
                      </div>
                    )}

                    {screen === 'dashboard' && session && (
                      <div className="flex items-center justify-between bg-white border border-[#D5E1E4] rounded-2xl px-3.5 py-2.5">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#005F69] truncate">
                            {session.name}
                          </div>
                          <div className="text-[11px] text-[#5C6B73] truncate">
                            {session.studentId || `${session.mobileNumber} • ${session.state}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={handleSubmitAnotherEntry}
                            className="px-2.5 py-1.5 rounded-lg border border-[#D5E1E4] text-[11px] font-semibold text-[#007E8A] hover:bg-[#F0F7F8]"
                          >
                            New Entry
                          </button>
                          <button
                            onClick={handleLogout}
                            title="Log out"
                            className="p-1.5 rounded-lg text-[#0F3D5E] hover:bg-[#EEF4F6]"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Official Banner */}
                    <div className="bg-white rounded-2xl border border-[#D5E1E4] p-2.5 shadow-2xs">
                      <img
                        src="/anudip_cares_banner.jpg"
                        alt="Anudip Cares - Caring for Your Career"
                        className="w-full h-24 object-contain rounded-xl"
                      />
                    </div>

                    {/* Screen 1: Role Selection */}
                    {screen === 'role_selection' && (
                      <div className="space-y-4 pt-2">
                        <div className="text-center space-y-1.5">
                          <h2 className="text-xl font-bold text-[#007E8A]">
                            Welcome To Anudip Student Bot
                          </h2>
                          <p className="text-sm text-[#5C6B73]">
                            Please tell us who you are to continue
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setFormError(null);
                            setScreen('new_student');
                          }}
                          className="w-full text-left bg-white border border-[#D5E1E4] hover:border-[#007E8A] rounded-2xl p-4 shadow-2xs transition flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-sm text-[#232B2E]">🧑‍🎓 New Student</div>
                            <div className="text-xs text-[#5C6B73] mt-0.5">
                              Register your details &amp; pin code to get started
                            </div>
                          </div>
                          <span className="text-[#007E8A] font-bold">→</span>
                        </button>

                        <button
                          onClick={() => {
                            setFormError(null);
                            setScreen('existing_student');
                          }}
                          className="w-full text-left bg-white border border-[#D5E1E4] hover:border-[#0F3D5E] rounded-2xl p-4 shadow-2xs transition flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-sm text-[#232B2E]">
                              🎓 Existing Student
                            </div>
                            <div className="text-xs text-[#5C6B73] mt-0.5">
                              Verify with your Name &amp; Anudip Student ID (AF0...)
                            </div>
                          </div>
                          <span className="text-[#0F3D5E] font-bold">→</span>
                        </button>
                      </div>
                    )}

                    {/* Screen 2A: New Student */}
                    {screen === 'new_student' && (
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-xl font-bold text-[#007E8A]">Anudip Student Bot</h2>
                          <p className="text-xs text-[#5C6B73] font-medium">
                            You selected: 🧑‍🎓 New Student
                          </p>
                        </div>

                        <form
                          onSubmit={handleNewStudentSubmit}
                          className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-3 shadow-2xs"
                        >
                          <div>
                            <label className="block text-xs font-semibold mb-1">Name</label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => {
                                setNewName(e.target.value);
                                setFormError(null);
                              }}
                              placeholder="Enter your full name"
                              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1">Mobile Number</label>
                            <input
                              type="tel"
                              value={newMobile}
                              onChange={(e) => {
                                setNewMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setFormError(null);
                              }}
                              placeholder="10-digit mobile number"
                              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold">Pin Code</label>
                              <button
                                type="button"
                                onClick={() =>
                                  setHelpModal({
                                    title: 'Pin Code',
                                    text: 'Type your 6-digit postal PIN code. State will auto-fill automatically.',
                                  })
                                }
                                className="text-[#007E8A]"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={newPin}
                                onChange={(e) => {
                                  setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                                  setFormError(null);
                                }}
                                placeholder="Enter 6-digit Pin Code (e.g. 600001)"
                                className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                              />
                              {lookingUpPin && (
                                <Loader2 className="w-4 h-4 animate-spin text-[#007E8A] absolute right-3 top-3" />
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold">State</label>
                              <button
                                type="button"
                                onClick={() =>
                                  setHelpModal({
                                    title: 'State',
                                    text: 'State is automatically updated from your location or when you type your Pin Code.',
                                  })
                                }
                                className="text-[#007E8A]"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newState}
                                onChange={(e) => {
                                  setNewState(e.target.value);
                                  setFormError(null);
                                }}
                                placeholder="Auto-detected from GPS / Pin Code"
                                className="flex-1 px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newPin.length === 6) {
                                    fetch(`/api/pincode/${newPin}`)
                                      .then((r) => (r.ok ? r.json() : null))
                                      .then((d) => d?.state && setNewState(d.state));
                                  }
                                }}
                                className="px-3 rounded-xl border border-[#D5E1E4] text-xs font-semibold text-[#007E8A] inline-flex items-center gap-1 hover:bg-[#F0F7F8]"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                Pin
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl bg-[#007E8A] hover:bg-[#006973] text-white font-semibold text-sm transition disabled:opacity-60"
                          >
                            {submitting ? 'Submitting...' : '✅ Submit'}
                          </button>

                          {formError && (
                            <div className="p-3 rounded-xl bg-[#FDF2F2] border border-red-200 text-xs text-[#B91C1C] font-medium">
                              {formError}
                            </div>
                          )}
                        </form>
                      </div>
                    )}

                    {/* Screen 2B: Existing Student */}
                    {screen === 'existing_student' && (
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-xl font-bold text-[#007E8A]">Anudip Student Bot</h2>
                          <p className="text-xs text-[#5C6B73] font-medium">
                            You selected: 🎓 Existing Student
                          </p>
                        </div>

                        <form
                          onSubmit={handleExistingStudentSubmit}
                          className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-3 shadow-2xs"
                        >
                          <div>
                            <label className="block text-xs font-semibold mb-1">Name</label>
                            <input
                              type="text"
                              value={exName}
                              onChange={(e) => {
                                setExName(e.target.value);
                                setFormError(null);
                              }}
                              placeholder="Enter your full name"
                              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold">
                                CMIS Register Mobile Number (Optional)
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setHelpModal({
                                    title: 'CMIS Register Mobile Number (Optional)',
                                    text: 'Optional: 10-digit mobile number',
                                  })
                                }
                                className="text-[#007E8A]"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="tel"
                              value={exMobile}
                              onChange={(e) => {
                                setExMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setFormError(null);
                              }}
                              placeholder="Optional: 10-digit mobile number"
                              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold">Student ID (Mandatory)</label>
                              <button
                                type="button"
                                onClick={() =>
                                  setHelpModal({
                                    title: 'Student ID (Mandatory)',
                                    text: "Must start with 'AF0' (e.g., AF05319302)",
                                  })
                                }
                                className="text-[#007E8A]"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={exStudentId}
                              onChange={(e) => {
                                setExStudentId(e.target.value.toUpperCase());
                                setFormError(null);
                              }}
                              placeholder="e.g., AF05319302"
                              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm uppercase focus:outline-none focus:border-[#007E8A]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl bg-[#007E8A] hover:bg-[#006973] text-white font-semibold text-sm transition disabled:opacity-60"
                          >
                            {submitting ? 'Verifying...' : '✅ Submit'}
                          </button>

                          {formError && (
                            <div className="p-3 rounded-xl bg-[#FDF2F2] border border-red-200 text-xs text-[#B91C1C] font-medium">
                              {formError}
                            </div>
                          )}
                        </form>
                      </div>
                    )}

                    {/* Screen 3: Authenticated Dashboard */}
                    {screen === 'dashboard' && session && (
                      <div className="space-y-4">
                        <div className="bg-[#E2F5F7] border border-[#007E8A]/20 rounded-2xl p-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#005F69]">
                            You selected:{' '}
                            {session.studentType === 'NEW_STUDENT'
                              ? '🧑‍🎓 New Student'
                              : '🎓 Existing Student'}
                          </span>
                          <button
                            onClick={handleSubmitAnotherEntry}
                            className="text-[11px] font-semibold text-[#005F69] bg-white px-2.5 py-1 rounded-lg border border-[#007E8A]/30"
                          >
                            ⬅ Submit Another Entry
                          </button>
                        </div>

                        {/* Q&A Section */}
                        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-3 shadow-2xs">
                          <h3 className="text-sm font-bold text-[#007E8A]">
                            Ask Your Question &amp; Get Answer in Your Own Language
                          </h3>

                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              Select a question ({faqs.length} available)
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowFaqPicker(true)}
                              className="w-full text-left px-3 py-2.5 rounded-xl bg-[#F5F9FA] border border-[#D5E1E4] text-xs font-medium flex items-center justify-between gap-2"
                            >
                              <span className="line-clamp-2">{selectedFaq.question}</span>
                              <span className="text-[#007E8A] shrink-0">▼</span>
                            </button>
                          </div>

                          <div className="border-t border-[#E6EFF1] pt-2.5 space-y-2">
                            <div>
                              <div className="text-xs font-bold text-[#0F3D5E]">Question:</div>
                              <div className="text-xs text-[#232B2E] mt-0.5">
                                {selectedFaq.question}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#0F3D5E]">Answer:</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(selectedFaq.answer);
                                    setCopiedAnswer(true);
                                    setTimeout(() => setCopiedAnswer(false), 1500);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007E8A]"
                                >
                                  <Copy className="w-3 h-3" />
                                  {copiedAnswer ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div className="text-xs text-[#232B2E] mt-0.5 leading-relaxed">
                                {selectedFaq.answer}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Language Translation Section */}
                        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-3 shadow-2xs">
                          <h3 className="text-sm font-bold text-[#007E8A]">Select Your Language</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {languages.map((lang) => {
                              const active = lang === selectedLanguage;
                              return (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => handleSelectLanguage(lang)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                    active
                                      ? 'bg-[#E2F5F7] border-[#007E8A] text-[#005F69]'
                                      : 'bg-white border-[#D5E1E4] text-[#5C6B73] hover:bg-[#F5F9FA]'
                                  }`}
                                >
                                  {lang}
                                </button>
                              );
                            })}
                          </div>

                          <div className="border-t border-[#E6EFF1] pt-2.5">
                            {translating ? (
                              <div className="flex items-center gap-2 text-xs text-[#5C6B73] py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#007E8A]" />
                                Translating into {selectedLanguage}...
                              </div>
                            ) : translateError ? (
                              <div className="p-2.5 rounded-xl bg-[#FDF2F2] text-xs text-[#B91C1C]">
                                {translateError}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs font-bold text-[#0F3D5E]">
                                    Translated Question ({selectedLanguage}):
                                  </div>
                                  <div className="text-xs mt-0.5">{translatedQuestion}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#0F3D5E]">
                                    Translated Answer ({selectedLanguage}):
                                  </div>
                                  <div className="text-xs mt-0.5 leading-relaxed">
                                    {translatedAnswer}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Us via WhatsApp */}
                        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-2.5 shadow-2xs">
                          <h3 className="text-sm font-bold text-[#007E8A]">
                            Contact Us via WhatsApp
                          </h3>
                          <p className="text-xs text-[#5C6B73]">WhatsApp In English</p>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat on WhatsApp
                          </a>
                          <p className="text-[11px] text-[#5C6B73]">{CHAT_TIMING}</p>
                        </div>

                        {/* Review & Support Channels */}
                        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-4 space-y-2.5 shadow-2xs">
                          <a
                            href={REVIEW_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl border border-[#D5E1E4] text-xs font-semibold text-[#0F3D5E] flex items-center justify-center gap-2 hover:bg-[#F5F9FA]"
                          >
                            <Star className="w-4 h-4 text-[#F5B041]" />
                            🌟 Click Here To Give A Review
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${HELPLINE_PHONE.replace(/-/g, '')}`}
                              className="py-2 px-2 rounded-xl border border-[#D5E1E4] text-xs font-semibold text-[#232B2E] flex items-center justify-center gap-1.5 hover:bg-[#F5F9FA]"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#007E8A]" />
                              {HELPLINE_PHONE}
                            </a>
                            <a
                              href={`mailto:${SUPPORT_EMAIL}`}
                              className="py-2 px-2 rounded-xl border border-[#D5E1E4] text-xs font-semibold text-[#232B2E] flex items-center justify-center gap-1.5 hover:bg-[#F5F9FA]"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#007E8A]" />
                              Email Support
                            </a>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setTicketFeedback(null);
                              setShowQueryModal(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-[#0F3D5E] text-white text-xs font-semibold hover:bg-[#0B2D45]"
                          >
                            Raise a Query / Attach Screenshot
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Reproduction Summary & Backend Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#D5E1E4] p-5 shadow-xs space-y-3">
                <h2 className="font-bold text-base text-[#005F69]">
                  Faithful Reproduction of teststudentsapp.streamlit.app
                </h2>
                <p className="text-sm text-[#5C6B73] leading-relaxed">
                  Every workflow, label, validation rule, all <strong>41 official student FAQs</strong>, all <strong>11 regional languages</strong>, Pin Code auto-detection, WhatsApp helpline integration, and Google Review link from your live Streamlit app have been implemented in the native Android project (<code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-xs text-[#005F69]">android-app/</code>).
                </p>

                <ul className="space-y-2 text-sm text-[#232B2E]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#007E8A] shrink-0 mt-0.5" />
                    <span>
                      <strong>New Student:</strong> Name, Mobile Number, 6-digit Pin Code with auto State lookup &amp; native Android GPS detection.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#007E8A] shrink-0 mt-0.5" />
                    <span>
                      <strong>Existing Student:</strong> Name, optional 10-digit CMIS Mobile Number, and mandatory <code className="text-xs bg-[#F0F7F8] px-1 rounded">AF0...</code> Student ID validation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#007E8A] shrink-0 mt-0.5" />
                    <span>
                      <strong>Student Care Bot:</strong> Searchable 41-question picker, server-side translation across 11 Indian languages, WhatsApp support (<code className="text-xs bg-[#F0F7F8] px-1 rounded">+91 83730 69599</code>), and Camera/Gallery support query attachments.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#D5E1E4] p-5 shadow-xs space-y-2.5">
                <h3 className="font-bold text-sm text-[#0F3D5E]">
                  Syncing With Your Existing Google Sheet
                </h3>
                <p className="text-sm text-[#5C6B73] leading-relaxed">
                  Because Streamlit does not expose public REST APIs, this project includes <code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-xs text-[#005F69]">server.ts</code> as a secure HTTPS API layer with signed Bearer tokens. To reflect Android submissions directly in your existing Google Sheet, configure <code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-xs text-[#005F69]">GOOGLE_SHEETS_WEBHOOK_URL</code> in your server environment—never inside the Android APK.
                </p>
                <button
                  onClick={() => setActiveTab('source')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#007E8A] hover:underline pt-1"
                >
                  <Code2 className="w-4 h-4" />
                  Inspect Kotlin Source &amp; Build Instructions →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Help Tooltip Modal */}
      {helpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h3 className="font-bold text-base text-[#005F69]">{helpModal.title}</h3>
            <p className="text-sm text-[#232B2E]">{helpModal.text}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setHelpModal(null)}
                className="px-4 py-2 rounded-xl bg-[#007E8A] text-white text-sm font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Searchable 41-Question Picker Modal */}
      {showFaqPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#D5E1E4] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#007E8A]">Select a question</h3>
                <button
                  onClick={() => setShowFaqPicker(false)}
                  className="text-sm font-semibold text-[#5C6B73]"
                >
                  Close
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-[#5C6B73] absolute left-3 top-3" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search 41 student FAQs..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5E1E4] text-sm focus:outline-none focus:border-[#007E8A]"
                />
              </div>
            </div>
            <div className="overflow-y-auto p-3 space-y-2">
              {filteredFaqs.map((item) => {
                const active = item.index === selectedFaq.index;
                return (
                  <button
                    key={item.index}
                    onClick={() => handleSelectFaq(item)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                      active
                        ? 'bg-[#E2F5F7] border-[#007E8A] font-semibold text-[#005F69]'
                        : 'bg-[#F5F9FA] border-[#D5E1E4] hover:bg-[#EEF4F6]'
                    }`}
                  >
                    {item.index}. {item.question}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Raise a Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleTicketSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#007E8A]">Raise a Query</h3>
              <button
                type="button"
                onClick={() => setShowQueryModal(false)}
                className="text-sm font-semibold text-[#5C6B73]"
              >
                Close
              </button>
            </div>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm"
            />
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe your question or concern..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-[#D5E1E4] text-sm"
            />
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#007E8A] text-xs font-semibold text-[#007E8A] cursor-pointer hover:bg-[#F0F7F8]">
              <Upload className="w-4 h-4" />
              <span>{ticketFileName || 'Attach Screenshot / Document (Optional)'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleTicketFile(e.target.files?.[0])}
              />
            </label>
            {ticketFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  ticketFeedback.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {ticketFeedback.msg}
              </div>
            )}
            <button
              type="submit"
              disabled={ticketLoading}
              className="w-full py-2.5 rounded-xl bg-[#007E8A] text-white text-sm font-semibold disabled:opacity-60"
            >
              {ticketLoading ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
