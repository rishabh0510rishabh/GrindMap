import puppeteer from 'puppeteer';

let browser = null;

export const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
};
