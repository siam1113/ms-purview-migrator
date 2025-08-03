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

  const sessionFilePath = `sessions/${process.env.MS_USERNAME}.json`;
  const isSessionFileExists = fs.existsSync(sessionFilePath);

  const context = await browser.newContext({
    storageState: isSessionFileExists ? sessionFilePath : undefined,
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

  console.log(`🟡 Checking if user is logged in...`);
  const isLoggedIn = await msLogin.isLoggedIn();
  if (true) {
    console.log('✅ User already logged in. Continuing...');
  }
  else{
    console.log('✅ User is not logged in yet. Logging in...');
    // Login to Microsoft
    const loginSuccess = await msLogin.authenticate();
    if (loginSuccess) {
      console.log('Login successful!');
      await msLogin.saveSession();
    } else {
      console.error('Login failed.');
    }
  }

  // // Scrape Templates
  // console.log('✅ Starting to scrape templates from Microsoft E-Discovery...');
  // await templateScraper.goto();
  // console.log('🟡 Navigating to Communication Library...');
  // await templateScraper.clickOnCommunicationLibrary();
  // console.log('🟡 Scraping templates from Microsoft E-Discovery...');
  // const templates = await templateScraper.scrapeTemplates();
  // console.log('✅ Completed scraping templates');
  // console.log(`✅  Scraped ${templates.length} templates.`);

  // // Export templates to JSON file
  // console.log('🟡 Exporting templates to JSON file...');
  // fs.writeFileSync(exportPath, JSON.stringify(templates, null, 2));
  // console.log(`✅ Templates exported to ${exportPath}`);

  // Scrape ane Export Communications
  console.log('🟡 Starting to scrape communications from Microsoft E-Discovery...');
  console.log('🟡 Navigating to Cases page...');
  const eDiscoveryCases = await casesScraper.scrapeCases();
  const eDiscoveryCasesCount = eDiscoveryCases.length;
  const casesToScrape = eDiscoveryCases.slice(0, process.env.SCRAPE_COMMUNICATIONS_LIMIT ? parseInt(process.env.SCRAPE_COMMUNICATIONS_LIMIT) : eDiscoveryCasesCount);

  console.log(`🟡 Scraping communications for ${casesToScrape.length} cases out of ${eDiscoveryCases.length}`);
  await communicationsScraper.scrapeExportCommunicationsForCases(casesToScrape);

  // Teardown
  await context.close();
  await browser.close();
})();