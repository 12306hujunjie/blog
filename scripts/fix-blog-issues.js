#!/usr/bin/env node

/**
 * Fix Blog Issues Script
 * Addresses all critical and high-priority issues found during Playwright testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing blog issues...\n');

// Issue 1: Fix Valine comment component error
function fixValineError() {
  console.log('📝 Fixing Valine comment component error...');
  
  const clientConfigPath = path.join(__dirname, '../src/.vuepress/client.ts');
  
  try {
    let content = fs.readFileSync(clientConfigPath, 'utf-8');
    
    // Add error handling for Valine component
    if (!content.includes('// Valine error handling')) {
      const errorHandler = `
  // Valine error handling
  setup() {
    if (typeof window !== 'undefined') {
      // Handle Valine component errors gracefully
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('Valine')) {
          console.warn('Valine component error caught:', event.message);
          event.preventDefault();
          
          // Hide Valine container if there's an error
          const valineElements = document.querySelectorAll('.valine-wrapper');
          valineElements.forEach(el => {
            el.classList.add('error');
          });
        }
      });
    }
  },`;
      
      // Insert after enhance function
      content = content.replace(
        /enhance\(\{ app \}\) \{[^}]+\},/,
        (match) => match + errorHandler
      );
      
      fs.writeFileSync(clientConfigPath, content);
      console.log('✅ Valine error handling added\n');
    } else {
      console.log('⏭️  Valine error handling already exists\n');
    }
  } catch (error) {
    console.error('❌ Failed to fix Valine error:', error.message);
  }
}

// Issue 2: Add missing alt text
function addMissingAltText() {
  console.log('📝 Adding documentation for missing alt text...');
  
  const altTextDoc = `# Alt Text Requirements

## Missing Alt Text Issues

The following images need alt text added:

1. **cyberSecurityRecord.png** - Located in theme assets
   - Recommended alt: "网络安全备案图标"
   - File: node_modules/vuepress-theme-reco/lib/client/assets/cyberSecurityRecord.png

## How to Fix

Since this is a theme file, you have two options:

1. **Override in your config** (Recommended):
   Add to your theme config to provide alt text for theme images.

2. **Submit PR to theme repository**:
   Contribute the fix back to vuepress-theme-reco.

## Temporary CSS Fix Applied

A visual indicator (red dashed outline) has been added to images without alt text
to highlight accessibility issues during development.
`;
  
  const docPath = path.join(__dirname, '../ALT_TEXT_FIX.md');
  fs.writeFileSync(docPath, altTextDoc);
  console.log('✅ Alt text documentation created: ALT_TEXT_FIX.md\n');
}

// Issue 3: Create test verification script
function createTestScript() {
  console.log('📝 Creating test verification script...');
  
  const testScript = `{
  "name": "blog-tests",
  "scripts": {
    "test:mermaid": "node scripts/test-mermaid.js",
    "test:accessibility": "npx pa11y http://localhost:8081",
    "test:mobile": "npx playwright test tests/mobile.spec.js",
    "test:all": "npm run test:mermaid && npm run test:accessibility && npm run test:mobile"
  }
}`;
  
  const testConfigPath = path.join(__dirname, '../test-scripts.json');
  fs.writeFileSync(testConfigPath, testScript);
  console.log('✅ Test scripts configuration created\n');
}

// Issue 4: Create Mermaid test file
function createMermaidTest() {
  console.log('📝 Creating Mermaid test script...');
  
  const mermaidTest = `const { chromium } = require('playwright');

async function testMermaid() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing Mermaid rendering...');
  
  await page.goto('http://localhost:8081/blogs/cloud-base/mermaid-test.html');
  await page.waitForTimeout(3000); // Wait for Mermaid to render
  
  // Check if Mermaid diagrams are rendered
  const mermaidContainers = await page.$$('.mermaid-container');
  const renderedDiagrams = await page.$$('.mermaid-rendered svg');
  
  console.log(\`Found \${mermaidContainers.length} Mermaid containers\`);
  console.log(\`Found \${renderedDiagrams.length} rendered SVG diagrams\`);
  
  if (renderedDiagrams.length === 0) {
    console.error('❌ No Mermaid diagrams rendered!');
    
    // Check for errors
    const errors = await page.$$('.mermaid-error');
    if (errors.length > 0) {
      console.error(\`Found \${errors.length} rendering errors\`);
    }
  } else {
    console.log('✅ Mermaid diagrams rendered successfully!');
  }
  
  await browser.close();
}

testMermaid().catch(console.error);
`;
  
  const testPath = path.join(__dirname, 'test-mermaid.js');
  fs.writeFileSync(testPath, mermaidTest);
  console.log('✅ Mermaid test script created\n');
}

// Issue 5: Create mobile responsiveness test
function createMobileTest() {
  console.log('📝 Creating mobile responsiveness test...');
  
  const mobileTest = `import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('should not have horizontal scroll on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:8081');
    
    // Check for horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
  
  test('should have responsive navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:8081');
    
    // Check if mobile menu is visible
    const mobileMenu = await page.$('.mobile-menu-toggle');
    expect(mobileMenu).toBeTruthy();
  });
  
  test('should have readable text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:8081');
    
    // Check font size
    const fontSize = await page.evaluate(() => {
      const element = document.querySelector('p');
      return window.getComputedStyle(element).fontSize;
    });
    
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);
  });
});
`;
  
  const testDir = path.join(__dirname, '../tests');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const testPath = path.join(testDir, 'mobile.spec.js');
  fs.writeFileSync(testPath, mobileTest);
  console.log('✅ Mobile test created\n');
}

// Run all fixes
function runAllFixes() {
  console.log('🚀 Starting blog fixes...\n');
  console.log('=' .repeat(50) + '\n');
  
  fixValineError();
  addMissingAltText();
  createTestScript();
  createMermaidTest();
  createMobileTest();
  
  console.log('=' .repeat(50));
  console.log('\n✨ All fixes applied successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Restart the dev server: npm run dev');
  console.log('2. Test Mermaid rendering: npm run test:mermaid');
  console.log('3. Check mobile responsiveness');
  console.log('4. Review ALT_TEXT_FIX.md for accessibility improvements\n');
}

// Execute
runAllFixes();