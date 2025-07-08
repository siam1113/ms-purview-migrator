import { chromium } from 'playwright';
import { MSLogin } from './msAuth/login';
import { config } from 'dotenv';
import { MSEDiscoveryTemplateScraper } from './msEdiscovery/templates';
import { MSEDiscoveryCasesScraper } from './msEdiscovery/cases';
import { MSEDiscoveryCommunicationsScraper } from './msEdiscovery/communications';
const fs = require('fs');

// Load environment variables from .env file
config({
  path: '.env',
  override: true // Override existing environment variables
});

(async () => {
  // Browser Setup
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    args: ['--start-maximized'] // Start browser maximized
  });
  const context = await browser.newContext({
    storageState: 'sessions/' + process.env.MS_USERNAME + '.json', // Load session state from file
  });

  // Page Setup
  const page = await context.newPage();
  const msLogin = new MSLogin(page);
  const casesScraper = new MSEDiscoveryCasesScraper(page);
  const templateScraper = new MSEDiscoveryTemplateScraper(page);
  const communicationsScraper = new MSEDiscoveryCommunicationsScraper(page);

  // Export config
  const exportPath = 'exports/templates.json';
  fs.mkdirSync('exports', { recursive: true }); // Ensure exports directory exists

  // Go to Microsoft E-Discovery
  await msLogin.goto();

  const isLoggedIn = !await page.locator('text=Sign in, text=Pick an account').isVisible({ timeout: 10_000 });
  if (isLoggedIn) {
    console.log('Session file already exists and is valid. Continuing...');
  }
  else{
    console.log('Session file does not exist or is invalid. Logging in...');
    // Login to Microsoft
    const loginSuccess = await msLogin.authenticate();
    if (loginSuccess) {
      console.log('Login successful!');
      await msLogin.saveSession();
    } else {
      console.error('Login failed.');
    }
  }

  // Scrape Templates
  console.log('Starting to scrape templates from Microsoft E-Discovery...');
  await templateScraper.goto();
  console.log('Navigating to Communication Library...');
  await templateScraper.clickOnCommunicationLibrary();
  console.log('Scraping templates from Microsoft E-Discovery...');
  const templates = await templateScraper.scrapeTemplates();
  console.log('Completed scraping templates from Microsoft E-Discovery.');
  console.log(`Scraped ${templates.length} templates.`);

  // Export templates to JSON file
  console.log('Exporting templates to JSON file...');
  fs.writeFileSync(exportPath, JSON.stringify(templates, null, 2));
  console.log(`Templates exported to ${exportPath}`);

  // Scrape Communications
  console.log('Starting to scrape communications from Microsoft E-Discovery...');
  console.log('Navigating to Cases page...');
  const eDiscoveryCases = await casesScraper.scrapeCases();
  console.log(`Found ${eDiscoveryCases.length} E-Discovery cases.`);

  for (const eDiscoveryCase of eDiscoveryCases) {
    console.log(`Scraping communications for case: ${eDiscoveryCase}`);
    const communications = await communicationsScraper.scrapeCommunications({
      id: eDiscoveryCase.id,
      name: eDiscoveryCase.displayName
    });
    const communicationsCount = communications.length;
    console.log(`Scraped ${communicationsCount} communications for case: ${eDiscoveryCase.displayName}`);

    // Export communications to JSON file
    if (communicationsCount > 0) {
      const caseExportPath = `exports/communications_${eDiscoveryCase.id}.json`;
      fs.writeFileSync(caseExportPath, JSON.stringify(communications, null, 2));
      console.log(`Communications for case ${eDiscoveryCase.displayName} exported to ${caseExportPath}`);
    }
  }

  // Teardown
  await context.close();
  await browser.close();
})();