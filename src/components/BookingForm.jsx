import React, { useState, useCallback, useEffect } from 'react';
import './BookingForm.css';
import { tutorsBySubject } from '../data/tutors';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Use hardcoded key as fallback for debugging 
const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
const stripeKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || STRIPE_KEY;
console.log("Stripe Key Available:", !!stripeKey, "Key length:", stripeKey ? stripeKey.length : 0);

// For API URL, add a fallback for local development
const LOCAL_TESTING = true; // Toggle this for local testing
const API_URL = LOCAL_TESTING 
  ? 'http://localhost:3001' 
  : 'https://tutorly-booking-automation.onrender.com';

console.log("TESTING MODE:", LOCAL_TESTING ? "LOCAL" : "PRODUCTION");
console.log("Using API URL:", API_URL);

// Initialize Stripe with the public key
const stripePromise = loadStripe(STRIPE_KEY);

// SVG icons as components for the different sections
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ClassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 1 1 3-3h7z"></path>
  </svg>
);

const TimeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const TutorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const PricingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 2H8a2 2 0 00-2 2v3a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"></path>
    <path d="M12 14v4"></path>
    <path d="M9 17.5h6"></path>
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

// Memoize the FormSection component to prevent unnecessary re-renders
const FormSection = React.memo(({ id, title, icon, children }) => (
  <div className="form-section-visible">
    <div className="form-section-title">
      {icon}
      <span>{title}</span>
    </div>
    <div className="form-section-content">
      {children}
    </div>
  </div>
));

// Subject options array
const subjectOptions = [
  { value: "Applied Mathematics for Management", label: "Applied Mathematics for Management" },
  { value: "Descriptive Statistics and Probability", label: "Descriptive Statistics and Probability" },
  { value: "Basics of Financial Accounting", label: "Basics of Financial Accounting" },
  { value: "Advanced Accounting", label: "Advanced Accounting" },
  { value: "Microeconomics", label: "Microeconomics" },
  { value: "Macroeconomics", label: "Macroeconomics" },
  { value: "Business Law", label: "Business Law" },
  { value: "Tax Law", label: "Tax Law" },
  { value: "Managing Digital Information", label: "Managing Digital Information" },
  { value: "Statistical Inference and Data Analysis", label: "Statistical Inference and Data Analysis" },
  { value: "Managerial Economics", label: "Managerial Economics" },
  { value: "Financial Analysis", label: "Financial Analysis" },
  { value: "Financial Economics", label: "Financial Economics" },
  { value: "Information Systems", label: "Information Systems" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" }
];

// Pricing function to calculate costs based on class size and duration
const calculatePrice = (classSize, classDuration) => {
  // Base rates per person per hour
  const rates = {
    'Solo': 25,
    'Duo': 20,
    'Trio': 15,
    'Quadrio': 12.5
  };
  
  // Duration in hours
  const durationMap = {
    '1 hour': 1,
    '1.5 hours': 1.5,
    '2 hours': 2,
    '2.5 hours': 2.5
  };
  
  // Get rate and convert duration to hours
  const ratePerPerson = rates[classSize] || 25; // Default to Solo rate if not found
  const hours = durationMap[classDuration] || 1; // Default to 1 hour if not found
  
  // Calculate number of people based on class size
  const numberOfPeople = {
    'Solo': 1,
    'Duo': 2,
    'Trio': 3,
    'Quadrio': 4
  }[classSize] || 1;
  
  // Calculate total price
  const totalPrice = ratePerPerson * numberOfPeople * hours;
  const pricePerPerson = ratePerPerson * hours;
  
  return {
    pricePerPerson,
    totalPrice,
    numberOfPeople,
    hours
  };
};

// Generate hour and minute options
const generateHourOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const value = hour.toString().padStart(2, '0');
    options.push({ value, label: value });
  }
  return options;
};

const generateMinuteOptions = () => {
  const options = [];
  for (let minute of [0, 15, 30, 45]) {
    const value = minute.toString().padStart(2, '0');
    options.push({ value, label: value });
  }
  return options;
};

const hourOptions = generateHourOptions();
const minuteOptions = generateMinuteOptions();

