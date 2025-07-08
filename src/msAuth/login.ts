import { Page } from "playwright";

export class MSLogin {
  private page: Page;
  private username: string;
  private password: string;

  constructor(page: Page) {
    this.page = page;
    this.username = process.env.MS_USERNAME!;
    this.password = process.env.MS_PASSWORD!;
  }

  async goto(): Promise<void> {
    await this.page.goto('https://login.microsoftonline.com/');
    console.log(`Navigating to Microsoft login page for user: ${this.username}`);
  }

  async isAccountFound(): Promise<boolean> {
    return await this.page.locator('text=Pick an account').isVisible({ timeout: 5000 });
  }

  async enterCredentials(): Promise<void> {
    if (await this.isAccountFound()) {
      console.log(`Account found for user: ${this.username}`);
      console.log(`Account found for user: ${this.username}`);
      // Click on the account if it exists
      await this.page.click(`text=${this.username}`);
      console.log(`Clicked on account: ${this.username}`);
    } else {
      // Enter username
      await this.page.fill('input[name="loginfmt"]', this.username);
      await this.page.click('input[type="submit"]');
      console.log(`Entered username: ${this.username}`);
    }

    // Wait for password field
    await this.page.waitForSelector('input[name="passwd"]', { timeout: 5000 });

    // Enter password
    await this.page.fill('input[name="passwd"]', this.password);
    await this.page.click('input[type="submit"]');
    console.log(`Entered password for user: ${this.username}`);
  }


  public authenticate(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.enterCredentials();

        // Wait for potential 2FA
        try {
          await this.handle2FA();
        } catch (error) {
          console.error(`2FA handling failed for user: ${this.username}`, error);
        }

        resolve(true);
      } catch (error) {
        console.error(`Login failed for user: ${this.username}`, error);
        reject(false);
      }
    });
  }

  private async handle2FA(): Promise<void> {
    try {
      // Wait for user handling 2FA
      console.log('Please complete the two-factor authentication for your Microsoft account.');
      console.log('Waiting for user to complete 2FA...');
      await this.page.waitForURL('https://login.microsoftonline.com/common/SAS/ProcessAuth', { timeout: 60000 });

      // Wait for login to complete
      await this.page.waitForLoadState('networkidle');
      console.log(`Login successful for user: ${this.username}`);

    } catch (error) {
      console.error(`Failed to handle two-factor authentication for user: ${this.username}`, error);
    }
  }

  public async saveSession(): Promise<void> {
    await this.page.context().storageState({ path: `./sessions/${this.username}.json` });
    console.log(`Session saved for user: ${this.username}`);
  }
}