require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path'); // Add path module

// Debug Stripe key availability
console.log('Stripe key available:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe key length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Add Stripe

//===================================================================
// MODULE IMPORTS AND INITIALIZATION
//===================================================================
const sheetsModule = require('./services/sheets');
const calendarModule = require('./services/calendar');
const tutorsModule = require('./tutors');
const mailerModule = require('./services/mailer');

// Verify exports are available
console.log('Imported sheets module exports:', Object.keys(sheetsModule));
console.log('Imported calendar module exports:', Object.keys(calendarModule));
console.log('Imported tutors module exports:', Object.keys(tutorsModule));
console.log('Imported mailer module exports:', Object.keys(mailerModule));

// Log the path to tutors module to verify it's correct
console.log('Tutors module path:', path.join(__dirname, '../src/data/tutors'));

const app = express();
const PORT = process.env.PORT || 3001;

// Add body parser middleware before the routes
app.use(express.json());

// Middleware
// Enhance CORS for development - make sure it accepts local connections
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow local frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Utility function to parse phone numbers and extract only digits
 * @param {string} phone - Raw phone number input
 * @returns {string} Phone number with only digits
 */
function parsePhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

// Add a map to track in-progress bookings
const processingBookings = new Map();

//===================================================================
// BOOKING API ENDPOINT
// Handles incoming booking requests, processes them, and saves to 
// Google Sheets and Calendar
//===================================================================
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('Received booking request:', req.body);
    
    // Verify the required functions exist
    if (typeof sheetsModule.addBooking !== 'function') {
      console.error('addBooking is not a function:', sheetsModule.addBooking);
      throw new Error('addBooking function is not properly defined');
    }
    
    if (typeof calendarModule.createCalendarEvent !== 'function') {
      console.error('createCalendarEvent is not a function:', calendarModule.createCalendarEvent);
      throw new Error('createCalendarEvent function is not properly defined');
    }
    
    // Add timestamp and default status if not provided
    const bookingData = {
      ...req.body,
      timestamp: new Date().toISOString(),
      status: req.body.status || 'Pending'
    };

    // Parse phone number to contain only digits
    if (bookingData.phone) {
      bookingData.phone = parsePhoneNumber(bookingData.phone);
    }

    // Ensure price is included in the bookingData
    if (!bookingData.price) {
      // Calculate default price if not provided
      const classSizeRates = {
        'Solo': 25,
        'Duo': 20,
        'Trio': 15,
        'Quadrio': 12.5
      };
      
      const durationHours = {
        '1 hour': 1,
        '1.5 hours': 1.5,
        '2 hours': 2,
        '2.5 hours': 2.5
      };
      
      const ratePerPerson = classSizeRates[bookingData.classSize] || 25;
      const hours = durationHours[bookingData.classDuration] || 1;
      const people = {
        'Solo': 1,
        'Duo': 2,
        'Trio': 3,
        'Quadrio': 4
      }[bookingData.classSize] || 1;
      
      bookingData.price = (ratePerPerson * people * hours).toFixed(2);
    }

    // Perform both operations
    const [sheetResult, calendarResult] = await Promise.all([
      sheetsModule.addBooking(bookingData),
      calendarModule.createCalendarEvent(bookingData)
    ]);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        sheetEntry: sheetResult,
        calendarEvent: calendarResult,
        price: bookingData.price
      }
    });
  } catch (error) {
    console.error('Server error processing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
      details: {
        stack: error.stack
      }
    });
  }
});

//===================================================================
// STRIPE PAYMENT ENDPOINTS
// Handles creating payment intents and processing payments
//===================================================================

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    console.log('Received payment intent request:', req.body);
    const { amount, bookingData, customerEmail } = req.body;
    
    if (!amount) {
      throw new Error('Amount is required');
    }
    
    // Store booking data in metadata for retrieval later
    const compressedBookingData = {
      name: `${bookingData.firstName} ${bookingData.lastName}`,
      email: bookingData.email,
      phone: parsePhoneNumber(bookingData.phone),
      subject: bookingData.subjectCategory,
      classDetails: `${bookingData.classFormat} - ${bookingData.classSize} - ${bookingData.classDuration}`,
      dateTime: `${bookingData.preferredDate} at ${bookingData.preferredTime}`,
      tutor: bookingData.tutorPreference
    };

    console.log('Creating payment intent with amount:', Math.round(parseFloat(amount) * 100));
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: customerEmail,
      metadata: {
        bookingInfo: JSON.stringify(compressedBookingData)
      }
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    console.error('Error type:', error.type);
    if (error.raw) {
      console.error('Stripe error details:', error.raw);
    }
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'unknown'
    });
  }
});

