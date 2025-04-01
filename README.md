# Tutorly

<img src="./logo.svg" alt="Tutorly Logo" width="200"/>

## Project Overview

Tutorly is a platform designed to connect students with tutors for personalized learning experiences. The application helps students find qualified tutors in various subjects, schedule sessions, and manage their learning journey efficiently. Tutors can manage their availability, connect with students, and grow their tutoring business.

### Key Features
- Student-tutor matching based on subject needs
- Scheduling and calendar integration
- Automated tutor assignment system
- Secure payment processing via Stripe
- Dynamic pricing based on class size and duration
- Email notifications for both students and tutors
- Session tracking and progress reporting

## System Architecture

The Tutorly booking system uses a modern architecture with several integrated components:

![Tutorly Booking System Architecture](./BookingSystem-Architecture.png)

### Data Flow

The system's data flow illustrates how information moves through the application:

![Tutorly Booking System Data Flow](./BookingSystem-DataFlow.png)

## Technology Stack

### Frontend
- React.js
- TypeScript
- Stripe Elements for payment UI
- CSS for styling
- Hosted on Firebase

### Backend
- Node.js with Express.js
- Google Calendar API for scheduling
- Google Sheets API for data storage
- Nodemailer for email notifications
- Stripe API for payment processing
- Deployed on Render

## Environment Setup

For the application to work correctly, you need to set up the following environment variables:

### Client-side Environment Variables
Create a `.env.local` file in the project root with:
```
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### Server-side Environment Variables
Create a `.env` file in the server directory with:
```
# Server Configuration
PORT=3001

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Sheets
SPREADSHEET_ID=your_google_spreadsheet_id
SHEET_NAME=Bookings

# Google Calendar IDs
GOOGLE_CALENDAR_ID=your_main_calendar_id@group.calendar.google.com
MATH_CALENDAR_ID=your_math_calendar_id@group.calendar.google.com
ACCOUNTING_CALENDAR_ID=your_accounting_calendar_id@group.calendar.google.com
ECONOMICS_CALENDAR_ID=your_economics_calendar_id@group.calendar.google.com
# Add other subject-specific calendar IDs as needed

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Important Notes:**
1. Never commit your actual API keys to version control
2. The Stripe key prefixes should be:
   - For test mode: pk_test_... and sk_test_...
   - For production: pk_live_... and sk_live_...
3. The Google private key needs proper formatting with `\n` for newlines
4. For Gmail, use an app-specific password rather than your account password

## Calendar Monitoring System

The system includes an automated calendar monitoring service that:
- Runs every minute to check for changes in calendar events
- Detects when tutors claim unassigned sessions
- Updates event status from "UNASSIGNED" to "ASSIGNED"
- Sends email notifications to tutors with student contact details
- Prevents double-booking by removing events from other tutors' calendars

## Installation and Setup

1. Clone the repository
   ```
   git clone https://github.com/your-username/tutorly.git
   cd tutorly
   ```

2. Install dependencies for client
   ```
   npm install
   ```

3. Install dependencies for server
   ```
   cd server
   npm install
   cd ..
   ```

4. Create and configure environment files as described above

5. Start the development servers
   ```
   # In one terminal (client)
   npm start
   
   # In another terminal (server)
   cd server
   npm start
   ```

## Development Information

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### Server Scripts

In the server directory, you can run:

#### `npm start`

Starts the Express server in development mode using nodemon for automatic reloading.

#### `npm run start:prod`

Starts the Express server in production mode.

## Deployment

### Frontend Deployment (Firebase)
1. Build the React application
   ```
   npm run build
   ```

2. Deploy to Firebase
   ```
   firebase deploy
   ```

### Backend Deployment (Render)
1. Push your code to GitHub
2. Connect your Render account to your GitHub repository
3. Configure the environment variables in the Render dashboard
4. Deploy the server

## Project Structure

```
tutorly/
├── public/             # Static files
├── src/                # React client code
│   ├── components/     # React components
│   │   └── BookingForm.jsx  # Main booking form component
│   ├── data/           # Data files including tutor information
│   ├── App.js          # Main App component
│   └── index.js        # Entry point
├── server/             # Express server code
│   ├── services/       # Service modules
│   │   ├── calendar.js # Google Calendar integration
│   │   ├── sheets.js   # Google Sheets integration
│   │   └── mailer.js   # Email service
│   ├── tutors.js       # Tutor management module
│   └── Server.js       # Main server file
├── .env.local          # Client environment variables
├── server/.env         # Server environment variables
├── BookingSystem-Architecture.png  # Architecture diagram
├── BookingSystem-DataFlow.png      # Data flow diagram
└── README.md           # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Google APIs](https://developers.google.com/apis-explorer)
- [Stripe](https://stripe.com/)
- [Firebase](https://firebase.google.com/)
- [Render](https://render.com/)
