const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log(`BROWSER_LOG: ${msg.text()}`);
    });

    await page.goto('http://localhost:3000/login');

    // Login
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard and overview logs
    await page.waitForNavigation();
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
})();