// Endpoint to handle successful payments and save booking data
app.post('/api/payment-success', async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successfully completed');
    }
    
    // Parse phone number
    if (bookingData.phone) {
      bookingData.phone = parsePhoneNumber(bookingData.phone);
    }
    
    // Add payment info and set status to paid
    const completeBookingData = {
      ...bookingData,
      paymentId: paymentIntentId,
      paymentStatus: 'Paid',
      status: 'Confirmed'
    };
    
    // Save to sheets and calendar
    const [sheetResult, calendarResult] = await Promise.all([
      sheetsModule.addBooking(completeBookingData),
      calendarModule.createCalendarEvent(completeBookingData)
    ]);
    
    // Send confirmation email to student
    try {
      // Check if the mailer module has the required function
      if (bookingData.email && typeof mailerModule.sendStudentBookingConfirmation === 'function') {
        console.log('Using mailer module to send confirmation email to student');
        await mailerModule.sendStudentBookingConfirmation(
          bookingData.email,
          completeBookingData,
          calendarResult
        );
        
        console.log(`Confirmation email sent to student: ${bookingData.email}`);
      } else {
        // Fallback to direct email if module function is not available
        console.log('Mailer module function not available. Using fallback method...');
        console.log('Available mailer functions:', Object.keys(mailerModule));
        
        // Create a one-time transporter
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        // Format date and time
        const startDateTime = new Date(calendarResult.start.dateTime);
        const formattedDate = startDateTime.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'Europe/Madrid'
        });
        const formattedTime = startDateTime.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Madrid'
        });

        // Send basic confirmation email
        await transporter.sendMail({
          from: `"Tutorly Booking" <${process.env.EMAIL_USER}>`,
          to: bookingData.email,
          subject: `Booking Confirmation: ${bookingData.subjectCategory} Tutoring Session`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
              <h2>Thank You for Your Booking</h2>
              <p>Dear ${bookingData.firstName},</p>
              <p>Your tutoring session has been confirmed for ${formattedDate} at ${formattedTime}.</p>
              <p>Subject: ${bookingData.subjectCategory}</p>
              <p>Duration: ${bookingData.classDuration}</p>
              <p>A tutor will contact you shortly.</p>
            </div>
          `
        });
        
        console.log(`Fallback confirmation email sent to student: ${bookingData.email}`);
      }
    } catch (emailError) {
      console.error('Error sending student confirmation email:', emailError);
      // Continue even if email fails - we don't want to fail the booking
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Booking saved successfully',
      data: {
        sheetEntry: sheetResult,
        calendarEvent: calendarResult
      }
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//===================================================================
// STRIPE PAYMENT ENDPOINTS
// Handles creating checkout sessions and processing payments
//===================================================================

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Received checkout session request:', req.body);
    const { amount, bookingData, customerEmail } = req.body;
    
    if (!amount) {
      throw new Error('Amount is required');
    }
    
    // Validate booking is at least 24 hours in advance
    if (bookingData.preferredDate && bookingData.preferredTime) {
      const selectedDateTime = new Date(
        `${bookingData.preferredDate}T${bookingData.preferredTime}:00`
      );
      
      // Calculate 24 hours from now
      const minDateTime = new Date();
      minDateTime.setHours(minDateTime.getHours() + 24);
      
      if (selectedDateTime < minDateTime) {
        throw new Error('Bookings must be made at least 24 hours in advance');
      }
    }
    
    // Store booking data in metadata for retrieval later
    const compressedBookingData = {
      name: `${bookingData.firstName} ${bookingData.lastName}`,
      email: bookingData.email,
      phone: parsePhoneNumber(bookingData.phone),
      subject: bookingData.subjectCategory,
      classDetails: `${bookingData.classFormat} - ${bookingData.classSize} - ${bookingData.classDuration}`,
      dateTime: `${bookingData.preferredDate} at ${bookingData.preferredTime}`,
      tutor: bookingData.tutorPreference
    };

    // Get the domain for success and cancel URLs
    const domain = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${bookingData.classSize} ${bookingData.subjectCategory} Tutoring Session`,
              description: `${bookingData.classDuration} on ${bookingData.preferredDate} at ${bookingData.preferredTime}`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        bookingInfo: JSON.stringify(compressedBookingData),
        bookingSource: 'tutorly-online-form'
      },
      mode: 'payment',
      success_url: `${domain}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/booking-form`,
    });

    console.log('Checkout session created successfully:', session.id);
    res.status(200).json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    console.error('Error type:', error.type);
    if (error.raw) {
      console.error('Stripe error details:', error.raw);
    }
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'unknown'
    });
  }
});

