require('dotenv').config();
const { google } = require('googleapis');

// Function to add a booking to Google Sheets
async function addBooking(bookingData) {
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
    
    // Append data to the spreadsheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${process.env.SHEET_NAME || 'Bookings'}!A:Q`, // A to Q for 17 columns (added price)
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            new Date().toISOString(),                           // Timestamp (generated server-side)
            bookingData.firstName || '',                        // First Name
            bookingData.lastName || '',                         // Last Name
            bookingData.email || '',                            // Email
            bookingData.phone || '',                            // Phone
            bookingData.newsletterSignup ? 'Yes' : 'No',        // Newsletter Signup
            bookingData.subjectCategory || '',                  // Subject Category
            bookingData.specificTopic || '',                    // Specific Topic
            bookingData.classFormat || '',                      // Class Format
            bookingData.classSize || '',                        // Class Size
            bookingData.classDuration || '',                    // Class Duration
            bookingData.preferredDate || '',                    // Preferred Date
            bookingData.preferredTime || '',                    // Preferred Time
            bookingData.tutorPreference || '',                  // Tutor Preference
            bookingData.referralSource || '',                   // Referral Source
            bookingData.status || 'Pending',                    // Status
            bookingData.price ? `€${bookingData.price}` : ''    // Price
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

// Create headers if the sheet doesn't have them yet
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
      range: `${process.env.SHEET_NAME || 'Bookings'}!A1:Q1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            'Timestamp',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Newsletter Signup',
            'Subject Category',
            'Specific Topic',
            'Class Format',
            'Class Size',
            'Class Duration',
            'Preferred Date',
            'Preferred Time',
            'Tutor Preference',
            'Referral Source',
            'Status',
            'Price'
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