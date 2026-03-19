/* ============================================================
   pdfExport.js — PDF Export with Backend API
   CV Generator | Handles PDF export through backend service
   
   Features:
   - Professional PDF generation using PDFShift
   - Export status tracking
   - Progress indication
   - Download management
   ============================================================ */

// API configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

/* ─── Export CV to PDF ───────────────────────────────────────────────
   Called when the user clicks the "Export to PDF" button.
   
   Process:
   1. Collect CV data from the form
   2. Send export request to backend
   3. Poll for export status
   4. Download PDF when ready
   ──────────────────────────────────────────────────────────────────── */
async function exportToPDF() {
  const output = document.getElementById('cv-output');
  const emptyState = document.getElementById('cv-empty-state');

  // Validate that CV has been generated
  if (emptyState) {
    alert('Please fill in your details and click "Generate CV" before exporting.');
    return;
  }

  if (!output || !output.innerHTML.trim()) {
    alert('Nothing to export yet. Click "Generate CV" first.');
    return;
  }

  // Show export modal/overlay
  showExportModal();

  try {
    // Collect CV data
    const cvData = collectCVData();
    
    // Request PDF export
    const exportResponse = await fetch(`${API_BASE_URL}/exports/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cvData: cvData,
        template: 'modern',
        options: {
          format: 'A4',
          orientation: 'portrait',
          margin: 'normal'
        }
      })
    });

    if (!exportResponse.ok) {
      const error = await exportResponse.json();
      throw new Error(error.error?.message || 'Export request failed');
    }

    const { data } = await exportResponse.json();
    
    // Poll for export status
    await pollExportStatus(data.exportId);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    hideExportModal();
    alert(`Failed to export PDF: ${error.message}`);
  }
}

/* ─── Poll Export Status ───────────────────────────────────────────────
   Continuously checks the export status until it's completed or failed.
   ──────────────────────────────────────────────────────────────────── */
async function pollExportStatus(exportId) {
  const maxAttempts = 60; // Maximum 5 minutes (60 * 5 seconds)
  let attempts = 0;

  const poll = async () => {
    attempts++;
    
    try {
      const response = await fetch(`${API_BASE_URL}/exports/${exportId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to check export status');
      }

      const { data } = await response.json();
      
      // Update progress
      updateExportProgress(data.status, data.progress);
      
      if (data.status === 'completed') {
        // Download the PDF
        await downloadPDF(exportId);
        hideExportModal();
        showSuccessMessage();
      } else if (data.status === 'failed') {
        hideExportModal();
        alert(`Export failed: ${data.error || 'Unknown error'}`);
      } else if (data.status === 'pending' || data.status === 'processing') {
        if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          hideExportModal();
          alert('Export is taking longer than expected. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Status polling error:', error);
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        hideExportModal();
        alert('Failed to check export status. Please try again.');
      }
    }
  };

  // Start polling
  poll();
}

/* ─── Download PDF ─────────────────────────────────────────────────────
   Downloads the generated PDF file.
   ──────────────────────────────────────────────────────────────────── */
async function downloadPDF(exportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/exports/${exportId}/download`);
    
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    // Create blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Generate filename
    const cvData = collectCVData();
    const fileName = cvData.personal?.fullName 
      ? `CV-${cvData.personal.fullName.replace(/\s+/g, '-')}.pdf`
      : `CV-${new Date().toISOString().split('T')[0]}.pdf`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  }
}

/* ─── Collect CV Data ───────────────────────────────────────────────────
   Gathers all CV data from the form fields.
   ──────────────────────────────────────────────────────────────────── */
function collectCVData() {
  const cvData = {
    personal: {},
    summary: '',
    skills: [],
    education: [],
    experience: [],
    projects: []
  };

  // Personal details
  const firstName = document.getElementById('first-name')?.value;
  const lastName = document.getElementById('last-name')?.value;
  cvData.personal = {
    fullName: `${firstName} ${lastName}`.trim(),
    jobTitle: document.getElementById('job-title')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    location: document.getElementById('location')?.value || '',
    website: document.getElementById('website')?.value || '',
    linkedin: document.getElementById('linkedin')?.value || '',
    github: document.getElementById('github')?.value || ''
  };

  // Summary
  cvData.summary = document.getElementById('summary')?.value || '';

  // Skills
  const skillTags = document.querySelectorAll('#skills-container .skill-tag');
  cvData.skills = Array.from(skillTags).map(tag => tag.textContent.trim());

  // Education
  const educationCards = document.querySelectorAll('.education-card');
  cvData.education = Array.from(educationCards).map(card => {
    const inputs = card.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach(input => {
      const name = input.name.replace('[]', '');
      data[name] = input.value;
    });
    return data;
  });

  // Experience
  const experienceCards = document.querySelectorAll('.experience-card');
  cvData.experience = Array.from(experienceCards).map(card => {
    const inputs = card.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach(input => {
      const name = input.name.replace('[]', '');
      data[name] = input.value;
    });
    return data;
  });

  // Projects
  const projectCards = document.querySelectorAll('.project-card');
  cvData.projects = Array.from(projectCards).map(card => {
    const inputs = card.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach(input => {
      const name = input.name.replace('[]', '');
      data[name] = input.value;
    });
    return data;
  });

  return cvData;
}

/* ─── Export Modal UI ───────────────────────────────────────────────────
   Shows/hides the export progress modal.
   ──────────────────────────────────────────────────────────────────── */
function showExportModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('export-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'export-modal';
    modal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <h3>Exporting CV to PDF</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p class="progress-text">Preparing your CV...</p>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #export-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
      }
      
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-content {
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        text-align: center;
        min-width: 300px;
      }
      
      .progress-container {
        margin-top: 20px;
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: #3b82f6;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .progress-text {
        margin-top: 10px;
        color: #64748b;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(modal);
}

function hideExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) {
    modal.remove();
  }
}

function updateExportProgress(status, progress) {
  const modal = document.getElementById('export-modal');
  if (!modal) return;
  
  const progressFill = modal.querySelector('.progress-fill');
  const progressText = modal.querySelector('.progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  if (progressText) {
    const messages = {
      pending: 'Preparing your CV...',
      processing: 'Generating PDF...',
      completed: 'Finalizing...'
    };
    progressText.textContent = messages[status] || 'Processing...';
  }
}

function showSuccessMessage() {
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'export-success-notification';
  notification.textContent = '✅ CV exported successfully!';
  
  const style = document.createElement('style');
  style.textContent = `
    .export-success-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/* ─── Print CV (Legacy) ─────────────────────────────────────────────────
   Kept for backward compatibility.
   ──────────────────────────────────────────────────────────────────── */
function printCV() {
  const output = document.getElementById('cv-output');
  const emptyState = document.getElementById('cv-empty-state');

  if (emptyState) {
    alert('Please fill in your details and click "Generate CV" before printing.');
    return;
  }

  if (!output || !output.innerHTML.trim()) {
    alert('Nothing to print yet. Click "Generate CV" first.');
    return;
  }

  setTimeout(() => {
    window.print();
  }, 100);
}