import { BrowserContext, Page } from '@playwright/test';
import {test, expect} from '../fixtures';
import { MablFixtures, MablToolset } from '@mablhq/playwright-tools';

test.describe.configure({ mode: 'serial' });

test('Create an invoice', async ({context, page, mabl}) => {
  await login(context, page, mabl);
  await page.getByLabel('Invoices').click();
  await page.getByRole('link', { name: 'New Invoice', exact: true }).click();

  await page.getByLabel('Invoices', {exact: true}).click();
  await page.getByRole('link', { name: 'New Invoice', exact: true }).click();
  const invoiceNumber = await page.getByPlaceholder('Enter an Invoice #').inputValue();

  await page.getByPlaceholder('Select a Client').click();
  await page.locator('[data-option-index="0"]').click();
  await page.getByText('$').first().click();
  
  await page.locator('.invoice-addLineItem').click();
  await page.getByText('Item 1').click();
  await expect(page.getByText('$').first()).toHaveText('$750.00');

  
  await page.getByLabel('Save').click();

  // See details
  await page.locator(`[data-invoicenumber="${invoiceNumber}"]`).click();

  await expect(page.getByRole('heading', { name: `Invoice ${invoiceNumber}`, exact: true })).toBeVisible();

  // TODO: How we test PDF?
  await page.getByLabel('More Actions').click();

  const downloadPromise = page.waitForEvent('download');

  await page.locator('.js-download-pdf-invoice-more-actions').click();

  const download = await downloadPromise;
  await download.saveAs(`./downloads/${invoiceNumber}.pdf`);

  // create a Page for the downloaded PDF to open in
  const pageForPdf = await context.newPage();

  // use the mabl tools to open the file in a new Page 
  await mabl.openPdfFile(`./downloads/${invoiceNumber}.pdf`, pageForPdf);

  // Visual assertions are known as "GenAI Assertions" in the evaluateGenAiAssertion function.
  const aiResult = await mabl.evaluateGenAiAssertion(
    pageForPdf, 
    `
    This is an invoice for $750.00
    The invoice is in English.
    The invoice has no images at all.
    `);

  expect(aiResult.success).toBeTruthy();
});

async function login(context: BrowserContext, page: Page, mabl: MablToolset) {
  // Print friendly current time
  console.log(`Running test at ${new Date().toISOString()}`);
  const credential = await mabl.getCredentials(process.env.MABL_CREDENTIALS_ID!);
  const emailPage = await context.newPage();

  const mablEmailPromise = mabl.waitForEmail(credential.username, emailPage, {
    lookbackTimeMs: 1,
  });

  await page.goto("/");
  await page.getByLabel("Email").fill(credential.username);
  await page.getByLabel("Password").fill(credential.password);

  await page.getByRole("button", { name: "Log In" }).click();

  const mablEmail = await mablEmailPromise;
  await mablEmail.open();

  const code = (await mablEmail
    .getBodyLocator()
    .locator(".two-factor-auth-code-container")
    .textContent())!;
  await page.getByLabel("Verification code digit 1").pressSequentially(code);
  await emailPage.close();
}

