// src/pages/ResumeBuilder.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileText,
  FolderIcon,
  GraduationCap,
  Share2Icon,
  Sparkles,
  User
} from 'lucide-react';
import PersonalInfoForm from '../components/PersonalInfoForm';
import ResumePreview from '../components/ResumePreview';
import TemplateSelector from '../components/TemplateSelector';
import ColorPicker from '../components/ColorPicker';
import ProfessionalSummaryForm from '../components/ProfessionalSummaryForm';
import ExperienceForm from '../components/ExperienceForm';
import EducationForm from '../components/EducationForm';
import ProjectForm from '../components/ProjectForm';
import SkillsForm from '../components/SkillsForm';
import { useSelector } from 'react-redux';
import api from '../configs/api';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const { token, user } = useSelector(state => state.auth);

  const [resumeData, setResumeData] = useState({
    _id: '',
    title: '',
    personal_info: {},
    professional_summary: '',
    experience: [],
    education: [],
    project: [],
    skills: [],
    template: 'classic',
    accent_color: '#3B82F6',
    public: false,
    analysis_purchased: false
  });

  const [statusVersion, setStatusVersion] = useState(0); // force updates when server-resume applied
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);

  // analysis UI state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'projects', name: 'Projects', icon: FolderIcon },
    { id: 'skills', name: 'Skills', icon: Sparkles },
  ];

  const activeSection = sections[activeSectionIndex];
  const componentRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.fromTo(componentRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8 });
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.fromTo(formRef.current, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.5 });
  }, [activeSectionIndex]);

  // Load resume from server and set state
  const loadExistingResume = async () => {
    try {
      const { data } = await api.get('/api/resumes/get/' + resumeId, { headers: { Authorization: token } });
      if (data?.resume) {
        setResumeData(data.resume);
      }
    } catch (error) {
      console.error('loadExistingResume error:', error?.response?.data || error.message || error);
    }
  };

  useEffect(() => {
    loadExistingResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GET /api/ai/resume-status/:resumeId -> refresh minimal status or full resume
  const checkResumeStatus = async () => {
    try {
      const { data } = await api.get(`/api/ai/resume-status/${resumeId}`, {
        headers: { Authorization: token }
      });

      if (!data) return null;

      // If server returned full resume, sync and return it
      if (data.resume?.analysis_purchased || data.analysis_purchased) {
        if (data.resume) {
          setResumeData(data.resume);
        } else if (typeof data.analysis_purchased === 'boolean') {
          setResumeData(prev => ({ ...prev, analysis_purchased: data.analysis_purchased }));
        }
        setStatusVersion(v => v + 1);
        return data;
      }

      // Otherwise update just the flag if present and return minimal payload
      if (typeof data.analysis_purchased === 'boolean') {
        setResumeData(prev => ({ ...prev, analysis_purchased: data.analysis_purchased }));
        setStatusVersion(v => v + 1);
      }

      return data;
    } catch (err) {
      console.error('checkResumeStatus error:', err?.response || err);
      return null;
    }
  };

  // run checkResumeStatus on mount (correct call)
  useEffect(() => {
    checkResumeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeResumeVisibility = async () => {
    try {
      const formData = new FormData();
      formData.append('resumeId', resumeId);
      formData.append('resumeData', JSON.stringify({ public: !resumeData.public }));

      const { data } = await api.put('/api/resumes/update', formData, { headers: { Authorization: token } });

      setResumeData(prev => ({ ...prev, public: !prev.public }));
      toast.success(data.message);
    } catch (error) {
      console.error('Error saving resume:', error);
    }
  };

  const handleShare = () => {
    const frontendUrl = window.location.href.split('/app/')[0];
    const resumeUrl = frontendUrl + '/view/' + resumeId;

    if (navigator.share) {
      navigator.share({ url: resumeUrl, text: 'My Resume' });
    } else {
      alert('Share not supported on this browser.');
    }
  };

  const downloadResume = () => {
    window.print();
  };

  const saveResume = async () => {
    try {
      let updatedResumeData = structuredClone(resumeData);

      if (typeof resumeData.personal_info.image === 'object') {
        delete updatedResumeData.personal_info.image;
      }

      const formData = new FormData();
      formData.append('resumeId', resumeId);
      formData.append('resumeData', JSON.stringify(updatedResumeData));
      removeBackground && formData.append('removeBackground', 'yes');
      typeof resumeData.personal_info.image === 'object' && formData.append('image', resumeData.personal_info.image);

      const { data } = await api.put('/api/resumes/update', formData, { headers: { Authorization: token } });

      setResumeData(data.resume);
      toast.success(data.message);
    } catch (error) {
      console.error('Error saving resume:', error);
    }
  };

  // Dynamically load Razorpay SDK if not present
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  };

  // ---- UPDATED handlePurchase: after successful verify -> refresh & reload ----
  const handlePurchase = async () => {
    try {
      await loadRazorpayScript();

      const { data: order } = await api.post('/api/ai/create-order',
        {
          resumeId: resumeData._id,
          amount: 900 // paise (₹9)
        },
        { headers: { Authorization: token } }
      );

      if (!order || !order.id) {
        alert('Server returned invalid order. Check console/network and server logs.');
        return;
      }

      const options = {
        key: 'rzp_live_pUY8rDZAjalo1v',//'rzp_test_RWZN7PonJx0Zl4',rzp_live_pUY8rDZAjalo1v
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Resume99',
        description: 'Payment for Resume Analysis',
        order_id: order.id,

        handler: async function (response) {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resumeId: resumeData._id,
              amount: order.amount,
            };

            // Verify on server
            const verifyResp = await api.post('/api/ai/verify-payment', verifyPayload, {
              headers: { Authorization: token }
            });

            // If server returns the updated resume, use it and reload page
            if (verifyResp?.data?.resume) {
              setResumeData(verifyResp.data.resume);
              setStatusVersion(v => v + 1);
              setTimeout(() => window.location.reload(), 400);
              return;
            }

            // If verify returned a message but not the resume, try to refresh status & resume then reload
            if (verifyResp?.data?.message) {
              const status = await checkResumeStatus();
              const purchased = status?.resume?.analysis_purchased ?? status?.analysis_purchased ?? false;
              if (purchased) {
                await loadExistingResume();
                window.location.reload();
                return;
              } else {
                console.warn('verify returned success but server did not mark resume as purchased. Verify server logs.');
                alert('Payment succeeded but server did not mark resume as purchased. Reloading to refresh state.');
                await loadExistingResume();
                window.location.reload();
                return;
              }
            }

            // Fallback: if nothing useful returned, refresh status and reload
            await checkResumeStatus();
            await loadExistingResume();
            window.location.reload();

          } catch (err) {
            console.error('verify-payment error:', err?.response || err);
            if (err?.response?.data?.message) {
              alert(err.response.data.message);
            } else {
              alert('Payment succeeded but verification failed. Check server logs / console.');
            }
          }
        },

        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('payment.failed', resp);
        alert(`Payment Failed: ${resp.error?.description || 'Unknown error'}`);
      });
      rzp.open();

    } catch (err) {
      console.error('Error creating order:', err);
      if (err?.response) {
        console.error('response.data', err.response.data);
      }
      alert('Could not initiate payment. Check console and network tab.');
    }
  };

  // Analyze resume (calls backend analyze-resume and shows modal)
  // Now ensures we parse analysis.details into analysis.feedback so UI renders correctly
  const handleAnalyzeResume = async () => {
    if (!resumeData?._id) {
      alert('Resume ID missing. Save the resume first.');
      return;
    }

    try {
      // Ask server for current status and use that response to decide
      const status = await checkResumeStatus();
      const purchased = status?.resume?.analysis_purchased ?? status?.analysis_purchased ?? resumeData.analysis_purchased;

      if (!purchased) {
        alert('Please purchase the analysis for this resume to get the score and feedback.');
        return;
      }

      setAnalysisLoading(true);
      setAnalysisResult(null);

      const { data } = await api.post('/api/ai/analyze-resume', { resumeId: resumeData._id }, { headers: { Authorization: token } });

      if (!data || !data.analysis) {
        console.error('Invalid analysis response:', data);
        alert('Invalid response from server. Check console.');
        return;
      }

      // Normalize analysis.details -> feedback (server sometimes returns details as JSON string)
      let analysis = data.analysis;
      try {
        if (analysis.details) {
          if (typeof analysis.details === 'string') {
            const parsed = JSON.parse(analysis.details);
            analysis = { ...analysis, feedback: parsed };
          } else if (typeof analysis.details === 'object') {
            analysis = { ...analysis, feedback: analysis.details };
          }
        }
      } catch (parseErr) {
        console.error('Failed to parse analysis.details:', parseErr, analysis.details);
        analysis = { ...analysis, feedback: { overall: String(analysis.details || '') } };
      }

      setAnalysisResult(analysis);
      setShowAnalysisModal(true);
    } catch (err) {
      console.error('analyze-resume error:', err.response || err);
      if (err?.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to analyze resume. Check console/network.');
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div ref={componentRef} className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to={'/app'} className="inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all">
          <ArrowLeftIcon className="size-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{activeSection.name}</h2>
                <div className="flex items-center gap-2">
                  <TemplateSelector selectedTemplate={resumeData.template} onChange={(template) => setResumeData(prev => ({ ...prev, template }))} />
                  <ColorPicker selectedColor={resumeData.accent_color} onChange={(color) => setResumeData(prev => ({ ...prev, accent_color: color }))} />
                </div>
              </div>

              <div ref={formRef} className="space-y-6">
                {activeSection.id === 'personal' && (
                  <PersonalInfoForm data={resumeData.personal_info} onChange={(data) => setResumeData(prev => ({ ...prev, personal_info: data }))} removeBackground={removeBackground} setRemoveBackground={setRemoveBackground} />
                )}
                {activeSection.id === 'summary' && (
                  <ProfessionalSummaryForm data={resumeData.professional_summary} onChange={(data) => setResumeData(prev => ({ ...prev, professional_summary: data }))} setResumeData={setResumeData} />
                )}
                {activeSection.id === 'experience' && (
                  <ExperienceForm data={resumeData.experience} onChange={(data) => setResumeData(prev => ({ ...prev, experience: data }))} />
                )}
                {activeSection.id === 'education' && (
                  <EducationForm data={resumeData.education} onChange={(data) => setResumeData(prev => ({ ...prev, education: data }))} />
                )}
                {activeSection.id === 'projects' && (
                  <ProjectForm data={resumeData.project} onChange={(data) => setResumeData(prev => ({ ...prev, project: data }))} />
                )}
                {activeSection.id === 'skills' && (
                  <SkillsForm data={resumeData.skills} onChange={(data) => setResumeData(prev => ({ ...prev, skills: data }))} />
                )}
              </div>

              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0))} className="flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all" disabled={activeSectionIndex === 0}>
                  <ChevronLeft className="size-4" /> Previous
                </button>
                <button onClick={() => { toast.promise(saveResume, { loading: 'Saving...' }) }} className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:shadow-lg transition-all">
                  Save Changes
                </button>
                <button onClick={() => setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1))} className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all ${activeSectionIndex === sections.length - 1 && 'opacity-50'}`} disabled={activeSectionIndex === sections.length - 1}>
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-end gap-4 mb-6">
                {resumeData.analysis_purchased ? (
                  <button onClick={handleAnalyzeResume} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-all">
                    <Sparkles className="size-4" />
                    {analysisLoading ? 'Analyzing...' : 'Analyze Resume'}
                  </button>
                ) : (
                  <>
                    <button onClick={handlePurchase} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-all">
                      Purchase Analysis for ₹9
                    </button>
                    <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 bg-gray-200 rounded-lg cursor-not-allowed">
                      <Sparkles className="size-4" />
                      Analyze Resume
                    </button>
                  </>
                )}
                <button onClick={changeResumeVisibility} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 transition-all">
                  {resumeData.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                  {resumeData.public ? 'Public' : 'Private'}
                </button>
                {resumeData.public && (
                  <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-all">
                    <Share2Icon className="size-4" /> Share
                  </button>
                )}
                <button onClick={downloadResume} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-all">
                  <DownloadIcon className="size-4" /> Download
                </button>
              </div>

              {/* Analysis Modal */}
              {showAnalysisModal && analysisResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black opacity-40"
                    onClick={() => setShowAnalysisModal(false)}
                  />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 mx-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold">Resume Analysis</h3>
                      <button
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={() => setShowAnalysisModal(false)}
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-4">
                        <span className="text-sm text-gray-500">Score</span>
                        <div className="text-3xl font-extrabold">{analysisResult.score ?? 'N/A'}/100</div>
                      </div>

                      <div className="space-y-3 max-h-72 overflow-auto pr-2">
                        {analysisResult.feedback?.overall && (
                          <div>
                            <h4 className="font-semibold">Overall</h4>
                            <p className="text-sm text-gray-700">{analysisResult.feedback.overall}</p>
                          </div>
                        )}
                        {analysisResult.feedback?.clarity && (
                          <div>
                            <h4 className="font-semibold">Clarity & Conciseness</h4>
                            <p className="text-sm text-gray-700">{analysisResult.feedback.clarity}</p>
                          </div>
                        )}
                        {analysisResult.feedback?.ats_optimization && (
                          <div>
                            <h4 className="font-semibold">ATS Optimization</h4>
                            <p className="text-sm text-gray-700">{analysisResult.feedback.ats_optimization}</p>
                          </div>
                        )}
                        {analysisResult.feedback?.impact && (
                          <div>
                            <h4 className="font-semibold">Impact / Action Verbs</h4>
                            <p className="text-sm text-gray-700">{analysisResult.feedback.impact}</p>
                          </div>
                        )}
                        {analysisResult.feedback?.completeness && (
                          <div>
                            <h4 className="font-semibold">Completeness</h4>
                            <p className="text-sm text-gray-700">{analysisResult.feedback.completeness}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          onClick={() => setShowAnalysisModal(false)}
                          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            // persist analysisResult into resumeData (optional)
                            setResumeData(prev => ({ ...prev, analysisResult }));
                            setShowAnalysisModal(false);
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                        >
                          Save / Keep
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
