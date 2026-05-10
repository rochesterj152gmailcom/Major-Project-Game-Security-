document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupCornerThemeToggle();
  setupSmoothScroll();
  setupQuiz();
  loadQuizStats();
  setupReportForm();
  setupSimulation();
  setupFormValidation();
  setupCardHoverEffects();
  setupFloatingLabels();
});

// ==================== MOBILE MENU ====================
function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (!menuButton || !nav) return;

  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("show");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    
    // Change menu icon based on state
    menuButton.textContent = isOpen ? "✕" : "☰";
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("show") && 
        !nav.contains(e.target) && 
        !menuButton.contains(e.target)) {
      nav.classList.remove("show");
      menuButton.textContent = "☰";
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

// ==================== CORNER THEME TOGGLE ====================
function setupCornerThemeToggle() {
  // Check if toggle already exists to avoid duplicates
  if (document.querySelector('.theme-toggle-corner')) return;
  
  // Create the corner toggle button
  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle-corner';
  toggle.innerHTML = '🌙';
  toggle.setAttribute('aria-label', 'Toggle dark/light mode');
  toggle.setAttribute('title', 'Switch between dark and light mode');
  
  // Add to body
  document.body.appendChild(toggle);
  
  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    toggle.innerHTML = '☀️';
    toggle.setAttribute('aria-label', 'Switch to light mode');
    toggle.setAttribute('title', 'Switch to light mode');
  }
  
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    toggle.innerHTML = isDark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Add a subtle animation
    toggle.style.transform = 'scale(1.2) rotate(15deg)';
    setTimeout(() => {
      toggle.style.transform = '';
    }, 200);
    
    // Show toast notification
    showToast(`${isDark ? 'Dark' : 'Light'} mode activated!`, 'info');
  });
  
  // Add hover effect with rotation
  toggle.addEventListener('mouseenter', () => {
    toggle.style.transform = 'scale(1.1) rotate(15deg)';
  });
  
  toggle.addEventListener('mouseleave', () => {
    toggle.style.transform = '';
  });
}

// ==================== SMOOTH SCROLLING ====================
function setupSmoothScroll() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without jumping
        history.pushState(null, null, targetId);
      }
    });
  });
}

// ==================== QUIZ FUNCTIONALITY ====================
function setupQuiz() {
  const quizForm = document.getElementById("quiz-form");
  const resultBox = document.getElementById("quiz-result");

  if (!quizForm || !resultBox) return;
  
  // Add progress tracking to quiz
  addQuizProgressBar(quizForm);
  
  // Update progress when answers change
  const radioButtons = quizForm.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => updateQuizProgress(quizForm));
  });

  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    
    // Set button loading state
    const submitBtn = quizForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const answers = {
      q1: "b",
      q2: "c",
      q3: "a",
      q4: "b",
      q5: "a"
    };

    let score = 0;
    let allAnswered = true;

    Object.keys(answers).forEach((question) => {
      const selected = quizForm.querySelector(`input[name="${question}"]:checked`);
      if (!selected) {
        allAnswered = false;
      } else if (selected.value === answers[question]) {
        score++;
      }
    });

    if (!allAnswered) {
      showAlert(resultBox, "Please answer all questions before submitting the quiz.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    const total = Object.keys(answers).length;
    const percentage = Math.round((score / total) * 100);
    const feedback = getQuizFeedback(percentage);

    localStorage.setItem("quizScore", `${score}/${total}`);
    const attempts = Number(localStorage.getItem("quizAttempts") || "0") + 1;
    localStorage.setItem("quizAttempts", String(attempts));

    showAlert(
      resultBox,
      `You scored ${score} out of ${total} (${percentage}%). ${feedback}`,
      "success"
    );
    
    // Show detailed feedback with confetti for perfect score
    if (percentage === 100) {
      showToast("🎉 Perfect score! You're a cyber security expert!", "success");
      createConfetti();
    } else if (percentage >= 80) {
      showToast("Great job! You're well on your way!", "success");
    } else if (percentage >= 60) {
      showToast("Good try! Review the learning materials to improve.", "info");
    } else {
      showToast("Keep practicing! Visit the Learn page for more information.", "info");
    }

    loadQuizStats();
    setButtonLoading(submitBtn, false);
  });
}