// This line should be BEFORE any other routes or middleware that parses JSON
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Log the webhook request for debugging
    console.log('Received webhook:', {
      headers: req.headers['stripe-signature'] ? 'Signature present' : 'No signature',
      bodyLength: req.body ? req.body.length : 0
    });
    
    // Verify the webhook signature
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).send('Webhook secret not configured');
    }
    
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    console.log('Webhook event type:', event.type);
    
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Processing checkout.session.completed event:', session.id);
    
    try {
      // Create a unique process ID for this session
      const processId = `webhook_${session.id}`;
      
      // Check if this session is already being processed
      if (processingBookings.has(processId)) {
        console.log('Session already being processed in webhook, preventing duplicate processing');
        return res.status(200).json({received: true, message: 'Already processing'});
      }
      
      // Set processing lock
      processingBookings.set(processId, new Date().toISOString());
      
      // Check if this session has already been processed
      if (session.metadata?.processed === 'true') {
        processingBookings.delete(processId); // Release lock
        console.log('Session already processed in webhook, skipping duplicate processing');
        return res.status(200).json({received: true, message: 'Already processed'});
      }
      
      // Get the booking data from session metadata
      if (!session.metadata || !session.metadata.bookingInfo) {
        console.error('No booking info found in session metadata');
        return res.status(200).json({received: true, warning: 'No booking data found'});
      }
      
      // Mark session as being processed to prevent duplicates
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...session.metadata,
          processed: 'true',
          processedBy: 'webhook',
          processedTimestamp: new Date().toISOString()
        }
      });
      
      const bookingInfo = JSON.parse(session.metadata.bookingInfo);
      
      // Create a complete booking data object
      const completeBookingData = {
        firstName: bookingInfo.name.split(' ')[0],
        lastName: bookingInfo.name.split(' ').slice(1).join(' '),
        email: bookingInfo.email || session.customer_email,
        phone: bookingInfo.phone,
        subjectCategory: bookingInfo.subject,
        classFormat: bookingInfo.classDetails.split(' - ')[0],
        classSize: bookingInfo.classDetails.split(' - ')[1],
        classDuration: bookingInfo.classDetails.split(' - ')[2],
        preferredDate: bookingInfo.dateTime.split(' at ')[0],
        preferredTime: bookingInfo.dateTime.split(' at ')[1],
        tutorPreference: bookingInfo.tutor,
        paymentId: session.payment_intent,
        paymentStatus: 'Paid',
        status: 'Confirmed',
        timestamp: new Date().toISOString(),
      };
      
      // Single log for booking data (removed redundant log)
      console.log('Processing webhook booking:', {
        name: `${completeBookingData.firstName} ${completeBookingData.lastName}`,
        email: completeBookingData.email,
        subject: completeBookingData.subjectCategory
      });
      
      // Save to sheets and calendar with better error handling
      try {
        // Verify modules exist before calling them
        if (typeof sheetsModule.addBooking !== 'function') {
          throw new Error('sheetsModule.addBooking is not a function');
        }
        
        if (typeof calendarModule.createCalendarEvent !== 'function') {
          throw new Error('calendarModule.createCalendarEvent is not a function');
        }
        
        // Run operations sequentially for better error handling
        const sheetResult = await sheetsModule.addBooking(completeBookingData);
        console.log('Booking saved to sheet:', sheetResult ? 'Success' : 'Failed');
        
        const calendarResult = await calendarModule.createCalendarEvent(completeBookingData);
        console.log('Calendar event created:', calendarResult.id || 'Failed');
        
        // Send confirmation email to student
        if (typeof mailerModule.sendStudentBookingConfirmation === 'function') {
          console.log('Sending confirmation email to:', completeBookingData.email);
          await mailerModule.sendStudentBookingConfirmation(
            completeBookingData.email,
            completeBookingData,
            calendarResult
          );
          console.log('Confirmation email sent successfully');
        } else {
          console.error('mailerModule.sendStudentBookingConfirmation is not a function');
          // Send a fallback email
          await sendFallbackConfirmationEmail(completeBookingData, calendarResult);
        }
        
        console.log('Webhook booking processing completed successfully');
      } catch (processingError) {
        console.error('Error processing booking after checkout:', processingError);
        // Send admin alert email about processing failure
        sendAdminAlertEmail('Booking Processing Error', processingError, completeBookingData);
      }
      
      // Release the lock when done
      processingBookings.delete(processId);
    } catch (parseError) {
      // Release any lock if error occurs
      if (session && session.id) {
        processingBookings.delete(`webhook_${session.id}`);
      }
      console.error('Error parsing booking data from session:', parseError);
      sendAdminAlertEmail('Webhook Parsing Error', parseError, session);
    }
  }

  // Always return a 200 response to acknowledge receipt of the webhook
  res.status(200).json({received: true});
});

