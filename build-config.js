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

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    'Faltam variáveis de ambiente do Firebase. Verifique seu arquivo .env (API key, projectId e appId são obrigatórios).'
  );
}

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

