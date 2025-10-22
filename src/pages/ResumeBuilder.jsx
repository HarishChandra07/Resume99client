import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, DownloadIcon, EyeIcon, EyeOffIcon, FileText, FolderIcon, GraduationCap, Share2Icon, Sparkles, User } from 'lucide-react';
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
import axios from 'axios';
import { gsap } from 'gsap';

const ResumeBuilder = () => {
    const { resumeId } = useParams();
    const { token, user } = useSelector(state => state.auth);

    const [resumeData, setResumeData] = useState({
        _id: '',
        title: '',
        personal_info: {},
        professional_summary: "",
        experience: [],
        education: [],
        project: [],
        skills: [],
        template: "classic",
        accent_color: "#3B82F6",
        public: false,
        analysis_purchased: false
    });

    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [removeBackground, setRemoveBackground] = useState(false);

    const sections = [
        { id: "personal", name: "Personal Info", icon: User },
        { id: "summary", name: "Summary", icon: FileText },
        { id: "experience", name: "Experience", icon: Briefcase },
        { id: "education", name: "Education", icon: GraduationCap },
        { id: "projects", name: "Projects", icon: FolderIcon },
        { id: "skills", name: "Skills", icon: Sparkles },
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


    const loadExistingResume = async () => {
        try {
            const { data } = await api.get('/api/resumes/get/' + resumeId, { headers: { Authorization: token } });
            if (data.resume) {
                setResumeData(data.resume);
                document.title = data.resume.title;
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        loadExistingResume();
    }, []);

    const changeResumeVisibility = async () => {
        try {
            const formData = new FormData();
            formData.append("resumeId", resumeId);
            formData.append("resumeData", JSON.stringify({ public: !resumeData.public }));

            const { data } = await api.put('/api/resumes/update', formData, { headers: { Authorization: token } });

            setResumeData({ ...resumeData, public: !resumeData.public });
            toast.success(data.message);
        } catch (error) {
            console.error("Error saving resume:", error);
        }
    };

    const handleShare = () => {
        const frontendUrl = window.location.href.split('/app/')[0];
        const resumeUrl = frontendUrl + '/view/' + resumeId;

        if (navigator.share) {
            navigator.share({ url: resumeUrl, text: "My Resume", });
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
            formData.append("resumeId", resumeId);
            formData.append('resumeData', JSON.stringify(updatedResumeData));
            removeBackground && formData.append("removeBackground", "yes");
            typeof resumeData.personal_info.image === 'object' && formData.append("image", resumeData.personal_info.image);

            const { data } = await api.put('/api/resumes/update', formData, { headers: { Authorization: token } });

            setResumeData(data.resume);
            toast.success(data.message);
        } catch (error) {
            console.error("Error saving resume:", error);
        }
    };

    const handlePurchase = async () => {
        try {
            const { data: order } = await axios.post('/api/ai/create-order', {
                resumeId: resumeData._id,
                amount: 10000,
            });

            const options = {
                key: 'rzp_test_RWZN7PonJx0Zl4',
                amount: order.amount,
                currency: order.currency,
                name: 'Your App Name',
                description: `Payment for Resume Analysis`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verificationResponse = await axios.post('/api/ai/verify-payment', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            resumeId: resumeData._id,
                        });

                        alert(verificationResponse.data.message);
                        setResumeData({ ...resumeData, analysis_purchased: true });

                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: '#3399cc'
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(`Payment Failed: ${response.error.description}`);
                console.error(response.error);
            });
            rzp1.open();

        } catch (error) {
            console.error("Error creating order:", error);
            alert("Could not initiate payment. Please try again later.");
        }
    };

    const handleAnalyzeResume = () => {
        alert("Resume analysis coming soon!");
    };

    return (
        <div ref={componentRef} className="bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <Link to={'/app'} className='inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all'>
                    <ArrowLeftIcon className="size-4" /> Back to Dashboard
                </Link>
            </div>

            <div className='max-w-7xl mx-auto px-4 pb-8'>
                <div className='grid lg:grid-cols-12 gap-8'>
                    {/* Left Panel - Form */}
                    <div className='lg:col-span-4'>
                        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6'>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{activeSection.name}</h2>
                                <div className='flex items-center gap-2'>
                                    <TemplateSelector selectedTemplate={resumeData.template} onChange={(template) => setResumeData(prev => ({ ...prev, template }))} />
                                    <ColorPicker selectedColor={resumeData.accent_color} onChange={(color) => setResumeData(prev => ({ ...prev, accent_color: color }))} />
                                </div>
                            </div>

                            <div ref={formRef} className='space-y-6'>
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
                                <button onClick={() => setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0))} className='flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all' disabled={activeSectionIndex === 0}>
                                    <ChevronLeft className="size-4" /> Previous
                                </button>
                                <button onClick={() => { toast.promise(saveResume, { loading: 'Saving...' }) }} className='bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:shadow-lg transition-all'>
                                    Save Changes
                                </button>
                                <button onClick={() => setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1))} className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all ${activeSectionIndex === sections.length - 1 && 'opacity-50'}`} disabled={activeSectionIndex === sections.length - 1}>
                                    Next <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className='lg:col-span-8'>
                        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6'>
                            <div className='flex justify-end gap-4 mb-6'>
                                {resumeData.analysis_purchased ? (
                                    <button onClick={handleAnalyzeResume} className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-all'>
                                        <Sparkles className="size-4" />
                                        Analyze Resume
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={handlePurchase} className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-all'>
                                            Purchase Analysis for ₹100
                                        </button>
                                        <button disabled className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 bg-gray-200 rounded-lg cursor-not-allowed'>
                                            <Sparkles className="size-4" />
                                            Analyze Resume
                                        </button>
                                    </>
                                )}
                                <button onClick={changeResumeVisibility} className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 transition-all'>
                                    {resumeData.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                                    {resumeData.public ? 'Public' : 'Private'}
                                </button>
                                {resumeData.public && (
                                    <button onClick={handleShare} className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-all'>
                                        <Share2Icon className='size-4' /> Share
                                    </button>
                                )}
                                <button onClick={downloadResume} className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-all'>
                                    <DownloadIcon className='size-4' /> Download
                                </button>
                            </div>

                            <ResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;