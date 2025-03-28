require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Import the local modules
const sheetsModule = require('./sheets');
const calendarModule = require('./calendar');

// Verify exports are available
console.log('Imported sheets module exports:', Object.keys(sheetsModule));
console.log('Imported calendar module exports:', Object.keys(calendarModule));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to handle booking submissions
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

// Simple health check endpoint
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

// TODO
// Add these webhook-related functions to your server.js file

// Store event states to detect changes
const eventStates = {};

// Function to check for calendar changes periodically
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

// Extract all calendar IDs from environment variables
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

// Check a specific calendar for changes
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

// Process an event to check for tutor assignment
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
      
      // Extract student info from description
      const studentInfo = parseEventDescription(event.description);
      
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

// Parse event description to extract student info
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

// Send email to tutor
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
    const classSize = summaryParts[1] || '';
    const subject = summaryParts[2] || '';
    
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
            <p style="margin: 5px 0;"><strong>Size:</strong> ${classSize}</p>
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

// Then in your server setup code (at the bottom), add:
startCalendarMonitoring();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


