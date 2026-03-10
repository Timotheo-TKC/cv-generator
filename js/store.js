/* ============================================================
   store.js — Single Source of Truth
   CV Generator | Holds all CV data in one place
   ============================================================

   This is the central data object for the entire app.
   All form data is written here first, then cvRenderer.js
   reads from here to build the CV preview.

   Think of it like a simple in-memory database.
   ============================================================ */

const cvData = {

  /* Personal Information */
  personal: {
    firstName:  '',
    lastName:   '',
    jobTitle:   '',
    email:      '',
    phone:      '',
    location:   '',
    website:    '',
    linkedin:   '',
  },

  /* Profile Summary */
  summary: '',

  /* Skills — array of strings e.g. ['JavaScript', 'React'] */
  skills: [],

  /* Education — array of objects */
  education: [
    /*  {
          degree:      'B.Sc. Computer Science',
          institution: 'University of Lagos',
          start:       '2018',
          end:         '2022',
          notes:       'First Class Honours'
        }
    */
  ],

  /* Work Experience — array of objects */
  experience: [
    /*  {
          title:   'Frontend Engineer',
          company: 'Acme Corp',
          start:   'Jan 2022',
          end:     'Present',
          desc:    'Built and maintained...'
        }
    */
  ],

  /* Projects — array of objects */
  projects: [
    /*  {
          name:  'CV Generator',
          stack: 'HTML, CSS, JavaScript',
          url:   'https://github.com/...',
          desc:  'A tool that...'
        }
    */
  ],

};