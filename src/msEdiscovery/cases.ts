import { Page } from "playwright";

export class MSEDiscoveryCasesScraper {
  private page: Page;
  private tenantId: string;

  constructor(page: Page) {
    this.page = page;
    this.tenantId = process.env.MS_TENANT_ID!;
  }

  private async goto(): Promise<void> {
    await this.page.goto(`https://purview.microsoft.com/ediscovery/advancedediscovery?viewid=Cases&tid=${this.tenantId}`);
  }

  async scrapeCases(): Promise<any[]> {
    const urlRegex = /https:\/\/purview\.microsoft\.com\/apiproxy\/aedmcc\/ediscovery\/v1\/cases/;
    const casesPromise = this.page.waitForResponse(urlRegex, { timeout: 45000 });
    await this.goto();
    console.log('Waiting to capture the cases list...');
    const response = await casesPromise;
    if (response) {
      const casesData = (await response.json()).value;
      console.log(`Captured ${casesData.length} cases from Microsoft E-Discovery.`);
      return casesData;
    } else {
      console.error('Failed to scrape cases from Microsoft E-Discovery.');
      return [];
    }
  }
}