// Memoize the CheckoutForm component
const CheckoutForm = React.memo(({ handlePaymentSuccess, handlePaymentError, totalPrice }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
      handlePaymentError(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      handlePaymentSuccess(paymentIntent.id);
    } else {
      setErrorMessage('Payment status unclear. Please check your email for confirmation.');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <p className="payment-amount">Total Amount: <strong>€{totalPrice.toFixed(2)}</strong></p>
      </div>
      
      <div className="payment-element-container">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="payment-error">
          <ErrorIcon />
          {errorMessage}
        </div>
      )}
      
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="button-primary payment-button"
      >
        {isProcessing ? (
          <>
            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Processing Payment...
          </>
        ) : (
          "Pay Now"
        )}
      </button>
    </form>
  );
});

const BookingForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    newsletterSignup: false,
    phone: '',
    subjectCategory: '',
    classFormat: '',
    classSize: '',
    classDuration: '',
    preferredTimeHour: '',
    preferredTimeMinute: '',
    preferredTime: '',
    preferredDate: '',
    tutorPreference: '',
    specificTopic: '',
    referralSource: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [priceDetails, setPriceDetails] = useState({
    pricePerPerson: 0,
    totalPrice: 0
  });
  
  // Payment related states
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState({});

  // Update price whenever class size or duration changes
  useEffect(() => {
    if (formData.classSize && formData.classDuration) {
      setPriceDetails(calculatePrice(formData.classSize, formData.classDuration));
    }
  }, [formData.classSize, formData.classDuration]);

  // Memoize the handleChange function to prevent recreation on each render
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Use functional update to ensure we have the latest state
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors with functional update
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [formErrors]); // Only depends on formErrors

  // Memoize the button select handler
  const handleButtonSelect = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]); // Only depends on formErrors

  // Handle time change and combine hours and minutes
  const handleTimeChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      
      // If we have both hour and minute, update the combined time
      if (name === 'preferredTimeHour' && prev.preferredTimeMinute || 
          name === 'preferredTimeMinute' && prev.preferredTimeHour) {
        const hour = name === 'preferredTimeHour' ? value : prev.preferredTimeHour;
        const minute = name === 'preferredTimeMinute' ? value : prev.preferredTimeMinute;
        newFormData.preferredTime = `${hour}:${minute}`;
      }
      
      return newFormData;
    });
    
    // Clear errors
    if (formErrors.preferredTime) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.preferredTime;
        return newErrors;
      });
    }
  }, [formErrors]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 
      'subjectCategory', 'classFormat', 'classSize', 
      'classDuration', 'preferredTime', 'preferredDate', 
      'tutorPreference', 'referralSource'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Add validation for booking at least 24 hours in advance
    if (formData.preferredDate && formData.preferredTime) {
      const selectedDateTime = new Date(
        `${formData.preferredDate}T${formData.preferredTime}:00`
      );
      
      // Calculate 24 hours from now
      const minDateTime = new Date();
      minDateTime.setHours(minDateTime.getHours() + 24);
      
      if (selectedDateTime < minDateTime) {
        errors.preferredDate = 'Bookings must be made at least 24 hours in advance';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate price
      const { totalPrice } = calculatePrice(formData.classSize, formData.classDuration);
      
      console.log("Creating checkout session for amount:", totalPrice.toFixed(2));
      
      // Create a checkout session instead of a payment intent
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice.toFixed(2),
          customerEmail: formData.email,
          bookingData: formData
        })
      });
      
      const result = await response.json();
      console.log("Checkout session response:", result);
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to initialize payment');
      }
      
      // Store the booking data in localStorage before redirecting
      localStorage.setItem('pendingBookingData', JSON.stringify(formData));
      
      // Redirect to Stripe Checkout
      window.location.href = result.url;
      
    } catch (err) {
      console.error('Error initializing payment:', err);
      setError(`An error occurred while setting up payment: ${err.message}. Please try again or contact support.`);
      setLoading(false);
    }
  };
  
  const handlePaymentSuccess = async (paymentId) => {
    try {
      // Save booking data after successful payment - Fix the URL format
      const response = await fetch(`${API_URL}/api/payment-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentId || paymentIntentId,
          bookingData: formData
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save booking data');
      }
      
      // Set payment as successful and show thank you page
      setPaymentSuccess(true);
      setSubmitted(true);
      
    } catch (err) {
      console.error('Error saving booking after payment:', err);
      setError('Payment successful, but there was an issue saving your booking. Please contact us.');
    }
  };
  
  const handlePaymentError = (errorMessage) => {
    setError(`Payment error: ${errorMessage}`);
    setShowPayment(true); // Keep payment form visible to retry
  };

  // Memoized button select component
  const ButtonSelect = useCallback(({ label, required, name, options, value, onChange }) => (
    <div className={`form-field ${formErrors[name] ? 'has-error' : ''}`}>
      {label && <label>{label} {required && <span className="required">*</span>}</label>}
      <div className="button-select-group">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`button-select ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(name, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {formErrors[name] && <div className="error-text">{formErrors[name]}</div>}
    </div>
  ), [formErrors]);

  // Price display component (replacing with Pricing Summary at the bottom)
  const PricingSummary = () => {
    if (!formData.classSize || !formData.classDuration) {
      return null;
    }
    
    return (
      <div className="pricing-summary">
        <h3>
          <PricingIcon />
          Booking Summary
        </h3>
        <div className="pricing-summary-details">
          <div className="pricing-item">
            <div className="pricing-item-label">Class Format</div>
            <div className="pricing-item-value">{formData.classFormat || 'Not selected'}</div>
          </div>
          <div className="pricing-item">
            <div className="pricing-item-label">Class Size</div>
            <div className="pricing-item-value">{formData.classSize || 'Not selected'}</div>
          </div>
          <div className="pricing-item">
            <div className="pricing-item-label">Duration</div>
            <div className="pricing-item-value">{formData.classDuration || 'Not selected'}</div>
          </div>
          <div className="pricing-item">
            <div className="pricing-item-label">Price Per Person</div>
            <div className="pricing-item-value">€{priceDetails.pricePerPerson.toFixed(2)}</div>
          </div>
        </div>
        <div className="pricing-total">
          <div className="pricing-total-label">Total Price</div>
          <div className="pricing-total-value">€{priceDetails.totalPrice.toFixed(2)}</div>
        </div>
        <div className="price-explanation">
          {formData.classSize} class ({priceDetails.numberOfPeople} {priceDetails.numberOfPeople === 1 ? 'person' : 'people'}) 
          for {formData.classDuration} (€{priceDetails.pricePerPerson.toFixed(2)} per person)
        </div>
      </div>
    );
  };

  // Success message
  if (submitted) {
    return (
      <div className="tutorly-container">
        <div className="tutorly-header">
          <h1>Thank You for Your Booking!</h1>
          <p>Your payment was successful and your booking has been confirmed.</p>
        </div>
        <div className="tutorly-form success-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>Booking Confirmed</h2>
          <p>We've received your payment and your booking is now confirmed. You'll receive an email with all the details shortly.</p>
          <div className="booking-details">
            <p><strong>Subject:</strong> {formData.subjectCategory}</p>
            <p><strong>Date:</strong> {formData.preferredDate}</p>
            <p><strong>Time:</strong> {formData.preferredTime}</p>
            <p><strong>Format:</strong> {formData.classFormat}</p>
            <p><strong>Class Size:</strong> {formData.classSize}</p>
            <p><strong>Duration:</strong> {formData.classDuration}</p>
          </div>
          <p className="contact-info">If you have any questions, please contact us at <a href="mailto:info@tutorly.com">info@tutorly.com</a></p>
        </div>
      </div>
    );
  }

  // Replace the time select with TimeSelector component
  const TimeSelector = () => (
    <div className={`form-field ${formErrors.preferredTime ? 'has-error' : ''}`}>
      <label>Time <span className="required">*</span></label>
      <div className="time-selector-container">
        <select
          name="preferredTimeHour"
          value={formData.preferredTimeHour}
          onChange={handleTimeChange}
          required
          className="form-field custom-time-select"
        >
          <option value="">Hour</option>
          {hourOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="time-label">:</div>
        <select
          name="preferredTimeMinute"
          value={formData.preferredTimeMinute}
          onChange={handleTimeChange}
          required
          className="form-field custom-time-select"
        >
          <option value="">Min</option>
          {minuteOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field-hint">24-hour format</div>
      {formErrors.preferredTime && <div className="error-text">{formErrors.preferredTime}</div>}
    </div>
  );

  return (
    <div className="tutorly-container">
      <div className="tutorly-header">
        <h1>Join our Solo, Duo, Trio or Quadrio Classes!</h1>
        <p>Interested in joining our classes? Fill out some information and we will be in touch shortly!</p>
      </div>
      
      <div className="tutorly-form">
        {error && (
          <div className="error-message">
            <ErrorIcon />
            {error}
          </div>
        )}
        {Object.keys(formErrors).length > 0 && (
          <div className="error-message">
            <ErrorIcon />
            <div>Please correct the errors in the form before proceeding.</div>
          </div>
        )}
        
        <div className="form-notice">
          <InfoIcon />
          <div>
            <p>
              Please bear in mind that only one person must fill out the form for any classes you sign up to, 
              whether it is solo, duo or trio classes. We would like to clarify that for duo or trio classes, 
              it is the client's responsibility to come with other people to form the group.
            </p>
            <p>
              <strong>Important:</strong> Classes should be booked at least 24 hours in advance and payment 
              must be done 10 hours before the class takes place.
            </p>
            <p>
              Join our WhatsApp group to connect with other students interested in duo, trio or quadrio classes! 
              If you're looking for study partners, this group makes it easy to find classmates and team up for sessions together.
            </p>
            <div className="whatsapp-link">
              <a href="https://chat.whatsapp.com/CW4ZZf0AIqXEbOHarXvP8A" className="button-whatsapp">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20"  viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Whatsapp Group Link
              </a>
            </div>
          </div>
        </div>
        
        {!showPayment ? (
          <form onSubmit={handleSubmit} noValidate>
            {/* Personal Information Section */}
            <FormSection 
              id="personal" 
              title="Personal Information" 
              icon={<PersonIcon />}
            >
              <div className="form-field-group">
                <label>Name <span className="required">*</span></label>
                <div className="form-grid">
                  <div className={`form-field ${formErrors.firstName ? 'has-error' : ''}`}>
                    <input 
                      type="text" 
                      name="firstName" 
                      placeholder="First Name" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      required 
                      className="material-input"
                    />
                    {formErrors.firstName && <div className="error-text">{formErrors.firstName}</div>}
                  </div>
                  <div className={`form-field ${formErrors.lastName ? 'has-error' : ''}`}>
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder="Last Name" 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      required 
                      className="material-input"
                    />
                    {formErrors.lastName && <div className="error-text">{formErrors.lastName}</div>}
                  </div>
                </div>
              </div>
              
              <div className={`form-field ${formErrors.email ? 'has-error' : ''}`}>
                <label>Email <span className="required">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="material-input"
                />
                {formErrors.email && <div className="error-text">{formErrors.email}</div>}
              </div>
              
              <div className="form-field checkbox-field">
                <label>
                  <input 
                    type="checkbox" 
                    name="newsletterSignup" 
                    checked={formData.newsletterSignup} 
                    onChange={handleChange} 
                  />
                  Sign up for news and updates
                </label>
              </div>
              
              <div className={`form-field ${formErrors.phone ? 'has-error' : ''}`}>
                <label>Phone number (include prefix, example: 34### ...) <span className="required">*</span></label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                  className="material-input"
                />
                {formErrors.phone && <div className="error-text">{formErrors.phone}</div>}
              </div>
            </FormSection>
            
            {/* Class Details Section */}
            <FormSection 
              id="class" 
              title="Class Details" 
              icon={<ClassIcon />}
            >
             

              <div className={`form-field ${formErrors.subjectCategory ? 'has-error' : ''}`}>
                <label>Which subject are you interested in? <span className="required">*</span></label>
                <select 
                  name="subjectCategory" 
                  value={formData.subjectCategory} 
                  onChange={handleChange} 
                  required
                  className="material-select"
                >
                  <option value="">Select an option</option>
                  {subjectOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {formErrors.subjectCategory && <div className="error-text">{formErrors.subjectCategory}</div>}
              </div>
              
              <div className="form-field">
                <label>In the subject you have chosen, what topic would you like to cover? (optional)</label>
                <textarea 
                  name="specificTopic" 
                  value={formData.specificTopic} 
                  onChange={handleChange} 
                  placeholder="Describe the specific topics you'd like to learn in detail."
                  className="material-textarea"
                  rows={6}
                />
              </div>
              
              <div className="form-section-grid format-section">
                {/* Class format as 2x1 grid */}
                <div className="form-field-grid">
                  <label>Class format <span className="required">*</span></label>
                  <div className="grid-2x2">
                    {[
                      { value: "Online", label: "Online" },
                      { value: "In-Person", label: "In-Person" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`grid-button ${formData.classFormat === option.value ? 'selected' : ''}`}
                        onClick={() => handleButtonSelect('classFormat', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formErrors.classFormat && <div className="error-text">{formErrors.classFormat}</div>}
                </div>
              </div>
              
              <div className="form-section-grid">
                {/* Class size as 2x2 grid */}
                <div className="form-field-grid">
                  <label>Size of class <span className="required">*</span></label>
                  <div className="grid-2x2">
                    {[
                      { value: "Solo", label: "Solo" },
                      { value: "Duo", label: "Duo" },
                      { value: "Trio", label: "Trio" },
                      { value: "Quadrio", label: "Quadrio" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`grid-button ${formData.classSize === option.value ? 'selected' : ''}`}
                        onClick={() => handleButtonSelect('classSize', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formErrors.classSize && <div className="error-text">{formErrors.classSize}</div>}
                </div>

                {/* Class duration as 2x2 grid */}
                <div className="form-field-grid">
                  <label>Class duration <span className="required">*</span></label>
                  <div className="grid-2x2">
                    {[
                      { value: "1 hour", label: "1 hour" },
                      { value: "1.5 hours", label: "1.5 hours" },
                      { value: "2 hours", label: "2 hours" },
                      { value: "2.5 hours", label: "2.5 hours" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`grid-button ${formData.classDuration === option.value ? 'selected' : ''}`}
                        onClick={() => handleButtonSelect('classDuration', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formErrors.classDuration && <div className="error-text">{formErrors.classDuration}</div>}
                </div>
              </div>
            </FormSection>
            
            {/* Schedule Section */}
            <FormSection 
              id="schedule" 
              title="Schedule" 
              icon={<TimeIcon />}
            >
              <div className="form-grid">
                <TimeSelector />
                
                <div className={`form-field ${formErrors.preferredDate ? 'has-error' : ''}`}>
                  <label>Date <span className="required">*</span></label>
                  <input 
                    type="date" 
                    name="preferredDate" 
                    value={formData.preferredDate} 
                    onChange={handleChange} 
                    required 
                    className="material-input"
                  />
                  <div className="field-hint">Must be at least 24 hours in advance</div>
                  {formErrors.preferredDate && <div className="error-text">{formErrors.preferredDate}</div>}
                </div>
              </div>
            </FormSection>
            
            {/* Preferences Section */}
            <FormSection 
              id="preferences" 
              title="Preferences & Additional Info" 
              icon={<TutorIcon />}
            >
              <div className={`form-field ${formErrors.tutorPreference ? 'has-error' : ''}`}>
                <label>Do you have any tutor preferences? <span className="required">*</span></label>
                <select 
                  name="tutorPreference" 
                  value={formData.tutorPreference} 
                  onChange={handleChange} 
                  required
                  className="material-select"
                >
                  <option value="">Select an option</option>
                  <option value="No preference">No preference</option>
                  {formData.subjectCategory && tutorsBySubject[formData.subjectCategory]?.map(tutor => (
                    <option key={tutor.email} value={tutor.name}>{tutor.name}</option>
                  ))}
                </select>
                {formErrors.tutorPreference && <div className="error-text">{formErrors.tutorPreference}</div>}
              </div>
              
              <div className={`form-field ${formErrors.referralSource ? 'has-error' : ''}`}>
                <label>How did you hear about us? <span className="required">*</span></label>
                <select 
                  name="referralSource" 
                  value={formData.referralSource} 
                  onChange={handleChange} 
                  required
                  className="material-select"
                >
                  <option value="">Select an option</option>
                  <option value="Google">Google</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Friend">Friend</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.referralSource && <div className="error-text">{formErrors.referralSource}</div>}
              </div>
            </FormSection>

            <PricingSummary />

            <div className="form-submit">
              <button 
                className="button-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div id="payment-section" className="payment-section">
            <h2>Payment Information</h2>
            <p className="payment-instruction">Please complete your payment to finalize your booking.</p>
            
            {clientSecret ? (
              stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret, ...paymentOptions }}>
                  <CheckoutForm 
                    handlePaymentSuccess={handlePaymentSuccess}
                    handlePaymentError={handlePaymentError}
                    totalPrice={priceDetails.totalPrice}
                  />
                </Elements>
              ) : (
                <div className="payment-error">
                  <ErrorIcon />
                  <div>
                    <p>Unable to initialize payment system. Please refresh the page or try again later.</p>
                    <p>If the problem persists, please contact us at <a href="mailto:info@tutorly.com">info@tutorly.com</a></p>
                    <p><small>Technical Info: Stripe SDK initialization failed</small></p>
                  </div>
                </div>
              )
            ) : (
              <div className="payment-processing">
                <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                <span>Preparing payment form...</span>
              </div>
            )}
            
            <button 
              onClick={() => setShowPayment(false)} 
              className="button-secondary back-button"
            >
              Back to Form
            </button>
          </div>
        )}
      </div>
      <div className="tutorly-footer">
        <p>&copy; {new Date().getFullYear()} Tutorly. All rights reserved.</p>
      </div>
    </div>
  );
};

export default BookingForm;
