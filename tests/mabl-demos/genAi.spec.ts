import { expect, test } from "../fixtures";

test('Evaluate a GenAI assertion to validate the state of a page', async ({
  page,
  mabl,
}) => {
  await page.goto('https://www.mabl.com');

  const prompt =
    'Please validate that the web page you are looking at is a marketing page for a company named mabl which does automated UI testing';
  const result = await mabl.evaluateGenAiAssertion(page, prompt);
  console.log('GEN AI EXPLANATION');
  console.log(result.explanation);
  expect(result.success).toBe(true);
});

// Enable "GenAI file downloads" in Labs before using this test
test('Evaluate a GenAI assertion with downloaded CSV file', async ({page, mabl}) => {
  await page.goto('https://sandbox.mabl.com/downloads-pdfs');

  // Wait for the download button and trigger download
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Download CSV').click();
  const download = await downloadPromise;

  const result = await mabl.evaluateGenAiAssertionInFile(
    page,
    'Outdoor Patio Chair is in stock',
    download,
  );

  console.log('GEN AI EXPLANATION FOR CSV');
  console.log(result.explanation);
  expect(result.success).toBe(true);
});