/**
 * Send a fallback confirmation email when the mailer module function is unavailable
 * @param {Object} bookingData - Complete booking data
 * @param {Object} calendarResult - Calendar event data
 */
async function sendFallbackConfirmationEmail(bookingData, calendarResult) {
  try {
    // Create a one-time transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Format date and time - explicitly use Spanish timezone
    const startDateTime = new Date(calendarResult.start.dateTime);
    
    const formattedDate = startDateTime.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Europe/Madrid'
    });
    
    const formattedTime = startDateTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });

    // Send basic confirmation email
    await transporter.sendMail({
      from: `"Tutorly Booking" <${process.env.EMAIL_USER}>`,
      to: bookingData.email,
      subject: `Booking Confirmation: ${bookingData.subjectCategory} Tutoring Session`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <h2>Thank You for Your Booking</h2>
          <p>Dear ${bookingData.firstName},</p>
          <p>Your tutoring session has been confirmed for ${formattedDate} at ${formattedTime} (Spanish Time).</p>
          <p>Subject: ${bookingData.subjectCategory}</p>
          <p>Duration: ${bookingData.classDuration}</p>
          <p>A tutor will contact you shortly.</p>
          <p>Payment has been confirmed. Your session is now reserved.</p>
        </div>
      `
    });
    
    console.log(`Fallback confirmation email sent to student: ${bookingData.email}`);
  } catch (emailError) {
    console.error('Error sending fallback confirmation email:', emailError);
  }
}

/**
 * Send alert to admin when errors occur in the webhook processing
 * @param {string} subject - Email subject
 * @param {Error} error - Error object
 * @param {Object} data - Related data for debugging
 */
async function sendAdminAlertEmail(subject, error, data) {
  try {
    // Create a one-time transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Send alert email
    await transporter.sendMail({
      from: `"Tutorly System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `ALERT: ${subject}`,
      html: `
        <div style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ff0000; background-color: #fff8f8;">
          <h2 style="color: #cc0000;">${subject}</h2>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Stack:</strong></p>
          <pre>${error.stack}</pre>
          <p><strong>Related Data:</strong></p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      `
    });
    
    console.log(`Admin alert email sent: ${subject}`);
  } catch (emailError) {
    console.error('Error sending admin alert email:', emailError);
  }
}

