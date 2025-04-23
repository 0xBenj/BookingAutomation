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
const mailerModule = require('./mailer'); // Import the mailer module

// Verify exports are available
console.log('Imported sheets module exports:', Object.keys(sheetsModule));
console.log('Imported calendar module exports:', Object.keys(calendarModule));
console.log('Imported tutors module exports:', Object.keys(tutorsModule));
console.log('Imported mailer module exports:', Object.keys(mailerModule));


// Log the path to tutors module to verify it's correct
console.log('Tutors module path:', path.join(__dirname, '../src/data/tutors'));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Enhance CORS for development
app.use(cors({
  origin: '*', // For development only - change to specific origin in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Check if the checkout session endpoint exists and is properly defined
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Received checkout session request:', req.body);
    const { amount, bookingData, customerEmail, frontendUrl } = req.body;
    
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
    const domain = frontendUrl || process.env.FRONTEND_URL || 'https://tutorly-booking.web.app';

    console.log(`Creating checkout session for ${amount}€, redirecting to ${domain}`);

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
      
      // Get student info from extended properties (private data)
      let studentInfo = {}; // Changed from const to let
      
      if (event.extendedProperties && event.extendedProperties.private) {
        const privateProps = event.extendedProperties.private;
        studentInfo.name = privateProps.studentName;
        studentInfo.email = privateProps.studentEmail;
        studentInfo.phone = privateProps.studentPhone;
        studentInfo.format = privateProps.format;
        studentInfo.size = privateProps.size;
        studentInfo.duration = privateProps.duration;
        studentInfo.specificTopic = privateProps.specificTopic;
      } else {
        // Fallback to parsing from description if extended properties aren't available
        studentInfo = parseEventDescription(event.description);
      }
      
      // Update the event
      const updatedEvent = await calendar.events.patch({
        calendarId: calendarId,
        eventId: eventId,
        resource: {
          summary: event.summary.replace('UNASSIGNED', `ASSIGNED - ${tutorName}`),
          colorId: '10', // Green for assigned
          // Prevent others from modifying
          guestsCanInviteOthers: false
        }
      });
      
      // Send email to tutor with student details
      await sendTutorAssignmentEmail(tutorEmail, event, studentInfo);
      
      // Send email to student about tutor assignment
      if (studentInfo.email) {
        try {
          // If we have mailerModule imported properly, use it
          if (mailerModule && typeof mailerModule.sendStudentTutorConfirmation === 'function') {
            await mailerModule.sendStudentTutorConfirmation(
              studentInfo.email,
              studentInfo.name,
              tutorName,
              tutorEmail,
              studentInfo,
              event
            );
            console.log(`Confirmation email sent to student ${studentInfo.email}`);
          } else {
            // Fallback to using the transporter directly
            const studentMailOptions = {
              from: '"Tutorly Booking" <tutorlyautomation@gmail.com>',
              to: studentInfo.email,
              subject: `Tutor confirmed for your session`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                  <h2 style="color: #4a5568; text-align: center; margin-bottom: 20px;">Your Tutor Has Been Confirmed</h2>
                  
                  <p style="margin-bottom: 20px;">Hi ${studentInfo.name || 'there'},</p>
                  
                  <p style="margin-bottom: 20px;">Good news! Your tutoring session has been claimed by a tutor. <strong>${tutorName}</strong> (${tutorEmail}) will contact you shortly to discuss details about your upcoming session.</p>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${event.htmlLink}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Calendar</a>
                  </div>
                </div>
              `
            };
            
            const transporter = nodemailer.createTransport({
              service: process.env.EMAIL_SERVICE,
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
              }
            });
            
            await transporter.sendMail(studentMailOptions);
            console.log(`Fallback confirmation email sent to student ${studentInfo.email}`);
          }
        } catch (emailError) {
          console.error('Error sending email to student:', emailError);
        }
      }
      
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
    // Format date and time
    const startDateTime = new Date(event.start.dateTime);
    const formattedDate = startDateTime.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = startDateTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
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
    
    // Get the mailer module's transporter
    // If you're using a separate mailer module, you could use that instead
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
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
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

//===================================================================
// SERVER INITIALIZATION
//===================================================================
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Health check available at: http://localhost:${PORT}/api/health`);
});

