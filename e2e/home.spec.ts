import { expect, test, type Page } from '@playwright/test';

const VALID_ADDRESS = '0x1111111111111111111111111111111111111111';
const PER_CHAIN_USD = 1000;
const EXPECTED_TOTAL = '$3,000.00'; // 3 mainnets * $1,000 each

function envelope<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString() };
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

async function stubPortfolioApi(page: Page) {
  await page.route('**/api/portfolio**', async (route) => {
    const chainId = Number(new URL(route.request().url()).searchParams.get('chainId'));
    await route.fulfill({ json: envelope(chainPortfolio(chainId)) });
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
