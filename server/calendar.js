require('dotenv').config();
const { google } = require('googleapis');
const tutorsModule = require('./tutors');
const mailerModule = require('./mailer');

/**
 * Create a Google Calendar event for a booking and notify tutors
 * @param {Object} bookingData - The booking details
 * @returns {Promise<Object>} - The created calendar event
 */
async function createCalendarEvent(bookingData) {
  try {
    // Verify required environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
        !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing required Google Calendar environment variables');
    }

    // Select the appropriate calendar ID based on subject
    let calendarId = process.env.GOOGLE_CALENDAR_ID; // Default calendar
    let calendarName = 'Main';
    
    // Normalize the subject for matching with environment variables
    const subject = bookingData.subjectCategory;
    if (subject) {
      // Create a map of possible environment variable keys to check for this subject
      const possibleKeys = [];
      
      // 1. Try direct match first (exact match with spaces replaced by underscores)
      const directKey = subject.replace(/\s+/g, '_').toUpperCase() + '_CALENDAR_ID';
      possibleKeys.push(directKey);
      
      // 2. Try simplified keys based on common words in the subject
      const simplifiedSubject = subject.toUpperCase()
        .replace(/FOR MANAGEMENT|AND DATA ANALYSIS|AND PROBABILITY/g, '')
        .trim()
        .replace(/\s+/g, '_');
      
      if (simplifiedSubject !== directKey.replace('_CALENDAR_ID', '')) {
        possibleKeys.push(simplifiedSubject + '_CALENDAR_ID');
      }
      
      // 3. Check for specific mappings based on subject categories
      const subjectMappings = {
        'Applied Mathematics for Management': 'APPLIED_MATHEMATICS_CALENDAR_ID',
        'Descriptive Statistics and Probability': 'DESCRIPTIVE_STATISTICS_CALENDAR_ID',
        'Statistical Inference and Data Analysis': 'STATISTICAL_INFERENCE_CALENDAR_ID',
        'Basics of Financial Accounting': 'FINANCIAL_ACCOUNTING_BASICS_CALENDAR_ID',
        'Advanced Accounting': 'ADVANCED_ACCOUNTING_CALENDAR_ID',
        'Microeconomics': 'MICROECONOMICS_CALENDAR_ID',
        'Macroeconomics': 'MACROECONOMICS_CALENDAR_ID',
        'Managerial Economics': 'MANAGERIAL_ECONOMICS_CALENDAR_ID',
        'Financial Economics': 'FINANCIAL_ECONOMICS_CALENDAR_ID',
        'Business Law': 'BUSINESS_LAW_CALENDAR_ID',
        'Tax Law': 'TAX_LAW_CALENDAR_ID',
        'Managing Digital Information': 'DIGITAL_INFORMATION_CALENDAR_ID',
        'Information Systems': 'INFORMATION_SYSTEMS_CALENDAR_ID',
        'Financial Analysis': 'FINANCIAL_ANALYSIS_CALENDAR_ID',
        'English': 'ENGLISH_CALENDAR_ID',
        'Spanish': 'SPANISH_CALENDAR_ID',
        'German': 'GERMAN_CALENDAR_ID'
      };
      
      if (subjectMappings[subject]) {
        possibleKeys.push(subjectMappings[subject]);
      }
      
      // Try each possible key to find a matching calendar
      let foundCalendar = false;
      for (const key of possibleKeys) {
        if (process.env[key]) {
          calendarId = process.env[key];
          calendarName = subject;
          console.log(`Using ${subject} calendar with key ${key}: ${calendarId.substring(0, 10)}...`);
          foundCalendar = true;
          break;
        }
      }
      
      if (!foundCalendar) {
        console.log(`No specific calendar found for subject: ${subject}, using default calendar`);
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

    const startDateTime = new Date(`${bookingData.preferredDate}T${bookingData.preferredTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // Add price information to the event description if available
    const priceInfo = bookingData.price 
      ? `\nPrice: €${bookingData.price}` 
      : '';

    // Create event object
    const event = {
      summary: `UNASSIGNED - ${bookingData.classSize} ${bookingData.subjectCategory} Tutoring Session`,
      description: `Tutoring session for ${bookingData.specificTopic || bookingData.subjectCategory}
      
Student: ${bookingData.firstName} ${bookingData.lastName}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Class Format: ${bookingData.classFormat}
Class Size: ${bookingData.classSize}
Duration: ${bookingData.classDuration}
Tutor Preference: ${bookingData.tutorPreference}${priceInfo}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      // Gray for unassigned events
      colorId: '8'
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
      // Get tutor emails for this subject
      const tutorEmails = tutorsModule.getTutorEmailsForSubject(bookingData.subjectCategory);
      
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