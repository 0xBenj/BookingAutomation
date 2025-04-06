import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import './BookingForm.css';

const BookingSuccess = () => {
  const [bookingData, setBookingData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({ status: 'loading', message: 'Verifying your payment...' });
  const location = useLocation();
  
  useEffect(() => {
    // Get session ID from URL params
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');
    
    // Retrieve booking data from localStorage
    const savedData = localStorage.getItem('pendingBookingData');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setBookingData(parsedData);
        
        // Only clear after successful processing
        if (sessionId) {
          // Keep the data until we've processed it
          console.log('Retrieved pending booking data from localStorage');
        }
      } catch (error) {
        console.error('Error parsing saved booking data:', error);
        setVerificationStatus({
          status: 'error',
          message: 'There was an error processing your booking information. Please contact support.'
        });
      }
    } else {
      console.warn('No pending booking data found in localStorage');
    }
    
    // Call your server to verify the payment was successful and process the booking
    if (sessionId) {
      const processCheckoutSession = async () => {
        try {
          // Use hardcoded fallback for local development
          const API_URL = 'http://localhost:3001';
          
          console.log('Verifying and processing session:', sessionId);
          setVerificationStatus({
            status: 'loading',
            message: 'Processing your booking...'
          });
          
          // First verify the session
          const verifyResponse = await fetch(`${API_URL}/api/verify-session?session_id=${sessionId}`);
          
          // Check if the response is JSON
          const contentType = verifyResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Server returned non-JSON response: ${await verifyResponse.text()}`);
          }
          
          const verifyData = await verifyResponse.json();
          
          if (!verifyResponse.ok) {
            throw new Error(verifyData.error || 'Failed to verify payment');
          }
          
          if (!verifyData.paid) {
            throw new Error('Payment was not completed successfully');
          }
          
          // Check if the booking was already processed
          if (verifyData.alreadyProcessed) {
            console.log('Booking was already processed, just showing success');
            setVerificationStatus({
              status: 'success',
              message: 'Your booking has been confirmed!'
            });
            // Still clear localStorage to avoid confusion
            localStorage.removeItem('pendingBookingData');
            return;
          }
          
          console.log('Payment verified successfully, processing booking...');
          
          // Then explicitly trigger booking processing if we have booking data
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            //  the booking data to be processed
            const processResponse = await fetch(`${API_URL}/api/process-checkout-booking`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                sessionId: sessionId,
                bookingData: parsedData
              })
            });
            
            // Check if the response is JSON
            const processContentType = processResponse.headers.get("content-type");
            if (!processContentType || !processContentType.includes("application/json")) {
              throw new Error(`Server returned non-JSON response: ${await processResponse.text()}`);
            }
            
            const processResult = await processResponse.json();
            
            if (!processResponse.ok) {
              throw new Error(processResult.error || 'Failed to process booking');
            }
            
            console.log('Booking processed successfully:', processResult);
            setVerificationStatus({
              status: 'success',
              message: 'Your booking has been confirmed!'
            });
            
            // Now that we've successfully processed it, clear from localStorage
            localStorage.removeItem('pendingBookingData');
          } else {
            console.warn('No booking data available to process');
            setVerificationStatus({
              status: 'warning',
              message: 'Payment successful, but booking details were not found. Our team will contact you to confirm your booking.'
            });
          }
        } catch (error) {
          console.error('Error processing checkout session:', error);
          setVerificationStatus({
            status: 'error',
            message: `Error: ${error.message || 'Failed to process your booking. Please contact support.'}`
          });
        }
      };
      
      processCheckoutSession();
    } else {
      setVerificationStatus({
        status: 'error',
        message: 'No session ID was provided. Unable to verify your payment.'
      });
    }
  }, [location]);

  return (
    <div className="tutorly-container">
      <div className="tutorly-header">
        <h1>Thank You for Your Booking!</h1>
        <p>Your payment was successful and your booking is being processed.</p>
      </div>
      <div className="tutorly-form success-message">
        {verificationStatus.status === 'loading' && (
          <div className="processing-indicator">
            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            <p>{verificationStatus.message}</p>
          </div>
        )}
        
        {verificationStatus.status === 'success' && (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2>Booking Confirmed</h2>
            <p>We've received your payment and your booking has been confirmed. You'll receive an email with all the details shortly.</p>
          </>
        )}
        
        {verificationStatus.status === 'error' && (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2>Something Went Wrong</h2>
            <p>{verificationStatus.message}</p>
            <p>Please contact our support team with your session ID for assistance.</p>
            <div className="fallback-action">
              <p>It seems there was an issue connecting to our server. However, your payment has likely been processed successfully.</p>
              <p>As a fallback, we'll try to process your booking now:</p>
              <button 
                className="button-primary" 
                onClick={() => {
                  if (bookingData) {
                    // Save the booking info to our email as a backup
                    const emailSubject = `FALLBACK BOOKING: ${bookingData.firstName} ${bookingData.lastName}`;
                    const emailBody = `A booking was made but automatic processing failed. Please process manually:\n\n${JSON.stringify(bookingData, null, 2)}`;
                    window.location.href = `mailto:info@tutorly.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                  }
                }}
              >
                Email Booking Details to Support
              </button>
            </div>
          </>
        )}
        
        {verificationStatus.status === 'warning' && (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f6ad55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h2>Payment Successful</h2>
            <p>{verificationStatus.message}</p>
          </>
        )}
        
        {bookingData && (
          <div className="booking-details">
            <p><strong>Subject:</strong> {bookingData.subjectCategory}</p>
            <p><strong>Date:</strong> {bookingData.preferredDate}</p>
            <p><strong>Time:</strong> {bookingData.preferredTime}</p>
            <p><strong>Format:</strong> {bookingData.classFormat}</p>
            <p><strong>Class Size:</strong> {bookingData.classSize}</p>
            <p><strong>Duration:</strong> {bookingData.classDuration}</p>
          </div>
        )}
        
        <p className="contact-info">If you have any questions, please contact us at <a href="mailto:info@tutorly.com">info@tutorly.com</a></p>
        
        <div className="success-actions">
          <Link to="/" className="button-secondary">Return to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
