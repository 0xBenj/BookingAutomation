import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUniversityConfig, isValidUniversitySlug } from '../config/universities';
import { tutorsBySubject } from '../data/tutors';

// Create the context
const UniversityContext = createContext();

// Custom hook to use the university context
export const useUniversity = () => {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within a UniversityProvider');
  }
  return context;
};

// Provider component
export const UniversityProvider = ({ children }) => {
  const { university } = useParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUniversityConfig = () => {
      setLoading(true);
      setError(null);

      // Check if the university slug is valid
      if (!university || !isValidUniversitySlug(university)) {
        setError(`Invalid university: ${university}`);
        setConfig(null);
        setLoading(false);
        return;
      }

      // Get the university configuration
      const universityConfig = getUniversityConfig(university);
      
      if (!universityConfig) {
        setError(`University configuration not found: ${university}`);
        setConfig(null);
        setLoading(false);
        return;
      }

      // For ESADE, merge with existing tutors data
      if (university === 'esade') {
        universityConfig.tutors = tutorsBySubject;
      }

      setConfig(universityConfig);
      setLoading(false);

      // Apply CSS custom properties for theming
      if (universityConfig.theme) {
        const root = document.documentElement;
        root.style.setProperty('--university-primary', universityConfig.theme.primary);
        root.style.setProperty('--university-secondary', universityConfig.theme.secondary);
        root.style.setProperty('--university-gradient', universityConfig.theme.gradient);
      }
    };

    loadUniversityConfig();
  }, [university]);

  // Helper function to get tutors for a subject
  const getTutorsForSubject = (subject) => {
    if (!config || !config.tutors) return [];
    
    if (university === 'esade') {
      // Use the existing tutorsBySubject structure for ESADE
      return config.tutors[subject] || [];
    } else {
      // Use the simple structure for other universities
      return config.tutors[subject] || [];
    }
  };

  // Helper function to get all subjects for the university
  const getSubjects = () => {
    return config?.subjects || [];
  };

  const value = {
    university,
    config,
    loading,
    error,
    getTutorsForSubject,
    getSubjects,
    isValidUniversity: !error && config !== null
  };

  return (
    <UniversityContext.Provider value={value}>
      {children}
    </UniversityContext.Provider>
  );
};

export default UniversityContext;