import { Page } from "playwright";
const fs = require('fs');
export class MSEDiscoveryCommunicationsScraper {
  private page: Page;
  private tenantId: string;

  constructor(page: Page) {
    this.page = page;
    this.tenantId = process.env.MS_TENANT_ID!;
  }

  private async goto(eDiscoveryCase: { id: string, name: string }): Promise<void> {
    await this.page.goto(`https://purview.microsoft.com/ediscovery/advancedediscovery/cases/v2/${eDiscoveryCase.id}?tid=${this.tenantId}&casename=${eDiscoveryCase.name}&casesworkbench=CommunicationsTab`);
  }

  async logError(message: string, error: Error): Promise<void> {
    console.error(`Error: ${message}`, error);

    // Store in a log file
    const fs = require('fs');
    const logFilePath = 'error_log.txt';
    const logMessage = `${new Date().toISOString()} - ${message}\n${error.stack}\n\n`;
    fs.appendFile(logFilePath, logMessage, (err: Error) => {
      if (err) {
        console.error('🔴 Failed to write to log file:', err);
      } else {
        console.log('🧧 Error logged to file:', logFilePath);
      }
    });
  }

  async scrapeCommunications(eDiscoveryCase: { id: string, name: string }): Promise<JSON[]> {
    try {
      const urlRegex = /https:\/\/purview\.microsoft\.com\/apiproxy\/aedmcc\/ediscovery\/v1\/cases\('[0-9a-fA-F\-]+'\)\/communications/;
      const communicationsPromise = this.page.waitForResponse(urlRegex, { timeout: 45000 });
      await this.goto(eDiscoveryCase);
      const response = await communicationsPromise;
      if (response) {
        const communicationsData = (await response.json()).value;
        return communicationsData;
      }
      else {
        console.error('❌ Failed to scrape communications from Microsoft E-Discovery.');
        return [];
      }
    } catch (error) {
      console.error(`🔴 Error scraping communications for case ${eDiscoveryCase.name}:`, error);
      await this.logError(`🔴 Error scraping communications for case ${eDiscoveryCase.name}`, error as Error);
      return [];
    }
  }

  async scrapeExportCommunicationsForCases(cases:any[]): Promise<void> {
    const eDiscoveryCasesCount = cases.length;
    for (const eDiscoveryCase of cases) {
      // Progress logging
      const percetnage = ((cases.indexOf(eDiscoveryCase) + 1) / eDiscoveryCasesCount * 100).toFixed(2);
      console.log(`------------------------------${percetnage}%----------------------------------------`);

      console.log(`🟡 Scraping communications for case: ${eDiscoveryCase.displayName}`);
      const communications = await this.scrapeCommunications({
        id: eDiscoveryCase.id,
        name: eDiscoveryCase.displayName
      });

      console.log(`✅ Scraped ${communications.length} communications for case: ${eDiscoveryCase.displayName}`);
      const communicationsCount = communications.length;

      // Export communications to JSON file
      if (communicationsCount > 0) {
        const caseExportPath = `exports/communications_${eDiscoveryCase.id}.json`;
        fs.writeFileSync(caseExportPath, JSON.stringify(communications, null, 2));
        console.log(`✅ Communications for case ${eDiscoveryCase.displayName} exported to ${caseExportPath}`);
      }
      console.log(`-----------------------------------------------------------------------------------`);
    }
  }
}