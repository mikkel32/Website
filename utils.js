export function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }

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

export function checkPasswordStrength(password) {
  let score = 0;
  const suggestions = [];

  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push('Use at least 8 characters.');
  }
  if (password.length >= 12) {
    score++;
  } else {
    suggestions.push('12+ characters improves security.');
  }
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Mix uppercase and lowercase letters.');
  }
  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Add numbers.');
  }
  if (/[^a-zA-Z\d]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include special characters.');
  }

  const strengths = [
    { score: 0, text: 'Very Weak', color: '#f44336' },
    { score: 1, text: 'Weak', color: '#ff9800' },
    { score: 2, text: 'Fair', color: '#ffc107' },
    { score: 3, text: 'Good', color: '#8bc34a' },
    { score: 4, text: 'Strong', color: '#4caf50' },
    { score: 5, text: 'Very Strong', color: '#2e7d32' },
  ];

  return { ...(strengths[score] || strengths[0]), suggestions };
}

export function getCSRFToken() {
  let token = sessionStorage.getItem('csrfToken');
  if (!token) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    token = btoa(String.fromCharCode(...bytes));
    sessionStorage.setItem('csrfToken', token);
  }
  return token;
}

export function validateCSRFToken(token) {
  return token === sessionStorage.getItem('csrfToken');
}
