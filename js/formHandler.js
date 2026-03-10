/* ============================================================
   formHandler.js — Form Reading, Validation & State Management
   CV Generator | Reads inputs, validates required fields,
                  shows inline error messages, manages dynamic
                  entry cards, skill tags, and live updates.
   ============================================================ */


/* ─── Live Update ─────────────────────────────────────────────
   Single delegated listener on the form panel.
   Every keystroke → readAllFormData() → renderCV().
   Covers all fields including dynamically added cards.
   ──────────────────────────────────────────────────────────── */
function initLiveUpdates() {
  const formPanel = document.querySelector('.form-panel');
  if (!formPanel) return;

  formPanel.addEventListener('input',  handleLiveUpdate);
  formPanel.addEventListener('change', handleLiveUpdate);
}

function handleLiveUpdate(event) {
  if (event.target.tagName === 'BUTTON') return;

  // Clear the error on a field as soon as the user starts typing
  clearFieldError(event.target);

  readAllFormData();
  renderCV();
}


/* ─── Validation ───────────────────────────────────────────────
   Checks that the minimum required fields are filled before
   allowing a "Generate CV" / print action.

   Required fields:
   - First Name
   - Last Name
   - Email

   Returns true if valid, false if there are errors.
   Scrolls to and highlights the first invalid field.
   ──────────────────────────────────────────────────────────── */
function validateForm() {
  // Clear any previous errors first
  clearAllErrors();

  const rules = [
    {
      id:      'first-name',
      message: 'Please enter your first name.',
    },
    {
      id:      'last-name',
      message: 'Please enter your last name.',
    },
    {
      id:      'email',
      message: 'Please enter your email address.',
      extra:   (val) => {
        // Additional format check for email
        if (val && !isValidEmail(val)) {
          return 'Please enter a valid email address (e.g. jane@example.com).';
        }
        return null;
      },
    },
  ];

  let firstErrorField = null;
  let hasErrors       = false;

  rules.forEach(rule => {
    const field = document.getElementById(rule.id);
    if (!field) return;

    const value = field.value.trim();

    // Check if empty
    if (!value) {
      showFieldError(field, rule.message);
      hasErrors = true;
      if (!firstErrorField) firstErrorField = field;
      return;
    }

    // Run extra validation if provided (e.g. email format)
    if (rule.extra) {
      const extraError = rule.extra(value);
      if (extraError) {
        showFieldError(field, extraError);
        hasErrors = true;
        if (!firstErrorField) firstErrorField = field;
      }
    }
  });

  // Switch to Personal tab and scroll to the first error
  if (firstErrorField) {
    switchToTab('section-personal');
    setTimeout(() => {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorField.focus();
    }, 100);
  }

  return !hasErrors;
}


/* ─── Show / Clear Field Errors ───────────────────────────────
   showFieldError — adds error class to input + injects message
   clearFieldError — removes error state when user types
   clearAllErrors  — wipes all errors (called before re-validate)
   ──────────────────────────────────────────────────────────── */
function showFieldError(field, message) {
  field.classList.add('input-error');

  // Only add error message element if not already there
  const existing = field.parentElement.querySelector('.error-message');
  if (existing) {
    existing.textContent = message;
    return;
  }

  const errorEl       = document.createElement('span');
  errorEl.className   = 'error-message';
  errorEl.textContent = message;
  errorEl.setAttribute('role', 'alert');
  field.parentElement.appendChild(errorEl);
}

function clearFieldError(field) {
  if (!field || !field.classList) return;
  field.classList.remove('input-error');
  const errorEl = field.parentElement?.querySelector('.error-message');
  if (errorEl) errorEl.remove();
}

function clearAllErrors() {
  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
  document.querySelectorAll('.error-message').forEach(el => el.remove());
}


/* ─── Tab Navigation ──────────────────────────────────────────
   Switches between form sections.
   switchToTab() is also used by validateForm() to jump to
   the Personal tab when required fields are missing.
   ──────────────────────────────────────────────────────────── */
function initTabs() {
  const tabButtons = document.querySelectorAll('.section-nav button');
  const sections   = document.querySelectorAll('.form-section');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      sections.forEach(section => section.classList.remove('active'));

      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      const targetId = button.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });
}

/* Programmatically switch to a tab by its section id */
function switchToTab(sectionId) {
  const targetBtn = document.querySelector(
    `.section-nav button[data-target="${sectionId}"]`
  );
  if (targetBtn) targetBtn.click();
}


