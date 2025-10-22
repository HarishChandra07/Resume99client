import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const Hero = () => {
    const { user } = useSelector(state => state.auth);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [scoring, setScoring] = React.useState(false);

    const logos = [
        'https://saasly.prebuiltui.com/assets/companies-logo/instagram.svg',
        'https://saasly.prebuiltui.com/assets/companies-logo/framer.svg',
        'https://saasly.prebuiltui.com/assets/companies-logo/microsoft.svg',
        'https://saasly.prebuiltui.com/assets/companies-logo/huawei.svg',
        'https://saasly.prebuiltui.com/assets/companies-logo/walmart.svg',
    ];

    const heroRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
        tl.fromTo(".hero-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2 });
        tl.fromTo(".hero-cta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");
        tl.fromTo(".hero-logos img", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, "-=0.3");
    }, []);

    async function handleAnalyze() {
        if (scoring) return;
        setScoring(true);
        try {
            await new Promise(res => setTimeout(res, 800));
        } finally {
            setScoring(false);
        }
    }

    return (
        <div ref={heroRef} className="min-h-screen pb-20 bg-gray-50">
            <nav className="z-50 flex items-center justify-between w-full py-6 px-6 md:px-16 lg:px-24 xl:px-40 text-base">
                <a href="">
                    <img src="/logo.svg" alt="logo" className="h-12 w-auto" />
                </a>

                <div className="hidden md:flex items-center gap-10 text-slate-800 font-semibold">
                    <a href="#" className="hover:text-green-600 transition-colors">Home</a>
                    <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
                    <a href="#testimonials" className="hover:text-green-600 transition-colors">Testimonials</a>
                    <a href="#cta" className="hover:text-green-600 transition-colors">Contact</a>
                </div>

                <div className="flex gap-4">
                    <Link to='/app?state=register' className="hidden md:block px-6 py-3 border border-green-500 text-green-600 font-semibold rounded-full hover:bg-green-50 active:scale-95 transition-all" hidden={user}>
                        Build Resume
                    </Link>
                    <Link to='/app' className='hidden md:block px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 active:scale-95 transition-all' hidden={!user}>
                        Dashboard
                    </Link>
                </div>

                <button onClick={() => setMenuOpen(true)} className="md:hidden active:scale-90 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" className="lucide lucide-menu">
                        <path d="M4 5h16M4 12h16M4 19h16" />
                    </svg>
                </button>
            </nav>

            <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-lg flex flex-col items-center justify-center text-xl gap-10 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <a href="#" className="text-white">Home</a>
                <a href="#features" className="text-white">Features</a>
                <a href="#testimonials" className="text-white">Testimonials</a>
                <a href="#contact" className="text-white">Contact</a>
                <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 text-white text-3xl">&times;</button>
            </div>

            <div className="relative flex flex-col items-center justify-center text-center px-4 md:px-16 lg:px-24 xl:px-40 text-black mt-20">
                <h1 className="hero-title text-6xl md:text-7xl font-bold max-w-4xl leading-tight">
                    Land your dream job with an <span className="bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">AI-powered</span> resume.
                </h1>

                <p className="hero-title max-w-lg text-lg text-gray-600 my-8">
                    Create, edit, and download professional resumes with AI-powered assistance to get ahead of the competition.
                </p>

                <div className="hero-cta flex items-center gap-6">
                    <Link to='/app' className="px-10 py-4 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 active:scale-95 transition-all">
                        Build Your Resume Now
                    </Link>
                    <button onClick={handleAnalyze} aria-label="Analyze resume" disabled={scoring} className={`flex items-center gap-3 px-8 py-4 text-gray-700 font-semibold bg-white rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all ${scoring ? 'cursor-wait' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${scoring ? 'animate-spin' : ''}`}>
                            <path d="M12 15V11" />
                            <path d="M21 12a9 9 0 1 0-18 0" />
                            <path d="M16.24 7.76a5 5 0 0 0-8.48 0" />
                        </svg>
                        <span>{scoring ? 'Analyzing…' : 'Analyze a Resume'}</span>
                    </button>
                </div>

                <div className="hero-logos mt-24 w-full">
                    <p className="text-gray-500 font-semibold mb-6">Trusted by professionals at leading companies</p>
                    <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
                        {logos.map((logo, index) => <img key={index} src={logo} alt={`logo-${index}`} className="h-7 w-auto" />)}
                    </div>
                </div>
            </div>
            <style>
                {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

            * {
                font-family: 'Poppins', sans-serif;
            }
        `}
            </style>
        </div>
    );
}

export default Hero;
