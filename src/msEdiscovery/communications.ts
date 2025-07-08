import { Page } from "playwright";

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
        console.error('Failed to write to log file:', err);
      } else {
        console.log('Error logged to file:', logFilePath);
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
        console.log(`Scraped ${communicationsData.length} communications from Microsoft E-Discovery.`);
        return communicationsData;
      }
      else {
        console.error('Failed to scrape communications from Microsoft E-Discovery.');
        return [];
      }
    } catch (error) {
      console.error(`Error scraping communications for case ${eDiscoveryCase.name}:`, error);
      await this.logError(`Error scraping communications for case ${eDiscoveryCase.name}`, error as Error);
      return [];
    }
  }
}