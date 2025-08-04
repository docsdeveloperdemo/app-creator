const { chromium } = require('playwright');

// Browser automation utilities
let browserContext = null;
let currentPage = null;
let consoleLogs = [];

// Initialize browser context
async function initBrowser() {
    if (!browserContext) {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browserContext = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
    }
    if (!currentPage) {
        currentPage = await browserContext.newPage();
        
        // Set up console log capture
        currentPage.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                location: msg.location()
            });
            
            // Keep only last 1000 logs to prevent memory issues
            if (consoleLogs.length > 1000) {
                consoleLogs = consoleLogs.slice(-1000);
            }
        });
        
        // Capture page errors
        currentPage.on('pageerror', error => {
            consoleLogs.push({
                type: 'error',
                text: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });
        
        // Capture request failures
        currentPage.on('requestfailed', request => {
            consoleLogs.push({
                type: 'network-error',
                text: `Request failed: ${request.url()}`,
                failure: request.failure(),
                timestamp: new Date().toISOString()
            });
        });
    }
    return currentPage;
}

// Browser operation handlers
const browserOperations = {
    async screenshot(payload) {
        const { url, fullPage = true, outputPath, selector } = payload;
        
        if (!url) {
            throw new Error('URL is required for screenshot');
        }
        
        const page = await initBrowser();
        
        // Navigate to URL
        await page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Wait a bit for any dynamic content
        await page.waitForTimeout(2000);
        
        // Take screenshot
        const screenshotOptions = {
            fullPage,
            type: 'png'
        };
        
        if (outputPath) {
            screenshotOptions.path = outputPath;
        }
        
        let screenshot;
        if (selector) {
            // Screenshot specific element
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Selector "${selector}" not found`);
            }
            screenshot = await element.screenshot(screenshotOptions);
        } else {
            // Screenshot full page or viewport
            screenshot = await page.screenshot(screenshotOptions);
        }
        
        console.log(`📸 Screenshot taken: ${url}`);
        
        return {
            success: true,
            url,
            screenshotPath: outputPath || null,
            screenshotBase64: outputPath ? null : screenshot.toString('base64'),
            fullPage,
            selector,
            pageTitle: await page.title(),
            timestamp: new Date().toISOString()
        };
    },
    
    async navigate(payload) {
        const { url, waitUntil = 'networkidle' } = payload;
        
        if (!url) {
            throw new Error('URL is required');
        }
        
        const page = await initBrowser();
        
        // Clear console logs for new navigation
        consoleLogs = [];
        
        const response = await page.goto(url, { 
            waitUntil,
            timeout: 30000 
        });
        
        console.log(`🌐 Navigated to: ${url}`);
        
        return {
            success: true,
            url,
            status: response.status(),
            statusText: response.statusText(),
            pageTitle: await page.title(),
            pageUrl: page.url(),
            timestamp: new Date().toISOString()
        };
    },
    
    async getConsoleLogs(payload) {
        const { clearAfterRead = false, filterType } = payload;
        
        let logs = consoleLogs;
        
        // Filter by type if specified
        if (filterType) {
            logs = logs.filter(log => log.type === filterType);
        }
        
        // Clear logs if requested
        if (clearAfterRead) {
            consoleLogs = [];
        }
        
        console.log(`📋 Retrieved ${logs.length} console logs`);
        
        return {
            success: true,
            logs,
            count: logs.length,
            currentUrl: currentPage ? currentPage.url() : null,
            timestamp: new Date().toISOString()
        };
    },
    
    async evaluate(payload) {
        const { code, args = [] } = payload;
        
        if (!code) {
            throw new Error('Code is required for evaluation');
        }
        
        const page = await initBrowser();
        
        // Evaluate code in page context
        const result = await page.evaluate(code, ...args);
        
        console.log(`⚡ Evaluated code in browser context`);
        
        return {
            success: true,
            result,
            currentUrl: page.url(),
            timestamp: new Date().toISOString()
        };
    },
    
    async click(payload) {
        const { selector, timeout = 5000 } = payload;
        
        if (!selector) {
            throw new Error('Selector is required for click');
        }
        
        const page = await initBrowser();
        
        // Wait for element and click
        await page.waitForSelector(selector, { timeout });
        await page.click(selector);
        
        console.log(`🖱️ Clicked on: ${selector}`);
        
        return {
            success: true,
            selector,
            currentUrl: page.url(),
            timestamp: new Date().toISOString()
        };
    },
    
    async type(payload) {
        const { selector, text, delay = 0 } = payload;
        
        if (!selector || text === undefined) {
            throw new Error('Selector and text are required for typing');
        }
        
        const page = await initBrowser();
        
        // Wait for element and type
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.type(selector, text, { delay });
        
        console.log(`⌨️ Typed text in: ${selector}`);
        
        return {
            success: true,
            selector,
            textLength: text.length,
            currentUrl: page.url(),
            timestamp: new Date().toISOString()
        };
    },
    
    async waitFor(payload) {
        const { selector, timeout = 10000, state = 'visible' } = payload;
        
        if (!selector) {
            throw new Error('Selector is required for waiting');
        }
        
        const page = await initBrowser();
        
        // Wait for element with specified state
        await page.waitForSelector(selector, { timeout, state });
        
        console.log(`⏳ Waited for: ${selector} (${state})`);
        
        return {
            success: true,
            selector,
            state,
            currentUrl: page.url(),
            timestamp: new Date().toISOString()
        };
    },
    
    async getPageContent(payload) {
        const { format = 'html' } = payload;
        
        const page = await initBrowser();
        
        let content;
        if (format === 'text') {
            content = await page.textContent('body');
        } else {
            content = await page.content();
        }
        
        console.log(`📄 Retrieved page content (${format})`);
        
        return {
            success: true,
            content,
            format,
            currentUrl: page.url(),
            pageTitle: await page.title(),
            timestamp: new Date().toISOString()
        };
    },
    
    async closeBrowser() {
        if (currentPage) {
            await currentPage.close();
            currentPage = null;
        }
        if (browserContext) {
            await browserContext.close();
            browserContext = null;
        }
        consoleLogs = [];
        
        console.log(`🚪 Browser closed`);
        
        return {
            success: true,
            message: 'Browser closed successfully',
            timestamp: new Date().toISOString()
        };
    }
};

// Helper function to convert codespace URLs to localhost URLs
function convertCodespaceUrlToLocalhost(url) {
    if (!url) return url;
    
    // Pattern to match codespace URLs
    const codespacePattern = /https:\/\/[^-]+-(\d+)\.app\.github\.dev/;
    const match = url.match(codespacePattern);
    
    if (match) {
        const port = match[1];
        // Replace the codespace URL with localhost URL
        const localhostUrl = url.replace(match[0], `http://localhost:${port}`);
        console.log(`🔄 Converted URL: ${url} → ${localhostUrl}`);
        return localhostUrl;
    }
    
    return url;
}

// Browser operation request handler
async function handleBrowserOperation(req, res, operation) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const payload = body ? JSON.parse(body) : {};
            console.log("this is the payload", payload)
            
            // Convert codespace URLs to localhost URLs if present
            if (payload.url) {
                payload.url = convertCodespaceUrlToLocalhost(payload.url);
            }
            
            const result = await operation(payload);

            console.log(result)
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            console.error(`❌ Browser operation error:`, error.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: error.message,
                type: error.constructor.name,
                stack: error.stack
            }));
        }
    });
}

module.exports = {
    browserOperations,
    handleBrowserOperation,
    initBrowser
};