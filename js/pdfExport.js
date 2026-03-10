/* ============================================================
   pdfExport.js — Print & PDF Export
   CV Generator | Triggers the browser's native print dialog
                  which allows "Save as PDF"
   ============================================================

   How it works:
   The browser's window.print() opens the print dialog.
   Our @media print CSS in preview.css hides the form panel
   and renders only the CV card — so "Save as PDF" in the
   print dialog produces a clean, one-column PDF.

   No third-party library needed.
   ============================================================ */


/* ─── Print CV ─────────────────────────────────────────────────
   Called when the user clicks the "Print CV" button.

   Before printing we check that the CV has actually been
   generated. If the preview is still showing the empty state,
   we alert the user instead of printing a blank page.
   ──────────────────────────────────────────────────────────── */
function printCV() {
  const output    = document.getElementById('cv-output');
  const emptyState = document.getElementById('cv-empty-state');

  // If the empty state placeholder is still showing, stop.
  if (emptyState) {
    alert('Please fill in your details and click "Generate CV" before printing.');
    return;
  }

  // If the output container is completely empty, stop.
  if (!output || !output.innerHTML.trim()) {
    alert('Nothing to print yet. Click "Generate CV" first.');
    return;
  }

  // Small delay lets the browser finish any pending renders
  // before the print dialog opens.
  setTimeout(() => {
    window.print();
  }, 100);
}