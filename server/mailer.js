require('dotenv').config();
const nodemailer = require('nodemailer');

//===================================================================
// EMAIL SERVICE MODULE
// Handles all email communications for the booking system
//===================================================================

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 * Creates a reusable nodemailer transporter using environment credentials
 * Only initializes once and reuses the connection
 */
function initializeTransporter() {
  // Check if already initialized
  if (transporter) return;

  // Verify required environment variables
  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Missing required email environment variables');
    return;
  }

  // Create transporter
    transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

/**
 * Send notification emails to tutors about a new booking
 * 
 * This function sends a BCC email to all tutors who can teach the subject,
 * notifying them of a new tutoring opportunity they can claim.
 * 
 * @param {Array} tutorEmails - Array of tutor email addresses
 * @param {Object} bookingData - Booking information (subject, date, time, etc.)
 * @param {Object} eventData - Google Calendar event information
 * @returns {Promise} - Result of sending emails
 */
async function sendTutorNotifications(tutorEmails, bookingData, eventData) {
  try {
    // Initialize transporter if not already done
    initializeTransporter();
    
    // If no transporter, log error and return
    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    // If no tutor emails, log and return
    if (!tutorEmails || tutorEmails.length === 0) {
      console.log('No tutors to notify for this subject');
      return false;
    }

    console.log(`Sending notifications to ${tutorEmails.length} tutors`);

    // Format date and time for readability
    const startDateTime = new Date(bookingData.preferredDate + 'T' + bookingData.preferredTime);
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

    // Create email options
    const mailOptions = {
      from: `"Tutorly Booking" <${process.env.EMAIL_USER}>`,
      bcc: tutorEmails, // Send to all tutors as BCC
      subject: `New ${bookingData.subjectCategory} tutoring session booked`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568; text-align: center; margin-bottom: 20px;">New Tutoring Session Booked</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${bookingData.subjectCategory}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;"><strong>Format:</strong> ${bookingData.classFormat}</p>
            <p style="margin: 5px 0;"><strong>Size:</strong> ${bookingData.classSize}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${bookingData.classDuration}</p>
          </div>
          
          <p style="margin-bottom: 15px;">A new tutoring session has been booked and is available to claim.</p>
          
          <p style="margin-bottom: 15px;"><strong>How to claim this session:</strong></p>
          <ol style="margin-bottom: 20px;">
            <li>Go to your Google Calendar</li>
            <li>Find the event titled "UNASSIGNED - ${bookingData.classSize} ${bookingData.subjectCategory} Tutoring Session"</li>
            <li>Add yourself as a guest to claim the session</li>
          </ol>
          
          <p style="margin-bottom: 15px;">Once you add yourself as a guest, the event will be assigned to you and other tutors won't be able to claim it.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${eventData.htmlLink}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Calendar</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This is an automated message from Tutorly. Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Notification emails sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending tutor notifications:', error);
    return false;
  }
}

/**
 * Send confirmation notification to a tutor who has claimed a session
 * 
 * This function sends a detailed email to the tutor with all session 
 * information and student contact details after they've claimed a session.
 * 
 * @param {string} tutorEmail - Tutor email address
 * @param {Object} bookingData - Complete booking information
 * @param {Object} eventData - Google Calendar event information
 * @returns {Promise} - Result of sending email
 */
async function sendTutorConfirmation(tutorEmail, bookingData, eventData) {
  try {
    // Initialize transporter if not already done
    initializeTransporter();
    
    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    // Format date and time
    const startDateTime = new Date(eventData.start.dateTime);
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

    // Get subject and other details from event summary/data
    const summaryParts = eventData.summary.split(' ');
    let subjectIndex = 2; // Default position
    if (summaryParts[0].includes("ASSIGNED")) {
      // If assigned, there will be the tutor name too, so subject starts later
      subjectIndex = 3;
    }
    
    // Join the remaining parts to get the full subject
    const subject = summaryParts.slice(subjectIndex).join(' ').replace('Tutoring Session', '').trim();
    const classSize = bookingData.classSize || "Solo";

    // Create email options for tutor confirmation
    const mailOptions = {
      from: `"Tutorly Booking" <${process.env.EMAIL_USER}>`,
      to: tutorEmail,
      subject: `Confirmed: ${subject} tutoring session assigned to you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568; text-align: center; margin-bottom: 20px;">Tutoring Session Confirmed</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 5px 0;"><strong>Topic:</strong> ${bookingData.specificTopic || 'General tutoring'}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;"><strong>Format:</strong> ${bookingData.classFormat}</p>
            <p style="margin: 5px 0;"><strong>Size:</strong> ${classSize}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${bookingData.classDuration}</p>
          </div>
          
          <h3 style="color: #4a5568; margin-top: 20px;">Student Information</h3>
          <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${bookingData.firstName} ${bookingData.lastName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${bookingData.email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${bookingData.phone}</p>
          </div>
          
          <p style="margin-bottom: 15px;">You have successfully claimed this tutoring session. Please contact the student to confirm details.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${eventData.htmlLink}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Calendar</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This is an automated message from Tutorly. Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to tutor:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending tutor confirmation:', error);
    return false;
  }
}

module.exports = {
  sendTutorNotifications,
  sendTutorConfirmation
};