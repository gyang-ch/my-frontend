import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Attempt to click the Geographical Distribution tab
    try {
      await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, a'));
        const geoTab = tabs.find(t => t.textContent.toLowerCase().includes('geographical'));
        if (geoTab) geoTab.click();
      });
      // Wait for any errors to surface
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log("Could not find/click tab:", e.message);
    }
    
    await browser.close();
  } catch (error) {
    console.error('Script Error:', error);
  }
})();
