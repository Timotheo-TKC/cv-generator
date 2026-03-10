/* ============================================================
   app.js — Application Entry Point
   CV Generator | Initializes all modules and wires buttons.

   Key behaviour:
   - Typing in any field  → renderCV()        (silent, no flash)
   - Clicking Generate CV → renderCV(true)    (animated, scroll)
   ============================================================ */


document.addEventListener('DOMContentLoaded', () => {

  // 1. Tab navigation
  initTabs();

  // 2. Skill tag input
  initSkillsInput();

  // 3. Dynamic "+ Add" buttons
  initDynamicEntries();

  // 4. Remove buttons on default HTML cards
  initExistingRemoveButtons();

  // 5. Live updates — silent renderCV() on every keystroke
  initLiveUpdates();

  // 6. Generate CV button — animated renderCV(true) + scroll
  const generateBtn = document.getElementById('btn-generate');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  // 7. Print CV button — validates then prints
  const printBtn = document.getElementById('btn-print');
  if (printBtn) {
    printBtn.addEventListener('click', handlePrint);
  }

});


/* ─── Handle Generate ──────────────────────────────────────────
   Validates → animated render → scroll to top → flash button.
   The animate=true flag triggers the fade+stagger animation
   so the user gets a satisfying "reveal" when they click.
   ──────────────────────────────────────────────────────────── */
function handleGenerate() {
  const isValid = validateForm();
  if (!isValid) return;

  readAllFormData();
  renderCV(true); // ← animated reveal

  // Scroll preview to top so user sees full CV from the start
  const previewPanel = document.querySelector('.preview-panel');
  if (previewPanel) {
    previewPanel.scrollTo({ top: 0, behavior: 'smooth' });
  }

  flashButton(document.getElementById('btn-generate'), '✓ Generated!');
}


/* ─── Handle Print ─────────────────────────────────────────── */
function handlePrint() {
  const isValid = validateForm();
  if (!isValid) return;
  printCV();
}


/* ─── Flash Button Feedback ────────────────────────────────── */
function flashButton(btn, label = '✓ Done!') {
  if (!btn) return;
  const originalText = btn.textContent;
  btn.textContent    = label;
  btn.disabled       = true;
  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled    = false;
  }, 1500);
}