import { chromium, Browser, Page } from 'playwright';
import { Config, loadConfig } from './config';

class AutoApply {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private config: Config;

    constructor() {
        this.config = loadConfig();
    }

    async init() {
        this.browser = await chromium.launchPersistentContext(
            this.config.userDataDir,
            {
                headless: false,
            }
        );
        this.page = await this.browser.newPage();
    }

    async start() {
        await this.init();
        if (!this.page) return;
        // Navigate to website
        await this.page.goto(this.config.website.url);
        // Wait for login if needed
        await this.handleLogin();
        // Start job search process
        for (const keyword of this.config.keywords) {
            await this.searchJobs(keyword);
        }
    }

    private async handleLogin() {
        // Wait for user to scan QR code if needed
        // This is a simple implementation - you might need to adjust based on specific website
        await this.page?.waitForNavigation({
            waitUntil: 'networkidle',
            timeout: 60000,
        });
    }

    private async searchJobs(keyword: string) {
        if (!this.page) return;
        const { selectors } = this.config.website;
        // Search for jobs
        await this.page.fill(selectors.searchInput, keyword);
        await this.page.click(selectors.searchButton);
        let hasNextPage = true;
        while (hasNextPage) {
            // Process all results on current page
            await this.processJobResults();
            // Try to go to next page
            hasNextPage = await this.goToNextPage();
        }
    }

    private async processJobResults() {
        if (!this.page) return;
        const { selectors } = this.config.website;
        const results = await this.page.$$(selectors.resultList);
        for (const result of results) {
            if (!result) continue;
            await result.click();
            await this.page.click(selectors.chatButton);
            await this.page.click(selectors.backButton);
        }
    }

    private async goToNextPage(): Promise<boolean> {
        if (!this.page) return false;
        const { selectors } = this.config.website;
        const nextButton = await this.page.$(selectors.nextPageButton);
        if (nextButton) {
            await nextButton.click();
            await this.page.waitForLoadState('networkidle');
            return true;
        }
        return false;
    }
}

const app = new AutoApply();
app.start().catch(console.error);
