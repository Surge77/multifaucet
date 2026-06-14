import { expect, test, type Page } from '@playwright/test';

const VALID_ADDRESS = '0x1111111111111111111111111111111111111111';
const PER_CHAIN_USD = 1000;
const MAINNET_CHAIN_IDS = [1, 8453, 42161];
const EXPECTED_TOTAL = '$3,000.00'; // 3 mainnets * $1,000 each

function envelope<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString() };
}

function errorEnvelope(code: string, message: string) {
  return { success: false, error: { code, message }, timestamp: new Date().toISOString() };
}

function chainPortfolio(chainId: number) {
  return {
    chainId,
    chainName: `Chain ${chainId}`,
    native: { symbol: 'ETH', raw: '1000000000000000000', formatted: '1', usdValue: PER_CHAIN_USD },
    tokens: [],
    totalUsd: PER_CHAIN_USD,
  };
}

// The client now requests every mainnet in one call, so the handler returns an
// array of per-chain portfolios.
async function stubPortfolioApi(page: Page) {
  await page.route('**/api/portfolio**', async (route) => {
    await route.fulfill({ json: envelope(MAINNET_CHAIN_IDS.map(chainPortfolio)) });
  });
  await page.route('**/api/prices**', (route) => route.fulfill({ json: envelope({}) }));
}

test('renders the hero and dashboard tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /fund testnets/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Faucet' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Portfolio' })).toBeVisible();
});

test('theme toggle flips the color scheme', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const startedDark = ((await html.getAttribute('class')) ?? '').includes('dark');

  await page.getByRole('button', { name: 'Toggle color theme' }).click();

  if (startedDark) {
    await expect(html).not.toHaveClass(/dark/);
  } else {
    await expect(html).toHaveClass(/dark/);
  }
});

test('portfolio shows totals for a pasted address', async ({ page }) => {
  await stubPortfolioApi(page);
  await page.goto('/');

  await page.getByRole('tab', { name: 'Portfolio' }).click();
  await page.getByLabel('Address').fill(VALID_ADDRESS);

  await expect(page.getByText('Total value')).toBeVisible();
  await expect(page.getByText(EXPECTED_TOTAL)).toBeVisible();
});

test('portfolio shows a zero total for an address with no holdings', async ({ page }) => {
  await page.route('**/api/portfolio**', (route) => route.fulfill({ json: envelope([]) }));
  await page.route('**/api/prices**', (route) => route.fulfill({ json: envelope({}) }));
  await page.goto('/');

  await page.getByRole('tab', { name: 'Portfolio' }).click();
  await page.getByLabel('Address').fill(VALID_ADDRESS);

  await expect(page.getByText('Total value')).toBeVisible();
  await expect(page.getByText('$0.00')).toBeVisible();
});

test('portfolio surfaces an error when the API fails', async ({ page }) => {
  await page.route('**/api/portfolio**', (route) =>
    route.fulfill({
      status: 502,
      json: errorEnvelope('PORTFOLIO_ERROR', 'Failed to load balances'),
    }),
  );
  await page.goto('/');

  await page.getByRole('tab', { name: 'Portfolio' }).click();
  await page.getByLabel('Address').fill(VALID_ADDRESS);

  await expect(page.getByText(/couldn.t load balances/i)).toBeVisible();
});

test('watchlist persists a saved address across reloads', async ({ page }) => {
  await stubPortfolioApi(page);
  await page.goto('/');

  await page.getByRole('tab', { name: 'Portfolio' }).click();
  await page.getByLabel('Address').fill(VALID_ADDRESS);
  await page.getByRole('button', { name: 'Save address' }).click();

  await page.reload();
  await page.getByRole('tab', { name: 'Portfolio' }).click();

  const chip = page.getByRole('button', { name: '0x1111…1111' });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByLabel('Address')).toHaveValue(VALID_ADDRESS);
});
