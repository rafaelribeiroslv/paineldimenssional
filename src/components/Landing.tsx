import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const navigate = useNavigate();

  const handleStart = () => {
    onStart();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d4af37 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[150px] animate-pulse"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center"
      >
        <div className="mb-12 relative">
          <motion.h1 
            className="text-6xl md:text-8xl font-black text-white uppercase tracking-[0.3em] text-center filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            animate={{ 
              textShadow: [
                "0 0 20px rgba(212,175,55,0.2)",
                "0 0 40px rgba(212,175,55,0.4)",
                "0 0 20px rgba(212,175,55,0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Dimensional
          </motion.h1>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4"></div>
        </div>

        {/* RGB Animated Button */}
        <div className="relative group">
          {/* RGB Border Animation Overlay */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
          
          <button
            onClick={handleStart}
            className="relative px-12 py-5 bg-black rounded-lg leading-none flex items-center divide-x divide-white/10"
          >
            <span className="flex items-center space-x-5">
              <span className="text-white text-2xl font-black uppercase tracking-[0.2em] italic pr-2">INICIAR</span>
            </span>
          </button>
        </div>

        <motion.p 
          className="mt-12 text-stone-500 text-[10px] uppercase tracking-[0.5em] font-bold"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Acesso Restrito &bullet; Protocolo V2.4
        </motion.p>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
            background-image: linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
          }
          50% {
            background-position: 100% 50%;
            background-image: linear-gradient(to right, #8b00ff, #4b0082, #0000ff, #00ff00, #ffff00, #ff7f00, #ff0000);
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Landing;
