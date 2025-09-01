// Import university data from central config
const universitiesData = require('../src/config/universities.js');

/**
 * Get tutors for a specific subject from universities.js config
 * @param {string} subject - The subject name
 * @param {string} university - The university slug (esade/lycee), defaults to esade
 * @returns {Array} - Array of tutor objects with email and name
 */
function getTutorsForSubject(subject, university = 'esade') {
  const universityConfig = universitiesData.default[university];
  if (universityConfig && universityConfig.tutors && universityConfig.tutors[subject]) {
    return universityConfig.tutors[subject];
  }
  return [];
}

/**
 * Get tutor emails for a specific subject from universities.js config
 * @param {string} subject - The subject name
 * @param {string} university - The university slug (esade/lycee), defaults to esade
 * @returns {Array} - Array of tutor email addresses
 */
function getTutorEmailsForSubject(subject, university = 'esade') {
  const tutors = getTutorsForSubject(subject, university);
  return tutors.map(tutor => tutor.email);
}

// Legacy compatibility - get all tutors from all universities combined
const tutorsBySubject = {};
Object.keys(universitiesData.default).forEach(universitySlug => {
  const universityConfig = universitiesData.default[universitySlug];
  if (universityConfig.tutors) {
    Object.keys(universityConfig.tutors).forEach(subject => {
      if (!tutorsBySubject[subject]) {
        tutorsBySubject[subject] = [];
      }
      tutorsBySubject[subject] = tutorsBySubject[subject].concat(universityConfig.tutors[subject]);
    });
  }
});

module.exports = {
  tutorsBySubject,
  getTutorsForSubject,
  getTutorEmailsForSubject
};