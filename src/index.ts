import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Config, loadConfig, ContactedJobs } from './config';
import fs from 'fs/promises';
import path from 'path';

class AutoApply {
    private browser: BrowserContext | null = null;
    private page: Page | null = null;
    private config: Config;
    private contactedJobs: ContactedJobs = {};

    constructor() {
        this.config = loadConfig();
        this.loadContactedJobs();
    }

    async init() {
        console.log('Launching browser...');
        this.browser = await chromium.launchPersistentContext(
            this.config.userDataDir,
            {
                headless: false,
            }
        );
        this.page = await this.browser!.newPage();
        console.log('Browser launched successfully');
    }

    async start() {
        console.log('Starting auto-apply process...');
        await this.init();
        if (!this.page) {
            console.error('Page initialization failed');
            return;
        }
        
        for (const keyword of this.config.keywords) {
            console.log(`Starting search for keyword: ${keyword}`);
            await this.searchJobs(keyword);
        }
        console.log('All keywords processed');
    }

    private async handleLogin() {
        if (!this.page) return;
        
        // Check if there is a login button (not logged in state)
        const loginButton = await this.page.$(this.config.website.selectors.loginButton);
        if (loginButton) {
            console.log('Detected not logged in, waiting for login...');
            await loginButton.click();
            // Wait for the login dialog to appear
            await this.page.waitForSelector(this.config.website.selectors.loginDialog, { timeout: 10000 });
            console.log('Please scan QR code to login...');
            // Wait for the user profile element to appear, indicating successful login
            await this.page.waitForSelector(this.config.website.selectors.userProfile, { timeout: 60000 });
            console.log('Login successful');
        }
    }

