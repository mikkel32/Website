import { checkPasswordStrength } from './utils.js';

export const securityFeatures = {
  key: null,
  async init() {
    this.key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  },

  scanInput(text) {
    const patterns = [/<script/i, /select\b.*from/i, /(\bor\b|\band\b).*=.*\b/];
    return patterns.some((r) => r.test(text));
  },

  async encrypt(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, encoded);
    const result = new Uint8Array(iv.byteLength + cipher.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(cipher), iv.byteLength);
    return btoa(String.fromCharCode(...result));
  },

  async decrypt(data) {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.key, cipher);
    return new TextDecoder().decode(decrypted);
  },
};

function addSecurityDemo() {
  const demoSection = document.createElement('section');
  demoSection.id = 'demo';
  demoSection.className = 'security-demo';
  demoSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">Live Security Demo</h2>
      <div class="demo-grid">
        <div class="demo-card">
          <h3>AES-GCM Encryption Demo</h3>
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
          <ul class="strength-suggestions" id="strengthSuggestions"></ul>
        </div>
      </div>
    </div>
  `;

  document.querySelector('footer').before(demoSection);
}

export async function setupSecurityDemo(notifications) {
  addSecurityDemo();
  await securityFeatures.init();

  const passwordInput = document.getElementById('passwordInput');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const strengthSuggestions = document.getElementById('strengthSuggestions');

  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = checkPasswordStrength(password);

    strengthBar.style.width = `${strength.score * 20}%`;
    strengthBar.style.backgroundColor = strength.color;
    strengthText.textContent = strength.text;
    strengthText.style.color = strength.color;

    if (strengthSuggestions) {
      strengthSuggestions.innerHTML = '';
      strength.suggestions.forEach((msg) => {
        const li = document.createElement('li');
        li.textContent = msg;
        strengthSuggestions.appendChild(li);
      });
    }
  });

  window.encryptDemo = async function encryptDemo() {
    const input = document.getElementById('encryptInput');
    const result = document.getElementById('encryptResult');

    if (input.value) {
      if (securityFeatures.scanInput(input.value)) {
        notifications.show('Potentially malicious input detected', 'warning');
      }
      const encrypted = await securityFeatures.encrypt(input.value);
      const decrypted = await securityFeatures.decrypt(encrypted);
      result.innerHTML = `
        <p><strong>Encrypted:</strong> ${encrypted}</p>
        <p><strong>Decrypted:</strong> ${decrypted}</p>
      `;
      result.style.display = 'block';
    }
  };
}
