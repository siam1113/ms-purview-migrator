import { Page } from "playwright";

export class MSEDiscoveryTemplateScraper {
  private page: Page;
  private tenantId: string;

  constructor(page: Page) {
    this.page = page;
    this.tenantId = process.env.tenant_id!;
  }

  async goto(): Promise<void> {
    await this.page.goto(`https://purview.microsoft.com/ediscovery/advancedediscovery/globalsettings?viewid=Overview&tid=${this.tenantId}`);
    console.log('Navigating to Microsoft E-Discovery page');
    await this.handlePopup();
    await this.page.waitForSelector('text=Communication Library', { timeout: 20000 });
    console.log('E-Discovery page loaded successfully');
  }

  async handlePopup(): Promise<void> {
    const getStartedButton = this.page.locator('button:has-text("Get started")');
    await getStartedButton.click();
    console.log('Clicked on Get started button');
    await this.page.waitForTimeout(2000); // Wait for popup to close

    const doneButton = this.page.locator('button:has-text("Done")');
    await doneButton.click();
    console.log('Clicked on Done button');
    await this.page.waitForTimeout(2000); // Wait for any transitions to complete
  }

  async clickOnCommunicationLibrary(): Promise<void> {
    const communicationLibrary = this.page.locator('#CommunicationLibrary');
    await communicationLibrary.click();
    console.log('Clicked on Communication Library');
    await this.page.waitForSelector('[data-automationid="DetailsRow"]', { timeout: 10000 });
  }

  async scrapeTemplates(): Promise<JSON[]> {
    const templateRow = this.page.locator('[data-automationid="DetailsRow"]');
    const templates: JSON[] = [];
    const templateRows = await templateRow.all();

    const editButton = this.page.locator('button:has-text("Edit")');
    const cancelButton = this.page.locator('button:has-text("Cancel")');
    const urlRegex = /https:\/\/purview\.microsoft\.com\/apiproxy\/aedmcc\/ediscovery\/v1\/communicationtemplates\('[0-9a-fA-F\-]+'\)/;
    for (const row of templateRows) {
      const templateLocator = row.locator('[data-automationid="DetailsRowCell"]');
      const templateName = await templateLocator.first().innerText();
      console.log(`Found template: ${templateName}`);

 
      await templateLocator.first().click();
      const templatePromise = this.page.waitForResponse(urlRegex, { timeout: 15000 });
      await editButton.click();
      console.log(`Clicked on Edit for template: ${templateName}`);
      console.log(`Waiting for response for template: ${templateName}`);
      const response = await templatePromise;
      console.log(`Response received for template: ${templateName}`);
      if (response) {
        const templateData = await response.json();
        templates.push(templateData);
        console.log(`Template data for ${templateName} scraped successfully.`);
      } else {
        console.error(`Failed to scrape template data for ${templateName}.`);
      }
      await cancelButton.click();
      console.log(`Clicked on Cancel for template: ${templateName}`);
    }

    console.log(`Total templates found: ${templates.length}`);
    return templates;
  }
}