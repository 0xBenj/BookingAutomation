require('dotenv').config();
const { google } = require('googleapis');
const tutorsModule = require('../tutors');
const mailerModule = require('./mailer');
const universitiesData = require('../../src/config/universities.js');

//===================================================================
// GOOGLE CALENDAR SERVICE
// Handles creating events, assigning tutors, and managing 
// the different subject-specific calendars
//===================================================================

/**
 * Create a Google Calendar event for a booking and notify tutors
 * 
 * This is the main calendar integration function that:
 * 1. Selects the appropriate subject-specific calendar based on university
 * 2. Creates an "UNASSIGNED" event with booking details
 * 3. Stores student info securely in private extended properties
 * 4. Notifies all qualified tutors about the new opportunity
 * 
 * @param {Object} bookingData - The complete booking details from the form
 * @param {string} university - The university slug (esade/lycee) - optional for backward compatibility
 * @returns {Promise<Object>} - The created calendar event
 */
async function createCalendarEvent(bookingData, university = null) {
  try {
    // Verify required environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
        !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing required Google Calendar environment variables');
    }

    // Select the appropriate calendar ID based on university and subject
    let calendarId = process.env.GOOGLE_CALENDAR_ID; // Default calendar
    let calendarName = 'Main';
    
    // Determine university - use parameter if provided, otherwise try to detect from bookingData
    const universitySlug = university || bookingData.university || 'esade'; // Default to esade for backward compatibility
    
    console.log('University parameter:', university);
    console.log('Booking data university:', bookingData.university);
    console.log('Final university slug:', universitySlug);
    
    // Get university config from universities.js
    const universityConfig = universitiesData.default[universitySlug];
    const subject = bookingData.subjectCategory;
    
    if (subject && universityConfig) {
      // Find the subject configuration
      const subjectConfig = universityConfig.subjects.find(s => s.value === subject);
      
      if (subjectConfig && subjectConfig.calendarVar) {
        // Get calendar ID from environment using the calendarVar
        const calendarEnvVar = subjectConfig.calendarVar;
        if (process.env[calendarEnvVar]) {
          calendarId = process.env[calendarEnvVar];
          calendarName = `${universitySlug.toUpperCase()} - ${subject}`;
          console.log(`Using ${universitySlug} ${subject} calendar with key ${calendarEnvVar}: ${calendarId.substring(0, 10)}...`);
        } else {
          console.log(`Calendar environment variable ${calendarEnvVar} not found for ${universitySlug} subject: ${subject}, using default calendar`);
        }
      } else {
        console.log(`No subject configuration found for ${universitySlug} subject: ${subject}, using default calendar`);
      }
    }
    
    // Verify we have a valid calendar ID
    if (!calendarId) {
      console.error('No calendar ID available for subject:', subject);
      calendarId = process.env.GOOGLE_CALENDAR_ID; // Fallback to default
      calendarName = 'Main';
    }

    // Create authentication client
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    // Create Google Calendar service
    const calendar = google.calendar({ version: 'v3', auth });

    const durationMap = {
      '1 hour': 60,
      '1.5 hours': 90,
      '2 hours': 120,
      '2.5 hours': 150
    };
    
    const durationMinutes = durationMap[bookingData.classDuration] || 60;

    // Fix timezone issue: construct the datetime properly in Madrid timezone
    // Create the datetime string directly in the Madrid timezone format
    console.log('Booking date:', bookingData.preferredDate);
    console.log('Booking time:', bookingData.preferredTime);
    
    const startDateTimeString = `${bookingData.preferredDate}T${bookingData.preferredTime}:00`;
    console.log('Constructed datetime string:', startDateTimeString);
    
    // Parse the datetime as if it's already in Madrid timezone
    const startDateTime = new Date(startDateTimeString);
    console.log('Parsed start datetime:', startDateTime);
    
    if (isNaN(startDateTime.getTime())) {
      throw new Error(`Invalid date/time format: ${startDateTimeString}`);
    }
    
    // Calculate end time by adding duration minutes
    const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));
    
    // Format both times consistently for Madrid timezone
    const endDateTimeString = `${bookingData.preferredDate}T${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}:00`;
    
    console.log('End datetime string:', endDateTimeString);

    // Add price information to the event description if available
    const priceInfo = bookingData.price 
      ? `\nPrice: €${bookingData.price}` 
      : '';

    // Create a booking reference ID (could be timestamp + random chars)
    const bookingRef = `REF-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    
    // Store all student info in extended properties (private data)
    const extendedProperties = {
      private: {
        bookingRef: bookingRef,
        studentName: `${bookingData.firstName} ${bookingData.lastName}`,
        studentEmail: bookingData.email,
        studentPhone: bookingData.phone,
        tutorPreference: bookingData.tutorPreference,
        price: bookingData.price ? bookingData.price.toString() : '',
        format: bookingData.classFormat,
        size: bookingData.classSize,
        duration: bookingData.classDuration,
        specificTopic: bookingData.specificTopic || ''
      }
    };

    // Create event object with privacy-focused description
    // Include student name in the event summary
    const event = {
      summary: `UNASSIGNED - ${bookingData.classSize} ${bookingData.subjectCategory} for ${bookingData.firstName} ${bookingData.lastName}`,
      description: `Tutoring session for ${bookingData.specificTopic || bookingData.subjectCategory}
      
Student: ${bookingData.firstName} ${bookingData.lastName}
Class Format: ${bookingData.classFormat}
Class Size: ${bookingData.classSize}
Duration: ${bookingData.classDuration}
Booking Reference: ${bookingRef}${priceInfo}
Preferred Tutor: ${bookingData.tutorPreference || 'No preference'}`,

      start: {
        dateTime: startDateTimeString,
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: endDateTimeString,
        timeZone: 'Europe/Madrid'
      },
      // Gray for unassigned events
      colorId: '8',
      // Store private data in extended properties
      extendedProperties: extendedProperties
    };

    console.log(`Creating event in ${calendarName} calendar`);

    // Insert the event
    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log('Event created successfully:', response.data.htmlLink);
    
    // Get tutors for this subject and send notifications
    try {
      let tutorEmails = [];
      
      // First try to get tutors from universities.js
      if (universityConfig && universityConfig.tutors && universityConfig.tutors[bookingData.subjectCategory]) {
        tutorEmails = universityConfig.tutors[bookingData.subjectCategory].map(tutor => tutor.email);
      } else {
        // Fallback to tutors module with university parameter
        tutorEmails = tutorsModule.getTutorEmailsForSubject(bookingData.subjectCategory, universitySlug);
      }
      
      if (tutorEmails && tutorEmails.length > 0) {
        console.log(`Sending notifications to ${tutorEmails.length} tutors for ${bookingData.subjectCategory}`);
        
        // Send notifications to tutors
        await mailerModule.sendTutorNotifications(tutorEmails, bookingData, response.data);
      } else {
        console.log(`No tutors found for subject: ${bookingData.subjectCategory}`);
      }
    } catch (emailError) {
      console.error('Error sending tutor notifications:', emailError);
      // Continue even if email fails - we don't want to fail the booking
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error.message);
    if (error.response) {
      console.error('API error details:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  createCalendarEvent
};