/* ─── Read Personal Information ───────────────────────────────*/
function readPersonal() {
  cvData.personal = {
    firstName: getValue('first-name'),
    lastName:  getValue('last-name'),
    jobTitle:  getValue('job-title'),
    email:     getValue('email'),
    phone:     getValue('phone'),
    location:  getValue('location'),
    website:   getValue('website'),
    linkedin:  getValue('linkedin'),
  };
}

/* ─── Read Profile Summary ─────────────────────────────────── */
function readSummary() {
  cvData.summary = getValue('summary');
}

/* ─── Read Education Entries ─────────────────────────────────*/
function readEducation() {
  cvData.education = [];
  const cards = document.querySelectorAll('#education-entries .entry-card');
  cards.forEach(card => {
    const degree      = getCardValue(card, 'edu-degree');
    const institution = getCardValue(card, 'edu-institution');
    const start       = getCardValue(card, 'edu-start');
    const end         = getCardValue(card, 'edu-end');
    const notes       = getCardValue(card, 'edu-notes');
    if (degree || institution) {
      cvData.education.push({ degree, institution, start, end, notes });
    }
  });
}

/* ─── Read Work Experience Entries ──────────────────────────*/
function readExperience() {
  cvData.experience = [];
  const cards = document.querySelectorAll('#experience-entries .entry-card');
  cards.forEach(card => {
    const title   = getCardValue(card, 'exp-title');
    const company = getCardValue(card, 'exp-company');
    const start   = getCardValue(card, 'exp-start');
    const end     = getCardValue(card, 'exp-end');
    const desc    = getCardValue(card, 'exp-desc');
    if (title || company) {
      cvData.experience.push({ title, company, start, end, desc });
    }
  });
}

/* ─── Read Project Entries ───────────────────────────────────*/
function readProjects() {
  cvData.projects = [];
  const cards = document.querySelectorAll('#project-entries .entry-card');
  cards.forEach(card => {
    const name  = getCardValue(card, 'proj-name');
    const stack = getCardValue(card, 'proj-stack');
    const url   = getCardValue(card, 'proj-url');
    const desc  = getCardValue(card, 'proj-desc');
    if (name) {
      cvData.projects.push({ name, stack, url, desc });
    }
  });
}

/* ─── Read ALL Form Data ─────────────────────────────────────*/
function readAllFormData() {
  readPersonal();
  readSummary();
  readEducation();
  readExperience();
  readProjects();
}


/* ─── Skills Tag Input ─────────────────────────────────────────
   Tag-based skill input. Enter or comma adds a tag.
   Skills are kept in sync with cvData.skills in real time.
   ──────────────────────────────────────────────────────────── */
