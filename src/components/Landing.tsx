import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../App';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    onStart();
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/me');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-body selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4af37 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 flex flex-col items-center px-4"
      >
        <div className="mb-16 relative">
          <motion.h1 
            className="text-5xl md:text-8xl font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] text-center filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] font-display"
            animate={{ 
              textShadow: [
                "0 0 20px rgba(212,175,55,0.2)",
                "0 0 40px rgba(212,175,55,0.4)",
                "0 0 20px rgba(212,175,55,0.2)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            Dimensional
          </motion.h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-6"
          ></motion.div>
        </div>

        {/* RGB Animated Button */}
        <div className="relative group cursor-pointer" onClick={handleStart}>
          {/* Animated RBG Background */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition duration-1000 group-hover:duration-200 animate-rgb-border"></div>
          
          <button
            className="relative px-16 py-6 bg-black rounded-lg leading-none flex items-center transition-transform active:scale-95"
          >
            <span className="text-white text-3xl font-black uppercase tracking-[0.2em] italic font-display">
              INICIAR
            </span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <div className="px-4 py-1 border border-zinc-800 rounded-full bg-zinc-900/50">
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.4em] font-bold">
              Protocolo Dimensionais &bullet; V.2.4
            </p>
          </div>
          <p className="text-zinc-700 text-[8px] uppercase tracking-widest font-medium">Aguardando Iniciação</p>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rgb-border {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .animate-rgb-border {
          animation: rgb-border 4s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Landing;
