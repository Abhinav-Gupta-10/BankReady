const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('BankReady I18n Language & Translation Suite', async (t) => {
  const translationsFilePath = path.join(__dirname, '..', 'src', 'lib', 'translations.ts');
  assert.ok(fs.existsSync(translationsFilePath), 'translations.ts must exist');

  const content = fs.readFileSync(translationsFilePath, 'utf8');

  // Verify all 10 languages are listed in LANGUAGES array
  const expectedLanguages = [
    { code: 'en', dir: 'ltr', name: 'English' },
    { code: 'hi', dir: 'ltr', name: 'Hindi' },
    { code: 'bn', dir: 'ltr', name: 'Bengali' },
    { code: 'mr', dir: 'ltr', name: 'Marathi' },
    { code: 'ta', dir: 'ltr', name: 'Tamil' },
    { code: 'te', dir: 'ltr', name: 'Telugu' },
    { code: 'gu', dir: 'ltr', name: 'Gujarati' },
    { code: 'kn', dir: 'ltr', name: 'Kannada' },
    { code: 'pa', dir: 'ltr', name: 'Punjabi' },
    { code: 'ur', dir: 'rtl', name: 'Urdu' },
  ];

  await t.test('1. All 10 required Indian languages are configured', () => {
    for (const lang of expectedLanguages) {
      assert.ok(content.includes(`code: "${lang.code}"`), `Language code ${lang.code} must be defined`);
      assert.ok(content.includes(`name: "${lang.name}"`), `Language name ${lang.name} must be defined`);
      assert.ok(content.includes(`dir: "${lang.dir}"`), `Language dir ${lang.dir} for ${lang.code} must be defined`);
    }
  });

  await t.test('2. Urdu (ur) is specifically configured for RTL layout', () => {
    assert.match(content, /code:\s*"ur"[\s\S]*?dir:\s*"rtl"/, 'Urdu must be explicitly marked as dir: rtl');
  });

  await t.test('3. Key navigation and form translation keys exist for all languages', () => {
    const requiredKeys = [
      'nav.services',
      'nav.branches',
      'nav.wizard',
      'nav.accountCheck',
      'nav.forms',
      'nav.holidays',
      'nav.login',
      'nav.createAccount',
      'btn.search',
      'btn.download',
      'label.email',
      'label.password',
      'val.passMismatch',
      'home.heroTitle',
      'home.heroSubtitle',
      'branches.title',
      'forms.title',
      'holidays.title',
      'services.title',
    ];

    for (const lang of expectedLanguages) {
      const langBlockMatch = content.match(new RegExp(`\\b${lang.code}:\\s*\\{([\\s\\S]*?)\\n  \\},`, 'm'));
      assert.ok(langBlockMatch, `Language translation dictionary block for '${lang.code}' must exist`);
      const langBlock = langBlockMatch[1];

      for (const key of requiredKeys) {
        assert.ok(
          langBlock.includes(`"${key}":`),
          `Key '${key}' must be translated in language '${lang.code}'`
        );
      }
    }
  });

  await t.test('4. LanguageSelector component is implemented and exported', () => {
    const selectorPath = path.join(__dirname, '..', 'src', 'components', 'LanguageSelector.tsx');
    assert.ok(fs.existsSync(selectorPath), 'LanguageSelector.tsx must exist');
    const selectorContent = fs.readFileSync(selectorPath, 'utf8');
    assert.ok(selectorContent.includes('export default function LanguageSelector'), 'Must export LanguageSelector');
    assert.ok(selectorContent.includes('useLanguage'), 'Must use useLanguage hook');
    assert.ok(selectorContent.includes('<select'), 'Must render select dropdown');
  });

  await t.test('5. LanguageProvider preserves language in localStorage and updates document dir and lang', () => {
    const contextPath = path.join(__dirname, '..', 'src', 'context', 'LanguageContext.tsx');
    assert.ok(fs.existsSync(contextPath), 'LanguageContext.tsx must exist');
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    assert.ok(contextContent.includes('localStorage.getItem'), 'Must retrieve saved language from localStorage');
    assert.ok(contextContent.includes('localStorage.setItem'), 'Must persist selected language to localStorage');
    assert.ok(contextContent.includes('document.documentElement.lang'), 'Must set documentElement.lang');
    assert.ok(contextContent.includes('document.documentElement.dir'), 'Must set documentElement.dir for RTL support');
  });
});