// Remove duplicate verify-session endpoint and keep only this one
app.get('/api/verify-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }
    
    console.log('Verifying session:', sessionId);
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    console.log('Session verification result:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status
    });
    
    return res.status(200).json({ 
      success: true, 
      paid: session.payment_status === 'paid',
      status: session.status,
      customer: session.customer_email,
      hasMetadata: !!session.metadata?.bookingInfo,
      // Add flag to check if this session has already been processed
      alreadyProcessed: session.metadata?.processed === 'true'
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Add an endpoint to explicitly process a booking from the success page
app.post('/api/process-checkout-booking', async (req, res) => {
  try {
    const { sessionId, bookingData } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }
    
    if (!bookingData) {
      return res.status(400).json({ success: false, error: 'Booking data is required' });
    }
    
    // Check if this session is already being processed (use a unique identifier)
    const processId = `checkout_${sessionId}`;
    if (processingBookings.has(processId)) {
      console.log(`Session ${sessionId} is already being processed, preventing duplicate processing`);
      return res.status(200).json({
        success: true,
        message: 'This booking is currently being processed',
        alreadyProcessed: true
      });
    }
    
    // Mark this session as being processed
    processingBookings.set(processId, new Date().toISOString());
    
    console.log('Processing booking for session:', sessionId);
    
    // Verify the session exists and was paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      processingBookings.delete(processId); // Release lock
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    if (session.payment_status !== 'paid') {
      processingBookings.delete(processId); // Release lock
      return res.status(400).json({ 
        success: false, 
        error: `Payment not completed. Current status: ${session.payment_status}` 
      });
    }
    
    // Check if this session has already been processed (prevent duplicates)
    if (session.metadata?.processed === 'true') {
      processingBookings.delete(processId); // Release lock
      console.log('Session already processed, skipping duplicate processing');
      return res.status(200).json({
        success: true,
        message: 'Booking was already processed successfully',
        alreadyProcessed: true
      });
    }
    
    // Create a complete booking data object with payment details
    const completeBookingData = {
      ...bookingData,
      paymentId: session.payment_intent,
      paymentStatus: 'Paid',
      status: 'Confirmed',
      timestamp: new Date().toISOString(),
    };
    
    // Only log once with essential booking info
    console.log('Processing booking:', {
      name: `${completeBookingData.firstName} ${completeBookingData.lastName}`,
      email: completeBookingData.email,
      subject: completeBookingData.subjectCategory,
      date: completeBookingData.preferredDate,
      time: completeBookingData.preferredTime
    });
    
    // Verify modules exist before calling them
    if (typeof sheetsModule.addBooking !== 'function') {
      processingBookings.delete(processId); // Release lock
      throw new Error('sheetsModule.addBooking is not a function');
    }
    
    if (typeof calendarModule.createCalendarEvent !== 'function') {
      processingBookings.delete(processId); // Release lock
      throw new Error('calendarModule.createCalendarEvent is not a function');
    }
    
    // Save to Google Sheets - just log success/failure, not "Saving booking to sheets and calendar..."
    const sheetResult = await sheetsModule.addBooking(completeBookingData);
    console.log('Booking saved to sheet:', sheetResult ? 'Success' : 'Failed');
    
    // Create Calendar event
    const calendarResult = await calendarModule.createCalendarEvent(completeBookingData);
    console.log('Calendar event created:', calendarResult.id || 'Failed');
    
    // Mark the session as processed to prevent duplicates
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...session.metadata,
        processed: 'true',
        processedTimestamp: new Date().toISOString()
      }
    });
    
    // Send confirmation email to student
    try {
      if (typeof mailerModule.sendStudentBookingConfirmation === 'function') {
        console.log('Sending confirmation email to:', completeBookingData.email);
        await mailerModule.sendStudentBookingConfirmation(
          completeBookingData.email,
          completeBookingData,
          calendarResult
        );
        console.log('Confirmation email sent successfully');
      } else {
        console.error('mailerModule.sendStudentBookingConfirmation is not a function');
        // Send a fallback email
        await sendFallbackConfirmationEmail(completeBookingData, calendarResult);
      }
    } catch (emailError) {
      console.error('Error sending student confirmation email:', emailError);
    }
    
    // Release the lock
    processingBookings.delete(processId);
    
    return res.status(200).json({
      success: true,
      message: 'Booking processed successfully',
      data: {
        sheetId: sheetResult,
        calendarId: calendarResult.id
      }
    });
    
  } catch (error) {
    // Make sure to release the lock even if there's an error
    if (req.body && req.body.sessionId) {
      processingBookings.delete(`checkout_${req.body.sessionId}`);
    }
    console.error('Error processing booking from success page:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Then AFTER the webhook route, add the JSON parser middleware for all other routes
app.use(express.json());

//===================================================================
// HEALTH CHECK ENDPOINT
// Simple endpoint to verify server and modules are running correctly
//===================================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    sheetsModuleAvailable: !!sheetsModule,
    addBookingAvailable: typeof sheetsModule.addBooking === 'function',
    calendarModuleAvailable: !!calendarModule,
    createCalendarEventAvailable: typeof calendarModule.createCalendarEvent === 'function',
    exports: {
      sheetsModule: Object.keys(sheetsModule),
      calendarModule: Object.keys(calendarModule)
    }
  });
});

