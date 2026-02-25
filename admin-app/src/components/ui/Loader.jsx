import './ui.css';

/**
 * Modern Loader Component
 * Elegant spinning loader with Mapuan colors
 */
export const Loader = ({ size = 'md', fullscreen = false }) => {
  return (
    <div className={`loader-container ${fullscreen ? 'loader-fullscreen' : ''}`}>
      <div className={`loader loader-${size}`}>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
      </div>
    </div>
  );
};

export default Loader;
