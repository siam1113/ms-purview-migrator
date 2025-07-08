import { chromium } from 'playwright';
import { config } from 'dotenv';
import { authenticateUser, createTemplate } from './zubuApi/api';
import path from 'path';
const fs = require('fs');

// Load environment variables from .env file
config({
  path: '.env',
  override: true // Override existing environment variables
});

(async () => {
  // Browser Setup
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    baseURL: process.env.ZUBU_API_URL!,
  });

  const exportsDir = 'exports';

  // Login to Zubu
  console.log('Authenticating user in Zubu...');
  const auth = await authenticateUser(context.request, {
    email: process.env.ZUBU_USERNAME!,
    password: process.env.ZUBU_PASSWORD!
  });

  // Load templates
  console.log('Loading templates from file...');
  const templates = JSON.parse(fs.readFileSync('exports/templates.json', 'utf-8'));
  console.log(`Loaded ${templates.length} templates from file.`);

  // Create Templates in Zubu
  console.log('Creating templates in Zubu...');
  const templateTypes = ['issuance', 'reissuance', 'release'];
  for (const template of [templates[0]]) {
    console.log(`Creating template: ${template.templateName}`);
    for (const type of [templateTypes[0]]) {
      console.log(`Creating ${type} template for: ${template.templateName}`);
      await createTemplate(context.request, auth?.accessToken, {
        templateName: `${template.templateName} - ${type}`,
        templateBody: JSON.stringify(template[type].body),
        tenantId: auth?.tenant_id
      });
    }
  }
  console.log('All templates exported successfully in Zubu.');

  // Load Communications
  console.log('Loading communications from files...');
  const files = fs.readdirSync(exportsDir);
  const matchedFiles = files.filter((file: string) => file.startsWith('communication'));

  for (const file of matchedFiles) {
    const fullPath = path.join(exportsDir, file);
    
    const communication = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))[0];
    console.log(`Createting templates for communication: ${communication.Name}`);
    console.log(`Creating Issuance template for:  ${communication.CaseName} -> ${communication.Name}`);
    await createTemplate(context.request, auth?.accessToken, {
      templateName: `${communication.CaseName} - ${communication.Name} - ${communication.IssuanceSubject}`,
      templateBody: JSON.stringify(communication.IssuanceContent),
      tenantId: auth?.tenant_id
    });

    console.log(`Creating Reissuance template for: ${communication.CaseName}`);
    await createTemplate(context.request, auth?.accessToken, {
      templateName: `${communication.CaseName} - ${communication.Name} - ${communication.ReissuanceSubject}`,
      templateBody: JSON.stringify(communication.ReissuanceContent),
      tenantId: auth?.tenant_id
    });

    console.log(`Creating Release template for: ${communication.CaseName}`);
    await createTemplate(context.request, auth?.accessToken, {
      templateName: `${communication.CaseName} - ${communication.Name} - ${communication.ReleaseSubject}`,
      templateBody: JSON.stringify(communication.ReleaseContent),
      tenantId: auth?.tenant_id
    });
    console.log(`Template created for communication: ${communication.templateName}`);
  }
  console.log('All communications exported successfully in Zubu.');

  // Teardown
  await context.close();
  await browser.close();
})();