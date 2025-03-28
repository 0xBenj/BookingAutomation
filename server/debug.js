require('dotenv').config();
const path = require('path');

console.log('Current directory:', __dirname);
console.log('Path to sheets.js:', path.join(__dirname, '../src/sheets.js'));

try {
  const sheetsModule = require('../src/sheets');
  console.log('Sheets module loaded successfully');
  console.log('Available methods:', Object.keys(sheetsModule));
  
  if (sheetsModule.addBooking) {
    console.log('addBooking function is available');
  } else {
    console.log('ERROR: addBooking function is not available');
  }
  
  console.log('Environment variables:');
  console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set');
  console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set');
  console.log('- SPREADSHEET_ID:', process.env.SPREADSHEET_ID ? 'Set' : 'Not set');
  console.log('- SHEET_NAME:', process.env.SHEET_NAME ? 'Set' : 'Not set');
} catch (error) {
  console.error('Error loading sheets module:', error);
}
