// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
  icon.classList.remove('fa-moon');
  icon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  
  if (body.classList.contains('dark-mode')) {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    localStorage.setItem('theme', 'dark');
  } else {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    localStorage.setItem('theme', 'light');
  }
});

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  
  // Animate hamburger menu
  const spans = navToggle.querySelectorAll('span');
  spans[0].style.transform = navMenu.classList.contains('active') 
    ? 'rotate(-45deg) translate(-5px, 6px)' : '';
  spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
  spans[2].style.transform = navMenu.classList.contains('active') 
    ? 'rotate(45deg) translate(-5px, -6px)' : '';
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
  });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) {
    navbar.style.background = body.classList.contains('dark-mode') 
      ? 'rgba(18, 18, 18, 0.98)' 
      : 'rgba(255, 255, 255, 0.98)';
    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.background = body.classList.contains('dark-mode')
      ? 'rgba(18, 18, 18, 0.95)'
      : 'rgba(255, 255, 255, 0.95)';
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  }
});

// Animated Counter
const counters = document.querySelectorAll('.stat-number');
const speed = 200;

const animateCounters = () => {
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const inc = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
};

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains('stat-item')) {
        animateCounters();
      }
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements
document.querySelectorAll('.feature-card, .service-item, .stat-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.6s ease';
  observer.observe(el);
});

// Add Scroll to Top Button
const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top';
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    scrollTopBtn.classList.add('active');
  } else {
    scrollTopBtn.classList.remove('active');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Initialize features once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    preloader.addEventListener('transitionend', () => preloader.remove());
    document.body.classList.remove('no-scroll');
  }

  addSecurityDemo();

  const passwordInput = document.getElementById('passwordInput');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');

  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = checkPasswordStrength(password);

    strengthBar.style.width = `${strength.score * 25}%`;
    strengthBar.style.backgroundColor = strength.color;
    strengthText.textContent = strength.text;
    strengthText.style.color = strength.color;
  });
});

// Form Validation (if you add a contact form)
function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
    
    // Email validation
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        input.classList.add('error');
        isValid = false;
      }
    }
  });
  
  return isValid;
}

// Security Features Demo
const securityFeatures = {
  // Simulate real-time threat detection
  threatDetection: () => {
    const threats = ['Malware', 'Phishing', 'DDoS', 'SQL Injection', 'XSS'];
    const randomThreat = threats[Math.floor(Math.random() * threats.length)];
    console.log(`Threat detected: ${randomThreat} - Blocked successfully`);
  },
  
  // Simulate encryption
  encrypt: (text) => {
    return btoa(text); // Simple base64 encoding for demo
  },
  
  decrypt: (encoded) => {
    return atob(encoded);
  }
};

// Add interactive security demo
function addSecurityDemo() {
  const demoSection = document.createElement('section');
  demoSection.id = 'demo';
  demoSection.className = 'security-demo';
  demoSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">Live Security Demo</h2>
      <div class="demo-grid">
        <div class="demo-card">
          <h3>Encryption Demo</h3>
          <input type="text" id="encryptInput" placeholder="Enter text to encrypt">
          <button class="btn btn-primary" onclick="encryptDemo()">Encrypt</button>
          <div class="demo-result" id="encryptResult"></div>
        </div>
        <div class="demo-card">
          <h3>Password Strength Checker</h3>
          <input type="password" id="passwordInput" placeholder="Enter password">
          <div class="password-strength">
            <div class="strength-bar" id="strengthBar"></div>
          </div>
          <div class="strength-text" id="strengthText"></div>
        </div>
      </div>
    </div>
  `;
  
  // Insert before footer
  document.querySelector('footer').before(demoSection);
}

// Encryption demo function
window.encryptDemo = function() {
  const input = document.getElementById('encryptInput');
  const result = document.getElementById('encryptResult');
  
  if (input.value) {
    const encrypted = securityFeatures.encrypt(input.value);
    result.innerHTML = `
      <p><strong>Encrypted:</strong> ${encrypted}</p>
      <p><strong>Decrypted:</strong> ${securityFeatures.decrypt(encrypted)}</p>
    `;
    result.style.display = 'block';
  }
};

// Password strength checker logic

function checkPasswordStrength(password) {
  let score = 0;
  const feedback = [];
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;
  
  const strengths = [
    { score: 0, text: 'Very Weak', color: '#f44336' },
    { score: 1, text: 'Weak', color: '#ff9800' },
    { score: 2, text: 'Fair', color: '#ffc107' },
    { score: 3, text: 'Good', color: '#8bc34a' },
    { score: 4, text: 'Strong', color: '#4caf50' },
    { score: 5, text: 'Very Strong', color: '#2e7d32' }
  ];
  
  return strengths[score] || strengths[0];
}

// Add notification system
class NotificationSystem {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    this.container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    });
  }
  
  getIcon(type) {
    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle'
    };
    return icons[type] || icons.info;
  }
}

const notifications = new NotificationSystem();

// Simulate security alerts
setInterval(() => {
  if (Math.random() > 0.8) {
    notifications.show('All systems secure', 'success');
  }
}, 30000);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    // Add search functionality here
  }
  
  // Escape to close mobile menu
  if (e.key === 'Escape' && navMenu.classList.contains('active')) {
    navMenu.classList.remove('active');
  }
});

// Performance optimization - Lazy load images
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));

// Add page transition effects
window.addEventListener('beforeunload', () => {
  document.body.style.opacity = '0';
});
  