//===================================================================
// CALENDAR MONITORING SYSTEM
// Automatically checks for changes in Google Calendar events,
// especially when tutors claim unassigned sessions
//===================================================================

// Store event states to detect changes
const eventStates = {};

/**
 * Starts the periodic monitoring of calendars for changes
 * Runs every minute to detect when tutors claim sessions
 */
function startCalendarMonitoring() {
  // Check all calendars every 1 minutes
  setInterval(async () => {
    try {
      console.log('Checking calendars for guest changes...');
      
      // Get all calendar IDs from environment variables
      const calendarsToCheck = getAllCalendarIdsFromEnv();
      
      console.log(`Found ${Object.keys(calendarsToCheck).length} calendars to monitor`);
      
      // Check each calendar
      for (const [calendarName, calendarId] of Object.entries(calendarsToCheck)) {
        if (calendarId) {
          await checkCalendarForChanges(calendarId, calendarName);
        }
      }
    } catch (error) {
      console.error('Error in calendar monitoring:', error);
    }
  }, 1 * 60 * 1000); // 1 minute interval
}

/**
 * Finds all calendar IDs from environment variables
 * Looks for variables ending with _CALENDAR_ID
 * @returns {Object} Map of calendar names to IDs
 */
function getAllCalendarIdsFromEnv() {
  const calendars = {};
  
  // Look for all environment variables that end with _CALENDAR_ID
  Object.keys(process.env).forEach(key => {
    if (key.endsWith('_CALENDAR_ID')) {
      // Format the name for better readability
      const name = key.replace('_CALENDAR_ID', '')
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, c => c.toUpperCase()); // Title case
                      
      calendars[name] = process.env[key];
    }
  });
  
  // Also add the default calendar
  if (process.env.GOOGLE_CALENDAR_ID) {
    calendars['Main'] = process.env.GOOGLE_CALENDAR_ID;
  }
  
  return calendars;
}

/**
 * Checks a specific calendar for recent changes
 * Looks at events from the last hour
 * @param {string} calendarId - Google Calendar ID
 * @param {string} calendarName - Friendly name for the calendar
 */
async function checkCalendarForChanges(calendarId, calendarName) {
  try {
    // Create auth client if needed
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Get events from the last hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: oneHourAgo.toISOString(),
      singleEvents: true,
      orderBy: 'updated'
    });
    
    const events = response.data.items || [];
    console.log(`Found ${events.length} recent events in ${calendarName} calendar`);
    
    // Process each event
    for (const event of events) {
      await processEvent(event, calendarId, calendar, calendarName);
    }
  } catch (error) {
    console.error(`Error checking ${calendarName} calendar:`, error);
  }
}

/**
 * Processes each calendar event to detect tutor assignments
 * If an UNASSIGNED event gets a new attendee, it marks it as assigned
 * and sends notification emails
 * @param {Object} event - Google Calendar event object
 * @param {string} calendarId - ID of the calendar containing this event
 * @param {Object} calendar - Google Calendar API client
 * @param {string} calendarName - Friendly name for the calendar
 */
