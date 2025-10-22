import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const Banner = () => {
    const bannerRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
        tl.fromTo(bannerRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
    }, []);

    return (
        <div ref={bannerRef} className="w-full py-3 font-semibold text-base text-center bg-gradient-to-r from-green-400 to-teal-400 text-white shadow-lg">
            <p><span className="px-4 py-1 rounded-full bg-white text-green-600 mr-3 text-sm font-bold">New</span>AI-Powered Resume Analysis has been added!</p>
        </div>
    );
}

export default Banner;