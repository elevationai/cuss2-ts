// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('.header');
const contactForm = document.getElementById('contactForm');

// Mobile Navigation Toggle
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
}

// Close mobile menu when clicking on nav links
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

// Header scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Smooth scrolling for navigation links (only for anchor links)
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');

    // Only prevent default and smooth scroll if it's an anchor link (starts with #)
    if (targetId.startsWith('#')) {
      e.preventDefault();
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight = header.offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    }
    // For other links (like /api-reference/), let them navigate normally
  });
});

// Contact form handling with N8N webhook
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

  // Check if configuration is available
    if (!window.siteConfig) {
      console.error('Contact Form Error: Site configuration not loaded.');
      showNotification(
        'Sorry, the contact form is temporarily unavailable. Please try again later.',
        'error'
      );
      return;
    }

  const webhookUrl = window.siteConfig.webhookUrl;

  // Check if webhook URL is configured
  if (!webhookUrl || webhookUrl === '') {
    console.error('Contact Form Error: Webhook URL is not configured.');
    showNotification(
      'Sorry, the contact form is temporarily unavailable. Please try again later.',
      'error'
    );
    return;
  }

  // Get form data
  const formData = new FormData(contactForm);
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');

  // Basic validation
  if (!name || !email || !message) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  // Show loading state
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Verifying...';
  submitButton.disabled = true;

  try {
    let recaptchaToken = null;

    // reCAPTCHA verification is ALWAYS REQUIRED
    if (!window.siteConfig.recaptchaSiteKey) {
      console.error(
        'reCAPTCHA is not configured. Contact form requires CAPTCHA verification.'
      );
      showNotification(
        'Security verification is not available. Please contact the administrator.',
        'error'
      );
      return;
    }

    if (typeof grecaptcha === 'undefined') {
      console.error(
        'reCAPTCHA is required but not loaded. Check if script loaded properly.'
      );
      showNotification(
        'Security verification is required but not available. Please refresh the page and try again.',
        'error'
      );
      return;
    }

    try {
      recaptchaToken = await grecaptcha.execute(window.siteConfig.recaptchaSiteKey, {
        action: 'contact_form',
      });
      if (!recaptchaToken) {
        console.error('reCAPTCHA token is empty');
        showNotification(
          'Security verification failed. Please refresh the page and try again.',
          'error'
        );
        return;
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA execution failed:', recaptchaError);
      showNotification(
        'Security verification failed. Please refresh the page and try again.',
        'error'
      );
      return;
    }

    submitButton.textContent = 'Sending...';

    // Send data to N8N webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        message: message,
        timestamp: new Date().toLocaleString(),
        source: 'ts.CUSS2.dev',
        userAgent: navigator.userAgent,
        recaptchaToken: recaptchaToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Success
    showNotification(
      "Message sent successfully! We'll get back to you soon.",
      'success'
    );
    contactForm.reset();
  } catch (error) {
    // Log detailed error for developers
    console.error('Contact form failed:', error);

    // Generic user-friendly message for all errors
    showNotification(
      "Sorry, we couldn't send your message. Please try again in a few minutes.",
      'error'
    );
  } finally {
    // Reset button state
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
  });
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === 'success'
            ? '#10b981'
            : type === 'error'
            ? '#ef4444'
            : '#3b82f6'
        };
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        line-height: 1.4;
    `;

  // Add animation styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
  }

  // Add to DOM
  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
    }
  });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll(
    '.about-card, .service-item, .section-header'
  );
  animatedElements.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
});

// Button click handlers
document.addEventListener('DOMContentLoaded', () => {
  // Get Started button
  const getStartedBtn = document.querySelector('.btn-primary');
  if (getStartedBtn && getStartedBtn.textContent.includes('Get Started')) {
    getStartedBtn.addEventListener('click', () => {
      // Scroll to contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const headerHeight = header.offsetHeight;
        const targetPosition = contactSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  }

  // Learn More button
  const learnMoreBtn = document.querySelector('.btn-secondary');
  if (learnMoreBtn && learnMoreBtn.textContent.includes('Learn More')) {
    learnMoreBtn.addEventListener('click', () => {
      // Scroll to about section
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        const headerHeight = header.offsetHeight;
        const targetPosition = aboutSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  }
});

// Add scroll indicator for long pages
function createScrollIndicator() {
  const scrollIndicator = document.createElement('div');
  scrollIndicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        z-index: 10001;
        transition: width 0.1s ease;
    `;

  document.body.appendChild(scrollIndicator);

  window.addEventListener('scroll', () => {
    const scrollPercent =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
      100;
    scrollIndicator.style.width = `${scrollPercent}%`;
  });
}

// Initialize scroll indicator
document.addEventListener('DOMContentLoaded', createScrollIndicator);

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  const heroImage = document.querySelector('.hero-image');

  if (hero && heroImage && scrolled < hero.offsetHeight) {
    const parallaxSpeed = 0.5;
    heroImage.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
  }
});

// Add hover effects for cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.about-card');

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(-10px) scale(1)';
    });
  });
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
  // Close mobile menu with Escape key
  if (e.key === 'Escape' && navMenu.classList.contains('active')) {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  }
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
  // Handle scroll events here if needed
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);
