import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUniversitySlugs, getUniversityConfig } from '../config/universities';
import './UniversitySelector.css';

const UniversitySelector = () => {
  const navigate = useNavigate();
  const universitySlugs = getAllUniversitySlugs();
  
  const handleUniversitySelect = (universitySlug) => {
    navigate(`/${universitySlug}`);
  };

  const getUniversityLogo = (slug) => {
    if (slug === 'lycee') {
      return '/lyceeLogo.png';
    } else if (slug === 'esade') {
      return '/esadeLogo.png';
    }
    return `https://via.placeholder.com/115x73/${slug === 'lycee' ? 'C6007E' : '000C40'}/FFFFFF?text=${slug === 'lycee' ? 'LFB' : 'ESADE'}`;
  };

  return (
    <section className="university-selector-page">
      {/* Desktop/Tablet Layout */}
      <div className="selector-card">
        
        
        
        <div className="selector-content-wrapper">
          <div className="selector-text-section">
            
            
            <div className="university-cards">
              {universitySlugs.map((slug) => {
                const university = getUniversityConfig(slug);
                return (
                  <div key={slug} className="university-selection-card">
                    <div className="university-logo">
                      <img 
                        src={getUniversityLogo(slug)}
                        alt={`${university.name} logo`}
                        className="logo-img"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/115x73/${slug === 'lycee' ? 'C6007E' : '000C40'}/FFFFFF?text=${slug === 'lycee' ? 'LFB' : 'ESADE'}`;
                        }}
                      />
                    </div>
                    
                    <h3 className="university-name">
                      {university.name}
                    </h3>
                    
                    <button
                      className="university-continue-btn"
                      onClick={() => handleUniversitySelect(slug)}
                    >
                      Continue
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="mobile-selector-container">
        {/* Header background */}
        <div className="mobile-selector-header">
          <div className="mobile-selector-bg-image"></div>
          <div className="mobile-selector-gradient"></div>
        </div>

        {/* Circular background element */}
        <div className="mobile-selector-circle"></div>
        
        {/* Bottom ellipse cutting into image */}
        <div className="mobile-selector-bottom-ellipse"></div>

        


      </div>
    </section>
  );
};

export default UniversitySelector;