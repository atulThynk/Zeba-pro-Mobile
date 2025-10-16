import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import zebaLogo from "/Users/admin/Documents/GitHub/Zeba-pro-Mobile/ZEBA-PRO-MOBILE/src/public/assets/1.png";
import zebaDark1 from "/Users/admin/Documents/GitHub/Zeba-pro-Mobile/ZEBA-PRO-MOBILE/src/public/assets/2.png";
import zebaDark2 from "/Users/admin/Documents/GitHub/Zeba-pro-Mobile/ZEBA-PRO-MOBILE/src/public/assets/3.png";
import zebaDark3 from "/Users/admin/Documents/GitHub/Zeba-pro-Mobile/ZEBA-PRO-MOBILE/src/public/assets/4.png";

interface SplashScreenProps {
  onComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [showLogos, setShowLogos] = useState(false);

  useEffect(() => {
    // Show logos after a short delay
    const logoTimer = setTimeout(() => {
      setShowLogos(true);
    }, 0); // reduced delay since no static icon

    // Complete splash after total 6 seconds (adjust as needed)
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, 1000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const logoImages = [zebaLogo, zebaDark1, zebaDark2, zebaDark3];

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-gradient-to-t from-gray-500 to-white z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center">
            {showLogos && (
              <div className="flex items-center">
                {logoImages.map((logoSrc, i) => (
                  <motion.img
                    key={`logo-${i}`}
                    src={logoSrc}
                    alt={`Zeba Logo Part ${i + 1}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.15,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className="h-24 md:h-24 w-auto drop-shadow-2xl"
                       style={{ 
                      marginLeft: i === 0 ? '0' : i === 1 ? '-52px' : '-44px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
