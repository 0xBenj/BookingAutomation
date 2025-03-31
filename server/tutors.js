// Define tutor data per specific subject
const tutorsBySubject = {
  "Applied Mathematics for Management": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "federico.martino21@gmail.com", name: "Federico Martino" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "cire3310@gmail.com", name: "Eric Darasteanu" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" },
    { email: "gregoireduplessis7@gmail.com", name: "Grégoire du Plessis" }
  ],
  "Descriptive Statistics and Probability": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "romanemichaeli@gmail.com", name: "Romane Michaeli" },
    { email: "cire3310@gmail.com", name: "Eric Darasteanu" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" },
    { email: "marittaelsagore@gmail.com", name: "Maritta Gore" },
    { email: "simon.bahno@gmail.com", name: "Simon Bahno" },
    { email: "gabriella.mccann@icloud.com", name: "Gabriella McCann" }
  ],
  "Statistical Inference and Data Analysis": [
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
    { email: "marittaelsagore@gmail.com", name: "Maritta Gore" },
    { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" }
  ],
  "Basics of Financial Accounting": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "F.gesinski@gmail.com", name: "Filippa Gesinski" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    { email: "ginevra.fundaro@alumni.esade.edu", name: "Ginevra Fundaro" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "alvarobordacores@gmail.com", name: "Alvaro Borda" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "maximilian.kuehr@gmail.com", name: "Maximilian Kuehr" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" },
    { email: "jansalvariba@gmail.com", name: "Jan Salvador" }
  ],
  "Advanced Accounting": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    { email: "ginevra.fundaro@alumni.esade.edu", name: "Ginevra Fundaro" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "alvarobordacores@gmail.com", name: "Alvaro Borda" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "maximilian.kuehr@gmail.com", name: "Maximilian Kuehr" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" }
  ],
  "Microeconomics": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "federico.martino21@gmail.com", name: "Federico Martino" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "alejandrohernandeza30@gmail.com", name: "Alejandro Hernandez" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "alvarobordacores@gmail.com", name: "Alvaro Borda" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "cire3310@gmail.com", name: "Eric Darasteanu" },
    { email: "josepcubedo2005@gmail.com", name: "Josep Cubedo" }
  ],
  "Macroeconomics": [
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    { email: "ginevra.fundaro@alumni.esade.edu", name: "Ginevra Fundaro" },
    { email: "alejandrohernandeza30@gmail.com", name: "Alejandro Hernandez" },
    { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
    { email: "romanemichaeli@gmail.com", name: "Romane Michaeli" },
    { email: "alvarobordacores@gmail.com", name: "Alvaro Borda" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" },
    { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" },
    { email: "simon.bahno@gmail.com", name: "Simon Bahno" }
  ],
  "Business Law": [
    { email: "temp2@jcnorris.com", name: "Norris" },
    { email: "benben113el@gmail.com", name: "Beni" },
    // { email: "federico.martino21@gmail.com", name: "Federico Martino" },
    // { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    // { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    // { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    // { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    // { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    // { email: "helena.durban@alumni.esade.edu", name: "Helena Durban" }
  ],
  "Tax Law": [
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "federico.martino21@gmail.com", name: "Federico Martino" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "helena.durban@alumni.esade.edu", name: "Helena Durbán" },
    { email: "simon.bahno@gmail.com", name: "Simon Bahno" }
  ],
  "Managing Digital Information": [
    { email: "mszeni@yahoo.com", name: "Mark Szeni" },
    { email: "nikosmichail.apostolakis@alumni.esade.edu", name: "Niko Apostolakis" },
    { email: "davidmontanepuig@gmail.com", name: "David Montané" },
    { email: "Marcobertaccini18@gmail.com", name: "Marco Bertaccini" },
    { email: "cire3310@gmail.com", name: "Eric Darasteanu" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
    { email: "josepcubedo2005@gmail.com", name: "Josep Cubedo" },
    { email: "jansalvariba@gmail.com", name: "Jan Salvador" },
    { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" }
  ],
  "Managerial Economics": [
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "federico.martino21@gmail.com", name: "Federico Martino" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "romanemichaeli@gmail.com", name: "Romane Michaeli" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
    { email: "jansalvariba@gmail.com", name: "Jan Salvador" },
    { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" },
    { email: "simon.bahno@gmail.com", name: "Simon Bahno" }
  ],
  "Financial Analysis": [
    { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
    { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasiljevic" },
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
    { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
    { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "jansalvariba@gmail.com", name: "Jan Salvador" },
    { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" },
    { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" }
  ],
  "Financial Economics": [
    { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
    { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" }
  ],
  "Spanish": [
    // { email: "martinkohan81@gmail.com", name: "Martin Kohan" }
    { email: "benben113el@gmail.com", name: "Beni" },
  ],
  "English": [
    { email: "elishakov77@gmail.com", name: "Benjjj" },
    // { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
    // { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
    // { email: "albertomilone8@gmail.com", name: "Alberto Milone" }
  ],
  "German": [
    { email: "F.gesinski@gmail.com", name: "Filippa Gesinski" },
    { email: "antoinemuller44@gmail.com", name: "Antoine Muller" }
  ]
};

/**
 * Get tutors for a specific subject
 * @param {string} subject - The subject name
 * @returns {Array} - Array of tutor objects with email and name
 */
function getTutorsForSubject(subject) {
  return tutorsBySubject[subject] || [];
}

/**
 * Get tutor emails for a specific subject
 * @param {string} subject - The subject name
 * @returns {Array} - Array of tutor email addresses
 */
function getTutorEmailsForSubject(subject) {
  const tutors = getTutorsForSubject(subject);
  return tutors.map(tutor => tutor.email);
}

module.exports = {
  tutorsBySubject,
  getTutorsForSubject,
  getTutorEmailsForSubject
};