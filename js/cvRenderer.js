/* ============================================================
   cvRenderer.js — CV Preview Renderer
   CV Generator | Reads cvData and builds the CV preview.

   Two render modes:
   - renderCV()        → silent update (live typing, no flash)
   - renderCV(true)    → animated update (Generate CV button only)
   ============================================================ */


/* ─── Main Render Function ─────────────────────────────────────
   animate = false  → just swap the content silently (default)
                      used for every live keystroke update
   animate = true   → fade+slide in, used only when the user
                      clicks the "Generate CV" button
   ──────────────────────────────────────────────────────────── */
function renderCV(animate = false) {
  const output = document.getElementById('cv-output');
  if (!output) return;

  const html = `
    ${renderHeader()}
    ${renderSummary()}
    ${renderSkills()}
    ${renderExperience()}
    ${renderEducation()}
    ${renderProjects()}
  `.trim();

  if (!html) {
    showEmptyState(output);
    return;
  }

  if (animate) {
    // Full fade+stagger animation — only on Generate CV click
    output.style.transition = 'opacity 0.15s ease';
    output.style.opacity    = '0';

    setTimeout(() => {
      output.innerHTML    = html;
      output.style.opacity = '1';
      output.classList.add('cv-rendered');
      setTimeout(() => output.classList.remove('cv-rendered'), 500);
    }, 150);

  } else {
    // Silent update — content swaps instantly, no flicker or flash
    // Preserves scroll position so the user doesn't lose their place
    const scrollTop = output.closest('.preview-panel')?.scrollTop || 0;
    output.innerHTML = html;
    if (output.closest('.preview-panel')) {
      output.closest('.preview-panel').scrollTop = scrollTop;
    }
  }
}


/* ─── Render: Header ───────────────────────────────────────── */
function renderHeader() {
  const p        = cvData.personal;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');

  if (!fullName && !p.jobTitle && !p.email) return '';

  const contactItems = [
    p.email    ? `<span>✉ ${esc(p.email)}</span>`                                                                   : '',
    p.phone    ? `<span>✆ ${esc(p.phone)}</span>`                                                                   : '',
    p.location ? `<span>⌖ ${esc(p.location)}</span>`                                                                : '',
    p.website  ? `<span>🔗 <a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website)}</a></span>` : '',
    p.linkedin ? `<span>in <a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></span>`         : '',
  ].filter(Boolean).join('');

  return `
    <header class="cv-header">
      ${fullName     ? `<h1 class="cv-name">${esc(fullName)}</h1>`       : ''}
      ${p.jobTitle   ? `<p class="cv-job-title">${esc(p.jobTitle)}</p>`  : ''}
      ${contactItems ? `<div class="cv-contact">${contactItems}</div>`   : ''}
    </header>
  `;
}


/* ─── Render: Profile Summary ──────────────────────────────── */
function renderSummary() {
  if (!cvData.summary) return '';
  return `
    <section class="cv-section">
      <h2 class="cv-section-title">Profile</h2>
      <p class="cv-summary">${esc(cvData.summary)}</p>
    </section>
  `;
}


/* ─── Render: Skills ───────────────────────────────────────── */
function renderSkills() {
  if (!cvData.skills.length) return '';

  const tags = cvData.skills
    .map(skill => `<span class="cv-skill-tag">${esc(skill)}</span>`)
    .join('');

  return `
    <section class="cv-section">
      <h2 class="cv-section-title">Skills</h2>
      <div class="cv-skills-list">${tags}</div>
    </section>
  `;
}


/* ─── Render: Work Experience ──────────────────────────────── */
function renderExperience() {
  if (!cvData.experience.length) return '';

  const entries = cvData.experience.map(job => {
    const dateRange = formatDateRange(job.start, job.end);
    return `
      <div class="cv-entry">
        <div class="cv-entry-header">
          <span class="cv-entry-title">${esc(job.title)}</span>
          ${dateRange ? `<span class="cv-entry-date">${esc(dateRange)}</span>` : ''}
        </div>
        ${job.company ? `<div class="cv-entry-sub">${esc(job.company)}</div>` : ''}
        ${job.desc    ? `<p class="cv-entry-desc">${esc(job.desc)}</p>`       : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="cv-section">
      <h2 class="cv-section-title">Experience</h2>
      ${entries}
    </section>
  `;
}


/* ─── Render: Education ────────────────────────────────────── */
function renderEducation() {
  if (!cvData.education.length) return '';

  const entries = cvData.education.map(edu => {
    const dateRange = formatDateRange(edu.start, edu.end);
    return `
      <div class="cv-entry">
        <div class="cv-entry-header">
          <span class="cv-entry-title">${esc(edu.degree)}</span>
          ${dateRange ? `<span class="cv-entry-date">${esc(dateRange)}</span>` : ''}
        </div>
        ${edu.institution ? `<div class="cv-entry-sub">${esc(edu.institution)}</div>` : ''}
        ${edu.notes       ? `<p class="cv-entry-desc">${esc(edu.notes)}</p>`           : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="cv-section">
      <h2 class="cv-section-title">Education</h2>
      ${entries}
    </section>
  `;
}


/* ─── Render: Projects ─────────────────────────────────────── */
function renderProjects() {
  if (!cvData.projects.length) return '';

  const entries = cvData.projects.map(proj => {
    return `
      <div class="cv-entry">
        <div class="cv-entry-header">
          <span class="cv-entry-title">${esc(proj.name)}</span>
        </div>
        ${proj.stack ? `<div class="cv-entry-stack">${esc(proj.stack)}</div>`                                                 : ''}
        ${proj.desc  ? `<p class="cv-entry-desc">${esc(proj.desc)}</p>`                                                       : ''}
        ${proj.url   ? `<a class="cv-entry-link" href="${esc(proj.url)}" target="_blank" rel="noopener">${esc(proj.url)}</a>` : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="cv-section">
      <h2 class="cv-section-title">Projects</h2>
      ${entries}
    </section>
  `;
}


/* ─── Empty State ──────────────────────────────────────────── */
function showEmptyState(container) {
  container.innerHTML = `
    <div class="cv-empty" id="cv-empty-state">
      <div class="empty-icon">📄</div>
      <p>Start filling in the form on the left — your CV will appear here instantly.</p>
    </div>
  `;
}


/* ─── Utility Helpers ──────────────────────────────────────── */
function esc(str) {
  return String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function formatDateRange(start, end) {
  if (start && end)  return `${start} – ${end}`;
  if (start && !end) return start;
  if (!start && end) return end;
  return '';
}