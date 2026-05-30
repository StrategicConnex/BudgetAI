import type { BudgetData } from '@/types/budget';
import { renderBudgetHTML } from './renderer';
import { renderConstructionHTML } from './renderer-construction';

function selectRenderer(budget: BudgetData): string {
  if (budget.templateId === 'construction') {
    return renderConstructionHTML(budget);
  }
  return renderBudgetHTML(budget);
}


export async function generatePDF(budget: BudgetData): Promise<Buffer> {
  const html = selectRenderer(budget);

  let browser;
  const isProduction = process.env.NODE_ENV === 'production';
  const puppeteer = await import('puppeteer-core');

  if (isProduction) {
    // Producción (Vercel/Lambda) — usar binario serverless
    const chromium = await import('@sparticuz/chromium');
    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  } else {
    // Desarrollo local — usar Chrome instalado en el sistema
    const chromePaths = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
    ].filter((p): p is string => Boolean(p));

    browser = await puppeteer.default.launch({
      executablePath: chromePaths[0],
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  }

  try {
    const page = await browser.newPage();

    // Cargar HTML — waitUntil 'load' es compatible con puppeteer-core
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 30000,
    });

    // Esperar fuentes
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
