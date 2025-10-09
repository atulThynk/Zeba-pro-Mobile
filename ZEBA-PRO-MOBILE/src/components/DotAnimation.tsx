const DotAnimation = () => {
    return (
        <>
            <div className="cs-loader">
                <div className="cs-loader-inner">
                    <label>●</label>
                    <label>●</label>
                    <label>●</label>
                    <label>●</label>
                    <label>●</label>
                    <label>●</label>
                </div>
            </div>
            <style>{`
 
        .cs-loader {
          display: flex;
          margin: auto;
          width: 8em;
          height: 2em;
        }
 
        .cs-loader-inner {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
 
        .cs-loader-inner label {
          font-size: 0.6em;
          margin: 0 0.25em;
          color: var(--fg);
          animation: dot 1.5s ease-in-out infinite;
        }
 
        .cs-loader-inner label:nth-child(1) {
          animation-delay: 0s;
        }
        .cs-loader-inner label:nth-child(2) {
          animation-delay: 0.1s;
        }
        .cs-loader-inner label:nth-child(3) {
          animation-delay: 0.2s;
        }
        .cs-loader-inner label:nth-child(4) {
          animation-delay: 0.3s;
        }
        .cs-loader-inner label:nth-child(5) {
          animation-delay: 0.4s;
        }
        .cs-loader-inner label:nth-child(6) {
          animation-delay: 0.5s;
        }
 
        /* Dark theme */
        @media (prefers-color-scheme: dark) {
          :root {
            --bg:#D1E4FE;
            --fg:#D1E4FE;
          }
        }
 
        /* Animation for dots */
        @keyframes dot {
          0%,
          20% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-0.5em);
            opacity: 0.5;
          }
          60% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
        </>
    );
};
 
export default DotAnimation;