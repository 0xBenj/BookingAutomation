require('dotenv').config();
const { google } = require('googleapis');

//===================================================================
// GOOGLE SHEETS SERVICE
// Handles storing all booking data in a spreadsheet for
// record-keeping and reporting purposes
//===================================================================

/**
 * Add a new booking record to Google Sheets
 * 
 * Appends a new row to the bookings spreadsheet with:
 * - Timestamp and student contact information
 * - Subject and class details
 * - Scheduling preferences
 * - Pricing information
 * 
 * @param {Object} bookingData - All booking information from the form
 * @param {string} university - The university slug (esade/lycee) - optional for backward compatibility
 * @returns {Promise<Object>} - The Google Sheets API response
 */
async function addBooking(bookingData, university = null) {
  try {
    console.log('addBooking function called with data:', bookingData);
    
    // Verify environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
      throw new Error('Missing required environment variables. Check your .env file.');
    }
    
    // Create auth client
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Determine university - use parameter if provided, otherwise try to detect from bookingData
    const universitySlug = university || bookingData.university || 'esade'; // Default to esade for backward compatibility
    
    // Determine which sheet to use based on university
    let sheetName = 'Esade'; // Always Esade for ESADE
    if (universitySlug === 'lycee') {
      sheetName = 'Lycee'; // Always Lycee for Lycee bookings
    }
    
    // Get tutors for the subject to include in the sheet
    const universitiesData = require('../../src/config/universities.js');
    const universityConfig = universitiesData.default[universitySlug];
    const subjectTutors = universityConfig?.tutors?.[bookingData.subjectCategory] || [];
    
    // Format tutors as "Name (email), Name (email), ..." 
    const tutorsString = subjectTutors
      .map(tutor => `${tutor.name} (${tutor.email})`)
      .join(', ');

    // Append data to the appropriate sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${sheetName}!A:A`, // Start from column A, let Google Sheets handle the rest
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [
            `${bookingData.firstName} ${bookingData.lastName}`.trim(), // NAME (FULL NAME)
            bookingData.email || '',                            // E-MAIL
            bookingData.phone || '',                            // PHONE NUMBER
            bookingData.subjectCategory || '',                  // SUBJECT
            bookingData.classFormat || '',                      // FORMAT
            bookingData.classSize || '',                        // SIZE
            bookingData.classDuration || '',                    // DURATION
            bookingData.preferredTime || '',                    // TIME
            bookingData.preferredDate || '',                    // DATE
            bookingData.tutorPreference || '',                  // PREF. TUTOR
            // Additional columns after the main ones
            bookingData.specificTopic || '',                    // Specific Topic
            bookingData.referralSource || '',                   // Referral Source
            bookingData.status || 'Pending',                    // Status
            bookingData.price ? `€${bookingData.price}` : '',   // Price
            universitySlug || 'esade',                          // University
            tutorsString                                        // Available Tutors for this subject
          ]
        ]
      }
    });
    
    console.log('Booking added successfully!');
    return response.data;
  } catch (error) {
    console.error('Error adding booking:', error.message);
    if (error.response) {
      console.error('API Error details:', error.response.data);
    }
    throw error;
  }
}

/**
 * Initialize the bookings spreadsheet with column headers
 * 
 * This should be run once when setting up a new spreadsheet.
 * Creates the header row with names for all booking data fields.
 * 
 * @returns {Promise<Boolean>} - Success status
 */
async function initializeSheetHeaders() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Set headers in the spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${process.env.SHEET_NAME || 'Bookings'}!A1:P1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            'NAME (FULL NAME)',
            'E-MAIL',
            'PHONE NUMBER',
            'SUBJECT',
            'FORMAT',
            'SIZE',
            'DURATION',
            'TIME',
            'DATE',
            'PREF. TUTOR',
            'Specific Topic',
            'Referral Source',
            'Status',
            'Price',
            'University',
            'Available Tutors'
          ]
        ]
      }
    });
    
    console.log('Sheet headers initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing sheet headers:', error.message);
    if (error.response) {
      console.error('API Error details:', error.response.data);
    }
    throw error;
  }
}

// Make sure to properly export the functions
module.exports = {
  addBooking,
  initializeSheetHeaders
};

// Add a debug log to verify exports
console.log('Sheets module exports:', Object.keys(module.exports));