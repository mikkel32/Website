import { checkPasswordStrength } from './utils.js';
// DOMPurify is resolved via the import map so the same path works in tests,
// development and bundled builds.
import DOMPurify from 'dompurify';

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
    const patterns = [
      /<script/i,
      /select\b.*from/i,
      /(\bor\b|\band\b).*=.*\b/,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+\w+\s+set/i,
      /onerror\s*=\s*/i,
      /javascript:/i,
    ];
    return patterns.some((r) => r.test(text));
  },

  async hash(text, algorithm = 'SHA-256') {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest(algorithm, encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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

  async hmac(text, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(text));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
          <button class="btn btn-primary" id="encryptButton">Encrypt</button>
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
        <div class="demo-card">
          <h3>SHA-256 Hash Demo</h3>
          <input type="text" id="hashInput" placeholder="Enter text to hash">
          <button class="btn btn-primary" id="hashButton">Hash</button>
          <div class="demo-result" id="hashResult"></div>
        </div>
        <div class="demo-card">
          <h3>HMAC Generator</h3>
          <input type="text" id="hmacInput" placeholder="Enter text">
          <input type="text" id="hmacKey" placeholder="Secret key">
          <button class="btn btn-primary" id="hmacButton">Generate</button>
          <div class="demo-result" id="hmacResult"></div>
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

  const encryptButton = document.getElementById('encryptButton');
  const encryptInput = document.getElementById('encryptInput');
  const encryptResult = document.getElementById('encryptResult');
  const hashButton = document.getElementById('hashButton');
  const hashInput = document.getElementById('hashInput');
  const hashResult = document.getElementById('hashResult');
  const hmacButton = document.getElementById('hmacButton');
  const hmacInput = document.getElementById('hmacInput');
  const hmacKey = document.getElementById('hmacKey');
  const hmacResult = document.getElementById('hmacResult');

  encryptButton.addEventListener('click', async () => {
    if (!encryptInput.value) return;

    if (securityFeatures.scanInput(encryptInput.value)) {
      notifications.show('Potentially malicious input detected', 'warning');
    }

    const encrypted = await securityFeatures.encrypt(encryptInput.value);
    const decrypted = await securityFeatures.decrypt(encrypted);

    encryptResult.innerHTML = `
      <p><strong>Encrypted:</strong> ${encrypted}</p>
      <p><strong>Decrypted:</strong> ${DOMPurify.sanitize(decrypted)}</p>
    `;
    encryptResult.style.display = 'block';
  });

  hashButton.addEventListener('click', async () => {
    if (!hashInput.value) return;

    if (securityFeatures.scanInput(hashInput.value)) {
      notifications.show('Potentially malicious input detected', 'warning');
    }

    const digest = await securityFeatures.hash(hashInput.value);
    hashResult.innerHTML = `<p><strong>SHA-256:</strong> ${digest}</p>`;
    hashResult.style.display = 'block';
  });

  hmacButton.addEventListener('click', async () => {
    if (!hmacInput.value || !hmacKey.value) return;

    if (
      securityFeatures.scanInput(hmacInput.value) ||
      securityFeatures.scanInput(hmacKey.value)
    ) {
      notifications.show('Potentially malicious input detected', 'warning');
      return;
    }

    const mac = await securityFeatures.hmac(hmacInput.value, hmacKey.value);
    hmacResult.innerHTML = `<p><strong>HMAC:</strong> ${mac}</p>`;
    hmacResult.style.display = 'block';
  });
}