function addQuizProgressBar(quizForm) {
  let progressBar = document.querySelector('.quiz-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'quiz-progress';
    progressBar.innerHTML = `
      <div class="progress-bar" style="width: 0%"></div>
      <span class="progress-text">0/5 answered</span>
    `;
    quizForm.insertBefore(progressBar, quizForm.firstChild);
  }
}

function updateQuizProgress(quizForm) {
  const totalQuestions = quizForm.querySelectorAll('fieldset').length;
  const answeredQuestions = quizForm.querySelectorAll('input[type="radio"]:checked').length;
  const progress = (answeredQuestions / totalQuestions) * 100;
  
  const progressBar = document.querySelector('.quiz-progress');
  if (progressBar) {
    const bar = progressBar.querySelector('.progress-bar');
    const text = progressBar.querySelector('.progress-text');
    if (bar) bar.style.width = `${progress}%`;
    if (text) text.textContent = `${answeredQuestions}/${totalQuestions} answered`;
  }
}

function getQuizFeedback(percentage) {
  if (percentage === 100) return "Excellent work! Your awareness level is very strong.";
  if (percentage >= 80) return "Good job! You understand most of the core security ideas.";
  if (percentage >= 60) return "Nice try! Review the learning page to improve your score.";
  return "Keep practicing! Revisit the learning page and try again.";
}

function loadQuizStats() {
  const lastScore = document.getElementById("last-score");
  const attemptCount = document.getElementById("attempt-count");

  if (!lastScore || !attemptCount) return;

  lastScore.textContent = localStorage.getItem("quizScore") || "No score yet";
  attemptCount.textContent = localStorage.getItem("quizAttempts") || "0";
}

// ==================== REPORT FORM ====================
function setupReportForm() {
  const reportForm = document.getElementById("report-form");
  const messageBox = document.getElementById("report-message");

  if (!reportForm || !messageBox) return;

  reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const submitBtn = reportForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const name = escapeHtml(reportForm.name.value.trim());
    const email = escapeHtml(reportForm.email.value.trim());
    const threatType = reportForm.threatType.value.trim();
    const description = escapeHtml(reportForm.description.value.trim());
    const consent = reportForm.consent.checked;
    const fileInput = reportForm.evidence;
    const file = fileInput.files[0];

    // Validation
    if (!name || !email || !threatType || !description) {
      showAlert(messageBox, "Please complete all required fields.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    if (!isValidEmail(email)) {
      showAlert(messageBox, "Please enter a valid email address.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    if (!consent) {
      showAlert(messageBox, "You must confirm the consent checkbox before submitting.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "text/plain"];
      const maxSize = 2 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        showAlert(messageBox, "Invalid file type. Please upload PNG, JPG, JPEG, PDF, or TXT.", "error");
        setButtonLoading(submitBtn, false);
        return;
      }

      if (file.size > maxSize) {
        showAlert(messageBox, "File is too large. Maximum allowed size is 2MB.", "error");
        setButtonLoading(submitBtn, false);
        return;
      }
    }

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = `✓ Report submitted successfully!\n\nThank you ${name}, we've received your ${threatType} report. Our team will review it within 24-48 hours. A confirmation has been sent to ${email}.`;
    showAlert(messageBox, summary, "success");
    showToast("Report submitted successfully! Check your email for confirmation.", "success");

    reportForm.reset();
    if (fileInput) fileInput.value = '';
    
    setButtonLoading(submitBtn, false);
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ==================== PHISHING SIMULATION ====================
function setupSimulation() {
  const phishingButton = document.getElementById("phishing-link");
  const resultBox = document.getElementById("simulation-result");

  if (!phishingButton || !resultBox) return;

  phishingButton.addEventListener("click", () => {
    showAlert(
      resultBox,
      "⚠️ That link is suspicious! Warning signs include:\n• Fake urgency ('within 10 minutes')\n• Suspicious sender address\n• 'Account locked' scare tactic\n• Too-good-to-be-true reward\n\nNever click links in unsolicited messages!",
      "error"
    );
    showToast("⚠️ This was a phishing simulation! Always verify links before clicking.", "error");
    
    // Add visual feedback to the button
    phishingButton.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      phishingButton.style.animation = "";
    }, 500);
  });
}

// ==================== FORM VALIDATION ====================
function setupFormValidation() {
  // Add real-time validation to forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateInput(input);
      });
      
      input.addEventListener('input', () => {
        if (input.checkValidity()) {
          clearInputError(input);
        }
      });
    });
  });
}