    private async searchJobs(keyword: string) {
        if (!this.page) return;
        const { selectors } = this.config.website;
        
        console.log(`Navigating to search page: ${keyword}`);
        const searchUrl = this.config.website.url.replace('{keyword}', encodeURIComponent(keyword));
        await this.page.goto(searchUrl);
        
        
        let pageNum = 1;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`Processing page ${pageNum}`);
            await this.processJobResults();
            hasNextPage = await this.goToNextPage();
            pageNum++;
        }
        console.log(`All pages processed for keyword "${keyword}"`);
    }

    private async processJobResults() {
        if (!this.page) return;
        const { selectors } = this.config.website;
        
        // Wait for at least one job card to appear
        console.log('Waiting for job list to load...');
        await this.page.waitForSelector(selectors.resultList, { timeout: 10000 });
        
        await this.handleLogin();
        
        // Give some extra time for all jobs to load
        await this.page.waitForTimeout(1000);
        
        const results = await this.page.$$(selectors.resultList);
        console.log(`Found ${results.length} jobs`);
        
        // Record the URL of the current search page
        const currentUrl = this.page.url();
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result) continue;
            
            // Extract job ID and title
            const jobLink = await result.$('a.job-card-left');
            const href = await jobLink?.getAttribute('href');
            const jobId = href ? this.extractJobId(href) : null;
            const jobTitle = await result.$eval('.job-name', el => el.textContent || '');
            
            // Check if already contacted
            if (jobId && this.contactedJobs[jobId]) {
                console.log(`Skipping previously contacted job: ${jobTitle}`);
                continue;
            }
            
            console.log(`Processing job ${i + 1}/${results.length}`);
            
            try {
                const hrInfo = await result.waitForSelector(':scope .job-info .info-public', {
                    timeout: 5000,
                    state: 'attached'
                });
                
                if (hrInfo) {
                    const hrText = await hrInfo.textContent();
                    console.log('Found HR info:', hrText);
                    
                    await hrInfo.click();
                    console.log('Clicking HR info area');
                    
                    // Check if the previous contact prompt appears
                    try {
                        const cancelBtn = await this.page.waitForSelector(selectors.greetDialogCancelBtn, {
                            timeout: 3000,
                            state: 'attached'
                        });
                        if (cancelBtn) {
                            console.log('Detected previous contact prompt, clicking cancel');
                            await cancelBtn.click();
                            continue;  // Skip this job
                        }
                    } catch {
                        // No dialog appears, continue normal process
                        await this.page.waitForURL('https://www.zhipin.com/web/geek/chat');
                        console.log('Waiting for chat page to load');
                        
                        // Wait for default message to be sent
                        try {
                            await this.page.waitForSelector(selectors.chatMessage, {
                                timeout: 5000,
                                state: 'attached'
                            });
                            console.log('Confirmed default message sent');
                        } catch (error) {
                            console.log('Message sending not detected, might have failed');
                        }
                        
                        // Return to the search results page and wait for loading
                        console.log('Returning to search results page');
                        await this.page.goBack();
                        await this.page.waitForURL(currentUrl);
                        console.log('Waiting for page to reload...');
                        // await this.page.waitForLoadState('networkidle');
                        
                        // Ensure job list is rendered
                        console.log('Waiting for job list to re-render...');
                        await this.page.waitForSelector(selectors.resultList, { timeout: 10000, state: 'attached' });
                        await this.page.waitForTimeout(2000); // Give more time for the list to fully load
                        
                        // Re-fetch job list
                        const newResults = await this.page.$$(selectors.resultList);
                        results.splice(0, results.length, ...newResults);
                    }
                }
                
                // If message sending is successful, record this job
                if (jobId) {
                    this.contactedJobs[jobId] = jobTitle;
                    await this.saveContactedJobs();
                }
                
                // Add operation interval
                await this.page?.waitForTimeout(this.config.interval);
            } catch (error) {
                console.log('Element search timeout, skipping this job');
                continue;
            }
        }
    }

    private async goToNextPage(): Promise<boolean> {
        if (!this.page) return false;
        const { selectors } = this.config.website;
        const nextButton = await this.page.$(selectors.nextPageButton);
        if (nextButton) {
            console.log('Clicking next page');
            
            // Get current page number from URL or some element
            const currentPage = await this.getCurrentPageNumber();
            console.log('Current page number:', currentPage);
            
            await nextButton.click();
            console.log('Next page button clicked');
            
            // Wait for basic page load
            await this.page.waitForLoadState('domcontentloaded');
            console.log('DOM content loaded event fired');
            
            // Wait for job list to appear
            await this.page.waitForSelector(selectors.resultList, {
                state: 'attached',
                timeout: 10000
            });
            console.log('Job list element found in DOM');
            
            // Optional: Wait for new page number to be different
            if (currentPage) {
                await this.page.waitForFunction(
                    (oldPage) => {
                        const newPage = document.querySelector('.page')?.textContent;
                        return newPage && newPage !== oldPage;
                    },
                    currentPage,
                    { timeout: 10000 }
                );
                console.log('Page number changed confirmed');
            }
            
            return true;
        }
        console.log('No more pages');
        return false;
    }

    // Helper method to get current page number
    private async getCurrentPageNumber(): Promise<string | null> {
        try {
            return await this.page?.$eval('.page', el => el.textContent || null) || null;
        } catch {
            return null;
        }
    }

    // Load previously contacted job records
    private async loadContactedJobs() {
        try {
            const data = await fs.readFile(this.config.contactedJobsFile, 'utf-8');
            this.contactedJobs = JSON.parse(data);
        } catch {
            this.contactedJobs = {};
        }
    }
    
    // Save previously contacted job records
    private async saveContactedJobs() {
        await fs.writeFile(
            this.config.contactedJobsFile,
            JSON.stringify(this.contactedJobs, null, 2),
            'utf-8'
        );
    }
    
    // Extract job ID from URL
    private extractJobId(href: string): string | null {
        const match = href.match(/\/job_detail\/([^.]+)\.html/);
        return match ? match[1] : null;
    }
}

const app = new AutoApply();
app.start().catch(console.error);
