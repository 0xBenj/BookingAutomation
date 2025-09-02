require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

//===================================================================
// NOTIFICATIONS SERVICE
// Handles email notifications and Google Sheets logging for
// reviews, tutor applications, and special packages
//===================================================================

let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (transporter) return;

  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Missing required email environment variables');
    return;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

/**
 * Add data to Google Sheets
 */
async function addToSheet(sheetName, rowData) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [rowData] }
    });
    
    console.log(`Data added to ${sheetName} successfully`);
  } catch (error) {
    console.error(`Error adding to ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Send notification email
 */
async function sendNotificationEmail(type, data) {
  try {
    initializeTransporter();
    
    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    // Get email content based on type
    const emailContent = getEmailContent(type);

    const mailOptions = {
      from: `"Tutorly Admin" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New request for ${type.replace(/_/g, ' ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568; text-align: center; margin-bottom: 20px;">${emailContent.title}</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 10px 0; color: #2d3748; font-size: 16px;">${emailContent.message}</p>
          </div>
          
          <div style="background-color: #ebf8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #4285f4;">
            <p style="margin: 5px 0; color: #2a69ac;"><strong>How to access:</strong></p>
            <p style="margin: 5px 0; color: #2a69ac;">${emailContent.accessInstructions}</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This is an automated message from Tutorly. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Notification email sent for ${type}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    return false;
  }
}

/**
 * Get email content based on notification type
 */
function getEmailContent(type) {
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID}`;
  
  switch(type) {
    case 'review':
      return {
        title: 'New Review Received',
        message: 'A new student review has been submitted and is ready for your attention.',
        accessInstructions: `View all reviews in the "Reviews" sheet of your <a href="${spreadsheetUrl}" style="color: #4285f4; text-decoration: none;">Google Spreadsheet</a>`
      };
    case 'tutor_application':
      return {
        title: 'New Tutor Application',
        message: 'A new tutor application has been submitted and requires your review.',
        accessInstructions: `View all applications in the "TutorApplications" sheet of your <a href="${spreadsheetUrl}" style="color: #4285f4; text-decoration: none;">Google Spreadsheet</a>`
      };
    case 'special_package':
      return {
        title: 'New Special Package Request',
        message: 'A new special package booking has been submitted and awaits processing.',
        accessInstructions: `View all special packages in the "SpecialPackages" sheet of your <a href="${spreadsheetUrl}" style="color: #4285f4; text-decoration: none;">Google Spreadsheet</a>`
      };
    default:
      return {
        title: `New ${type} Request`,
        message: `A new ${type} request has been received.`,
        accessInstructions: `Check your Google Spreadsheet for details.`
      };
  }
}

/**
 * Handle review submission
 */
async function handleReview(reviewData) {
  try {
    // Split full name if provided as single field
    const nameParts = reviewData.studentName ? reviewData.studentName.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    await addToSheet('Reviews', [
      new Date().toISOString(),
      firstName,
      lastName,
      reviewData.email,
      reviewData.comment
    ]);
    
    await sendNotificationEmail('review', reviewData);
    return { success: true };
  } catch (error) {
    console.error('Error handling review:', error);
    throw error;
  }
}

/**
 * Handle tutor application
 */
async function handleTutorApplication(applicationData) {
  try {
    await addToSheet('TutorApplications', [
      new Date().toISOString(),
      applicationData.name,
      applicationData.email,
      applicationData.phone || '',
      applicationData.university,
      Array.isArray(applicationData.subjects) 
        ? applicationData.subjects.join(', ') 
        : applicationData.subjects || '',
      applicationData.oneSentence || '',
      applicationData.about || '',
      applicationData.cv ? 'CV Uploaded' : 'No CV'
    ]);
    
    await sendNotificationEmail('tutor_application', applicationData);
    return { success: true };
  } catch (error) {
    console.error('Error handling tutor application:', error);
    throw error;
  }
}

/**
 * Handle special package booking
 */
async function handleSpecialPackage(packageData) {
  try {
    await addToSheet('SpecialPackages', [
      new Date().toISOString(),
      packageData.studentName,
      packageData.email,
      packageData.phoneNumber || '',
      packageData.packageType,
      packageData.classSize,
      packageData.subjects,
      packageData.tutorPreferences || '',
      packageData.classFormat,
      packageData.price
    ]);
    
    await sendNotificationEmail('special_package', packageData);
    return { success: true };
  } catch (error) {
    console.error('Error handling special package:', error);
    throw error;
  }
}

module.exports = {
  handleReview,
  handleTutorApplication,
  handleSpecialPackage
};