import React from 'react';
import './App.css';
import BookingForm from './components/BookingForm';
import BookingSuccess from './components/BookingSuccess';
// Fix the import
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/booking-form" element={<BookingForm />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        {/* ...other routes... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;