async function processEvent(event, calendarId, calendar, calendarName) {
  try {
    const eventId = event.id;
    const currentAttendees = event.attendees || [];
    const previousState = eventStates[eventId] || { attendees: [] };
    
    // Check if this is an unassigned event and has new attendees
    if (
      event.summary && 
      event.summary.includes('UNASSIGNED') && 
      currentAttendees.length > 0 && 
      previousState.attendees.length === 0
    ) {
      console.log(`Found newly claimed event in ${calendarName} calendar:`, event.summary);
      
      // Get the tutor who claimed it (first attendee)
      const tutor = currentAttendees[0];
      const tutorEmail = tutor.email;
      const tutorName = tutorEmail.split('@')[0].replace(/[.]/g, ' ');
      
      // Extract student name from summary if it contains "for [name]"
      let studentName = "";
      if (event.summary.includes(" for ")) {
        studentName = event.summary.split(" for ")[1].trim();
      }
      
      // Get student info from extended properties (private data)
      let studentInfo = {}; // Changed from const to let
      
      if (event.extendedProperties && event.extendedProperties.private) {
        const privateProps = event.extendedProperties.private;
        studentInfo.name = privateProps.studentName || studentName;
        studentInfo.email = privateProps.studentEmail;
        studentInfo.phone = privateProps.studentPhone;
        studentInfo.format = privateProps.format;
        studentInfo.size = privateProps.size;
        studentInfo.duration = privateProps.duration;
        studentInfo.specificTopic = privateProps.specificTopic;
      } else {
        // Fallback to parsing from description if extended properties aren't available
        studentInfo = parseEventDescription(event.description);
        if (studentName && !studentInfo.name) {
          studentInfo.name = studentName;
        }
      }
      
      // Keep the student name in the updated event summary
      let updatedSummary = `ASSIGNED - ${tutorName}`;
      
      // Extract the subject and class size part (everything after "UNASSIGNED - " and before " for ")
      let subjectPart = event.summary.substring("UNASSIGNED - ".length);
      if (subjectPart.includes(" for ")) {
        subjectPart = subjectPart.split(" for ")[0];
      }
      
      // Create the full updated summary
      updatedSummary = `${updatedSummary} ${subjectPart} for ${studentInfo.name || studentName}`;
      
      // Update the event
      const updatedEvent = await calendar.events.patch({
        calendarId: calendarId,
        eventId: eventId,
        resource: {
          summary: updatedSummary,
          colorId: '10', // Green for assigned
          // Prevent others from modifying
          guestsCanInviteOthers: false
        }
      });
      
      // Send email to tutor with student details
      await sendTutorAssignmentEmail(tutorEmail, event, studentInfo);
      
      console.log(`Event in ${calendarName} calendar assigned to ${tutorEmail}`);
    }
    
    // Update stored state
    eventStates[eventId] = { 
      attendees: currentAttendees,
      lastUpdated: new Date(),
      calendarName: calendarName
    };
  } catch (error) {
    console.error(`Error processing event in ${calendarName} calendar:`, error);
  }
}

/**
 * Extracts student information from event description text
 * Parses formatted lines like "Student: Name" into an object
 * @param {string} description - Event description text
 * @returns {Object} Extracted student information
 */
function parseEventDescription(description) {
  if (!description) return {};
  
  const info = {};
  const lines = description.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('Student:')) {
      info.name = trimmed.replace('Student:', '').trim();
    } else if (trimmed.startsWith('Email:')) {
      info.email = trimmed.replace('Email:', '').trim();
    } else if (trimmed.startsWith('Phone:')) {
      info.phone = trimmed.replace('Phone:', '').trim();
    } else if (trimmed.startsWith('Class Format:')) {
      info.format = trimmed.replace('Class Format:', '').trim();
    } else if (trimmed.startsWith('Class Size:')) {
      info.size = trimmed.replace('Class Size:', '').trim();
    } else if (trimmed.startsWith('Duration:')) {
      info.duration = trimmed.replace('Duration:', '').trim();
    }
  });
  
  return info;
}