function validateInput(input) {
  const isValid = input.checkValidity();
  const errorElement = input.parentElement.querySelector('.error-message');
  
  if (!isValid) {
    input.style.borderColor = 'var(--danger)';
    if (!errorElement) {
      const error = document.createElement('span');
      error.className = 'error-message';
      error.textContent = getValidationMessage(input);
      input.parentElement.appendChild(error);
    }
  } else {
    input.style.borderColor = 'var(--success)';
    if (errorElement) {
      errorElement.remove();
    }
    // Reset border after delay
    setTimeout(() => {
      if (input.checkValidity()) {
        input.style.borderColor = 'var(--border)';
      }
    }, 2000);
  }
  
  return isValid;
}

function clearInputError(input) {
  input.style.borderColor = 'var(--border)';
  const errorElement = input.parentElement.querySelector('.error-message');
  if (errorElement) {
    errorElement.remove();
  }
}

function getValidationMessage(input) {
  if (input.validity.valueMissing) {
    return 'This field is required';
  }
  if (input.validity.typeMismatch) {
    if (input.type === 'email') return 'Please enter a valid email address';
    if (input.type === 'url') return 'Please enter a valid URL';
  }
  if (input.validity.tooShort) {
    return `Minimum ${input.minLength} characters required`;
  }
  return input.validationMessage || 'Invalid input';
}

// ==================== CARD HOVER EFFECTS ====================
function setupCardHoverEffects() {
  const cards = document.querySelectorAll('.card, .threat-card, .small-feature-card, .learn-info-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ==================== FLOATING LABELS ====================
function setupFloatingLabels() {
  const formGroups = document.querySelectorAll('.form-group');
  
  formGroups.forEach(group => {
    const input = group.querySelector('input, textarea, select');
    const label = group.querySelector('label');
    
    if (input && label && !group.classList.contains('checkbox-group')) {
      // Check if input has value on load
      if (input.value) {
        label.style.transform = 'translateY(-0.5rem) scale(0.85)';
        label.style.opacity = '0.8';
      }
      
      input.addEventListener('focus', () => {
        label.style.transform = 'translateY(-0.5rem) scale(0.85)';
        label.style.opacity = '0.8';
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          label.style.transform = '';
          label.style.opacity = '';
        }
      });
    }
  });
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '⚠️',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ==================== ALERT FUNCTION ====================
function showAlert(element, message, type) {
  // Show toast for better UX
  showToast(message, type);
  
  // Also update the existing alert element if it exists
  if (element) {
    element.classList.remove("hidden", "alert-success", "alert-error");
    element.classList.add(type === "success" ? "alert-success" : "alert-error");
    element.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (element) {
        element.classList.add("hidden");
      }
    }, 5000);
  }
}

// ==================== HELPER FUNCTIONS ====================
function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;
    button.style.opacity = '0.7';
  } else {
    button.textContent = button.dataset.originalText || 'Submit';
    button.disabled = false;
    button.style.opacity = '';
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function createConfetti() {
  // Simple confetti effect for perfect scores
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      top: -10px;
      left: ${Math.random() * window.innerWidth}px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 10001;
      animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 4000);
  }
}

// ==================== ADD CSS ANIMATIONS ====================
// Add any missing CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .quiz-progress {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 1rem;
    height: 0.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
  }
  
  .quiz-progress .progress-bar {
    background: linear-gradient(90deg, var(--primary), var(--accent-green));
    border-radius: 1rem;
    height: 100%;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .quiz-progress .progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }
  
  .quiz-progress .progress-text {
    position: absolute;
    top: -1.5rem;
    right: 0;
    font-size: 0.75rem;
    color: var(--text-light);
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .error-message {
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
    color: var(--danger);
    animation: slideIn 0.2s ease-out;
  }
  
  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: var(--panel);
    border-radius: 0.75rem;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10000;
    max-width: 350px;
    border-left: 4px solid;
    font-family: var(--font-sans);
  }
  
  .toast-success { border-left-color: var(--success); }
  .toast-error { border-left-color: var(--danger); }
  .toast-info { border-left-color: var(--primary); }
  
  .toast-icon { font-size: 1.25rem; }
  .toast-message { flex: 1; color: var(--text); }
  
  .toast-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--text-light);
    transition: color 0.2s;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toast-close:hover { color: var(--danger); }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

document.head.appendChild(style);