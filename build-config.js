const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const required = ['API_KEY', 'PROJECT_ID', 'APP_ID'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  console.warn('Aviso: Variáveis de ambiente do Firebase ausentes:', missing.join(', '));
  // opcional: preencher valores placeholders para não quebrar o build
  // process.env.API_KEY = process.env.API_KEY || 'PLACEHOLDER_API_KEY';
  // ...
} else {
  const sourceCode = `
  (function() {
    var firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
  })();`;

  const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1
  }).toString();

  const outputPath = path.join(__dirname, 'public', 'js', 'firebase-config.js');
  fs.writeFileSync(outputPath, obfuscated, 'utf8');
}