function initSkillsInput() {
  const input     = document.getElementById('skill-input');
  const container = document.getElementById('skills-tags-container');
  if (!input || !container) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkillTag(input.value);
      input.value = '';
    }
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      addSkillTag(input.value);
      input.value = '';
    }
  });

  function addSkillTag(rawValue) {
    const skill = rawValue.replace(',', '').trim();
    if (!skill) return;

    const isDuplicate = cvData.skills.some(
      s => s.toLowerCase() === skill.toLowerCase()
    );
    if (isDuplicate) {
      highlightDuplicate();
      return;
    }

    cvData.skills.push(skill);

    const tag     = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${escapeHtml(skill)} <span class="remove-tag" aria-label="Remove ${escapeHtml(skill)}">×</span>`;

    tag.querySelector('.remove-tag').addEventListener('click', () => {
      cvData.skills = cvData.skills.filter(s => s !== skill);
      tag.remove();
      renderCV();
    });

    container.appendChild(tag);
    renderCV();
  }

  function highlightDuplicate() {
    container.style.borderColor = '#ff6b6b';
    setTimeout(() => { container.style.borderColor = ''; }, 800);
  }
}


/* ─── Dynamic Entry Cards ────────────────────────────────────*/
function initDynamicEntries() {
  document.getElementById('add-education')?.addEventListener('click', () => {
    addEntry('education-entries', 'education', educationCardTemplate);
  });
  document.getElementById('add-experience')?.addEventListener('click', () => {
    addEntry('experience-entries', 'experience', experienceCardTemplate);
  });
  document.getElementById('add-project')?.addEventListener('click', () => {
    addEntry('project-entries', 'project', projectCardTemplate);
  });
}

function addEntry(containerId, type, templateFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const entryNumber = container.querySelectorAll('.entry-card').length + 1;
  const wrapper     = document.createElement('div');
  wrapper.innerHTML = templateFn(entryNumber);

  const newCard = wrapper.firstElementChild;

  // Animate the card in
  newCard.style.opacity   = '0';
  newCard.style.transform = 'translateY(12px)';

  wireRemoveButton(newCard, container);
  container.appendChild(newCard);

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    newCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    newCard.style.opacity    = '1';
    newCard.style.transform  = 'translateY(0)';
  });

  const firstInput = newCard.querySelector('input, textarea');
  if (firstInput) firstInput.focus();
}

function wireRemoveButton(card, container) {
  const removeBtn = card.querySelector('.btn-remove');
  if (!removeBtn) return;

  removeBtn.addEventListener('click', () => {
    // Animate card out before removing
    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(-8px)';

    setTimeout(() => {
      card.remove();
      relabelCards(container);
      readAllFormData();
      renderCV();
    }, 200);
  });
}

function relabelCards(container) {
  container.querySelectorAll('.entry-card').forEach((card, index) => {
    const label = card.querySelector('.entry-card-label');
    if (label) label.textContent = `Entry ${index + 1}`;
  });
}

function initExistingRemoveButtons() {
  document.querySelectorAll('.entry-card').forEach(card => {
    const container = card.closest('[id$="-entries"]');
    if (container) wireRemoveButton(card, container);
  });
}


/* ─── Card HTML Templates ────────────────────────────────────*/
function educationCardTemplate(number) {
  return `
    <div class="entry-card" data-entry="education">
      <div class="entry-card-header">
        <span class="entry-card-label">Entry ${number}</span>
        <button class="btn-remove" aria-label="Remove this entry">✕ Remove</button>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Degree / Qualification</label>
          <input type="text" name="edu-degree" placeholder="e.g. B.Sc. Computer Science" />
        </div>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Institution</label>
          <input type="text" name="edu-institution" placeholder="e.g. University of Lagos" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start Year</label>
          <input type="text" name="edu-start" placeholder="e.g. 2018" />
        </div>
        <div class="form-group">
          <label>End Year</label>
          <input type="text" name="edu-end" placeholder="e.g. 2022" />
        </div>
      </div>
      <div class="form-group">
        <label>Notes <span class="label-optional">(optional)</span></label>
        <textarea name="edu-notes" rows="2" placeholder="e.g. First Class Honours, Dean's List"></textarea>
      </div>
    </div>`;
}

function experienceCardTemplate(number) {
  return `
    <div class="entry-card" data-entry="experience">
      <div class="entry-card-header">
        <span class="entry-card-label">Entry ${number}</span>
        <button class="btn-remove" aria-label="Remove this entry">✕ Remove</button>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Job Title</label>
          <input type="text" name="exp-title" placeholder="e.g. Frontend Engineer" />
        </div>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Company</label>
          <input type="text" name="exp-company" placeholder="e.g. Acme Corp" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start Date</label>
          <input type="text" name="exp-start" placeholder="e.g. Jan 2022" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input type="text" name="exp-end" placeholder="e.g. Present" />
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea name="exp-desc" rows="4" placeholder="e.g. Built and maintained React components, improved page load speed by 40%…"></textarea>
      </div>
    </div>`;
}

function projectCardTemplate(number) {
  return `
    <div class="entry-card" data-entry="project">
      <div class="entry-card-header">
        <span class="entry-card-label">Entry ${number}</span>
        <button class="btn-remove" aria-label="Remove this entry">✕ Remove</button>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" name="proj-name" placeholder="e.g. Personal Portfolio" />
        </div>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Tech Stack</label>
          <input type="text" name="proj-stack" placeholder="e.g. React, Node.js, PostgreSQL" />
        </div>
      </div>
      <div class="form-row full">
        <div class="form-group">
          <label>Live URL / Repo <span class="label-optional">(optional)</span></label>
          <input type="url" name="proj-url" placeholder="e.g. https://github.com/you/project" />
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea name="proj-desc" rows="3" placeholder="e.g. A tool that generates CVs from a web form and exports to PDF…"></textarea>
      </div>
    </div>`;
}


/* ─── Utility Helpers ────────────────────────────────────────*/
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getCardValue(card, name) {
  const el = card.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  // Simple but effective email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}