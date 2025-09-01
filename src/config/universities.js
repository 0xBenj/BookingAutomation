// University configuration with UI-specific data
const universitiesData = {
  'lycee': {
    name: 'Lycée Français de Barcelone',
    slug: 'lycee',
    theme: {
      primary: '#C6007E',
      secondary: '#FF6B9D',
      gradient: 'linear-gradient(135deg, #C6007E 0%, #FF6B9D 100%)'
    },
    content: {
      heroTitle: 'Join our Solo, Duo, Trio or Quadrio Classes!',
      heroSubtitle: 'Learn Now, Excel Tomorrow!',
      heroDescription: 'Interested in joining our classes? Fill out some information and we will be in touch shortly!'
    },
    subjects: [
      { value: "Mathematics", label: "Mathematics", calendarVar: "LYCEE_MATHEMATICS_CALENDAR_ID" },
      { value: "Physics", label: "Physics", calendarVar: "LYCEE_PHYSICS_CALENDAR_ID" },
      { value: "French Literature", label: "French Literature", calendarVar: "LYCEE_FRENCH_LITERATURE_CALENDAR_ID" },
      { value: "Geography", label: "Geography", calendarVar: "LYCEE_GEOGRAPHY_CALENDAR_ID" },
      { value: "Economics", label: "Economics", calendarVar: "LYCEE_ECONOMICS_CALENDAR_ID" }
    ],
    tutors: {
      "Mathematics": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "luna.carrillo@lycee.com", name: "Luna Carrillo" },
        { email: "martin.carrasco@lycee.com", name: "Martin Carrasco" },
        { email: "tammy.broader@lycee.com", name: "Tammy Broader" }
      ],
      "Physics": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "luna.carrillo@lycee.com", name: "Luna Carrillo" }
      ],
      "French Literature": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "luna.carrillo@lycee.com", name: "Luna Carrillo" }
      ],
      "Geography": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "tammy.broader@lycee.com", name: "Tammy Broader" }
      ],
      "Economics": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "martin.carrasco@lycee.com", name: "Martin Carrasco" },
        { email: "tammy.broader@lycee.com", name: "Tammy Broader" }
      ]
    }
  },
  'esade': {
    name: 'ESADE Business School',
    slug: 'esade',
    theme: {
      primary: '#000C40',
      secondary: '#1A237E',
      gradient: 'linear-gradient(135deg, #000C40 0%, #1A237E 100%)'
    },
    content: {
      heroTitle: 'Join our Solo, Duo, Trio or Quadrio Classes!',
      heroSubtitle: 'Excel in Business, Lead Tomorrow!',
      heroDescription: 'Interested in joining our classes? Fill out some information and we will be in touch shortly!'
    },
    subjects: [
      { value: "Applied Mathematics for Management", label: "Applied Mathematics for Management", calendarVar: "APPLIED_MATHEMATICS_CALENDAR_ID" },
      { value: "Descriptive Statistics and Probability", label: "Descriptive Statistics and Probability", calendarVar: "DESCRIPTIVE_STATISTICS_CALENDAR_ID" },
      { value: "Basics of Financial Accounting", label: "Basics of Financial Accounting", calendarVar: "FINANCIAL_ACCOUNTING_BASICS_CALENDAR_ID" },
      { value: "Advanced Accounting", label: "Advanced Accounting", calendarVar: "ADVANCED_ACCOUNTING_CALENDAR_ID" },
      { value: "Microeconomics", label: "Microeconomics", calendarVar: "MICROECONOMICS_CALENDAR_ID" },
      { value: "Macroeconomics", label: "Macroeconomics", calendarVar: "MACROECONOMICS_CALENDAR_ID" },
      { value: "Business Law", label: "Business Law", calendarVar: "BUSINESS_LAW_CALENDAR_ID" },
      { value: "Tax Law", label: "Tax Law", calendarVar: "TAX_LAW_CALENDAR_ID" },
      { value: "Managing Digital Information", label: "Managing Digital Information", calendarVar: "DIGITAL_INFORMATION_CALENDAR_ID" },
      { value: "Statistical Inference and Data Analysis", label: "Statistical Inference and Data Analysis", calendarVar: "STATISTICAL_INFERENCE_CALENDAR_ID" },
      { value: "Managerial Economics", label: "Managerial Economics", calendarVar: "MANAGERIAL_ECONOMICS_CALENDAR_ID" },
      { value: "Financial Analysis", label: "Financial Analysis", calendarVar: "FINANCIAL_ANALYSIS_CALENDAR_ID" },
      { value: "Financial Economics", label: "Financial Economics", calendarVar: "FINANCIAL_ECONOMICS_CALENDAR_ID" },
      { value: "Information Systems", label: "Information Systems", calendarVar: "INFORMATION_SYSTEMS_CALENDAR_ID" },
      { value: "English", label: "English", calendarVar: "ENGLISH_CALENDAR_ID" },
      { value: "Spanish", label: "Spanish", calendarVar: "SPANISH_CALENDAR_ID" },
      { value: "German", label: "German", calendarVar: "GERMAN_CALENDAR_ID" }
    ],
    tutors: {
      "Applied Mathematics for Management": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "albertomilone8@gmail.com", name: "Alberto Milone" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
        { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
        { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" },
        { email: "marittaelsagore@gmail.com", name: "Maritta Gore" },
        { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" }
      ],
      "Basics of Financial Accounting": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "temp2@jcnorris.com", name: "Norris" },
        { email: "benben113el@gmail.com", name: "Beni" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "federico.martino21@gmail.com", name: "Federico Martino" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
        { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
        { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
        { email: "helena.durban@alumni.esade.edu", name: "Helena Durban" }
      ],
      "Tax Law": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "marcpigemstyle8@gmail.com", name: "Marc Piggem" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "federico.martino21@gmail.com", name: "Federico Martino" },
        { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
        { email: "giuseppeleonardo.mazza@alumni.esade.edu", name: "Giuseppe Mazza" },
        { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
        { email: "helena.durban@alumni.esade.edu", name: "Helena Durbán" },
        { email: "simon.bahno@gmail.com", name: "Simon Bahno" }
      ],
      "Managing Digital Information": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
        { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
        { email: "federico.martino21@gmail.com", name: "Federico Martino" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
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
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "Achille.zerbib@gmail.com", name: "Achille Zerbib" },
        { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
        { email: "vasiljevicvukasin0@gmail.com", name: "Vukasin Vasilijevic" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" },
        { email: "marcos.delcura@alumni.esade.edu", name: "Marcos del Cura" },
        { email: "joanbatllorius@gmail.com", name: "Joan Batllo" },
        { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
        { email: "jansalvariba@gmail.com", name: "Jan Salvador" },
        { email: "marco.morchio0505@gmail.com", name: "Marco Morchio" },
        { email: "martintuancarrasco@gmail.com", name: "Martin Carrasco" }
      ],
      "Financial Economics": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "alessandroromeo554@gmail.com", name: "Alessandro Romeo" },
        { email: "flavia.santi@alumni.esade.edu", name: "Flavia Santi" }
      ],
      "Information Systems": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" }
      ],
      "English": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "elishakov77@gmail.com", name: "Benjjj" },
        { email: "nourbishouty@gmail.com", name: "Nour Bishouty" },
        { email: "giorgio.goretti05@gmail.com", name: "Giorgio Goretti" },
        { email: "albertomilone8@gmail.com", name: "Alberto Milone" }
      ],
      "Spanish": [
        { email: "tutorlynow@gmail.com", name: "Tutorly" },
        { email: "martinkohan81@gmail.com", name: "Martin Kohan" },
        { email: "benben113el@gmail.com", name: "Beni" }
      ],
      "German": [
        { email: "F.gesinski@gmail.com", name: "Filippa Gesinski" },
        { email: "antoinemuller44@gmail.com", name: "Antoine Muller" }
      ]
    }
  }
};

// Helper function to get university config by slug
export const getUniversityConfig = (slug) => {
  return universitiesData[slug] || null;
};

// Helper function to get all university slugs
export const getAllUniversitySlugs = () => {
  return Object.keys(universitiesData);
};

// Helper function to check if slug is valid
export const isValidUniversitySlug = (slug) => {
  return slug in universitiesData;
};

export default universitiesData;