/**
 * Sends email notification to tutor who claimed a session
 * Includes all relevant session and student details
 * @param {string} tutorEmail - Email address of the tutor
 * @param {Object} event - Google Calendar event object
 * @param {Object} studentInfo - Information about the student
 * @returns {boolean} Success status
 */
async function sendTutorAssignmentEmail(tutorEmail, event, studentInfo) {
  try {
    // First check if the mailer module has this function
    if (typeof mailerModule.sendTutorConfirmation === 'function') {
      // The mailer module already has most of the functionality we need
      const mockBookingData = {
        firstName: studentInfo.name ? studentInfo.name.split(' ')[0] : 'Student',
        lastName: studentInfo.name ? studentInfo.name.split(' ').slice(1).join(' ') : '',
        email: studentInfo.email || 'Not provided',
        phone: studentInfo.phone || 'Not provided',
        classFormat: studentInfo.format || 'Not specified',
        classSize: studentInfo.size || 'Solo',
        classDuration: studentInfo.duration || 'Not specified',
        specificTopic: studentInfo.specificTopic || ''
      };
      
      return await mailerModule.sendTutorConfirmation(tutorEmail, mockBookingData, event);
    }
    
    // If not available, use direct implementation (fallback)
    // Format date and time - ensure Spain timezone
    const startDateTime = new Date(event.start.dateTime);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Madrid'
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    };
    
    const formattedDate = startDateTime.toLocaleDateString('en-GB', options);
    const formattedTime = startDateTime.toLocaleTimeString('en-GB', timeOptions);
    
    // Extract subject from event summary
    const summaryParts = event.summary.split(' ');
    // Find the subject in the summary (it will be after "ASSIGNED - " or "UNASSIGNED - " and the class size)
    const classSize = studentInfo.size || summaryParts[1] || '';
    
    // Get the subject part - it starts after the status and class size
    let subjectIndex = 2; // Default position
    if (summaryParts[0].includes("ASSIGNED")) {
      // If assigned, there will be the tutor name too, so subject starts later
      subjectIndex = 3;
    }
    
    // Join the remaining parts to get the full subject
    const subject = summaryParts.slice(subjectIndex).join(' ').replace('Tutoring Session', '').trim();
    
    // Create a one-time transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Create email options
    const mailOptions = {
      from: '"Tutorly Booking" <tutorlyautomation@gmail.com>',
      to: tutorEmail,
      subject: `Confirmed: ${subject} tutoring session assigned to you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568; text-align: center; margin-bottom: 20px;">Tutoring Session Confirmed</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime} (Spanish Time)</p>
            <p style="margin: 5px 0;"><strong>Format:</strong> ${studentInfo.format || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Size:</strong> ${studentInfo.size || classSize}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${studentInfo.duration || 'N/A'}</p>
          </div>
          
          <h3 style="color: #4a5568; margin-top: 20px;">Student Information</h3>
          <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${studentInfo.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${studentInfo.email || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${studentInfo.phone || 'N/A'}</p>
          </div>
          
          <p style="margin-bottom: 15px;">You have successfully claimed this tutoring session. Please contact the student to confirm details.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${event.htmlLink}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Calendar</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This is an automated message from Tutorly. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Assignment email sent to tutor:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending tutor assignment email:', error);
    return false;
  }
}

// Start the calendar monitoring when server loads
startCalendarMonitoring();

// Add a cleanup function to remove stale locks
setInterval(() => {
  // Remove any processing locks older than 5 minutes
  const now = new Date().getTime();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  processingBookings.forEach((timestamp, key) => {
    const lockTime = new Date(timestamp).getTime();
    if (lockTime < fiveMinutesAgo) {
      console.log(`Cleaning up stale processing lock for: ${key}`);
      processingBookings.delete(key);
    }
  });
}, 60 * 1000); // Check every minute

//===================================================================
// SERVER INITIALIZATION
//===================================================================
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Health check available at: http://localhost:${PORT}/api/health`);
});


