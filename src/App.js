import React from 'react';
import './App.css';
import BookingForm from './components/BookingForm';
import BookingSuccess from './components/BookingSuccess';
import UniversitySelector from './components/UniversitySelector';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UniversityProvider } from './contexts/UniversityContext';

// Component to wrap university-specific routes with provider
const UniversityRoutes = ({ children }) => {
  return (
    <UniversityProvider>
      {children}
    </UniversityProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* University selector landing page */}
        <Route path="/" element={<UniversitySelector />} />
        
        {/* University-specific booking routes */}
        <Route path="/:university" element={
          <UniversityRoutes>
            <BookingForm />
          </UniversityRoutes>
        } />
        <Route path="/:university/booking-success" element={
          <UniversityRoutes>
            <BookingSuccess />
          </UniversityRoutes>
        } />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/booking-form" element={<Navigate to="/esade" replace />} />
        <Route path="/booking-success" element={<Navigate to="/esade/booking-success" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;