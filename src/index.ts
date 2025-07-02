import { chromium, devices } from 'playwright';
import { MSLogin } from './auth/login';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { MSEDiscoveryTemplateScraper } from './templates/templates';

// Load environment variables from .env file
config({
  path: '.env',
  override: true // Override existing environment variables
});

(async () => {
  // Setup
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    args: ['--start-maximized'] // Start browser maximized
  });
  const context = await browser.newContext({
    storageState: 'sessions/' + process.env.username + '.json', // Load session state from file
  });
  const page = await context.newPage();
  const msLogin = new MSLogin(page);
  const msScraper = new MSEDiscoveryTemplateScraper(page);

  if(existsSync('sessions/' + process.env.username + '.json')) {
    console.log('Session file already exists. ');
  }
  else{
    // Login to Microsoft
    await msLogin.goto();
    const loginSuccess = await msLogin.authenticate();
    if (loginSuccess) {
      console.log('Login successful!');
      await msLogin.saveSession();
    } else {
      console.error('Login failed.');
    }
  }

  // Scrape Templates
  await msScraper.goto();
  console.log('Navigating to Communication Library...');
  await msScraper.clickOnCommunicationLibrary();
  console.log('Scraping templates from Microsoft E-Discovery...');
  const templates = await msScraper.scrapeTemplates();
  console.log('Templates:', templates);

  // Teardown
  await context.close();
  await browser.close();
})();