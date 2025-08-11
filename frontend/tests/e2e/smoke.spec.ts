import { test, expect, Page } from 'playwright/test';

// Helper: set auth token in localStorage before app loads
const setAuthToken = async (page: Page) => {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const resp = await page.request.post(`${apiUrl}/api/auth/login`, {
    data: { username: 'admin', password: 'admin' },
    headers: { 'Content-Type': 'application/json' }
  });
  const body = await resp.json();
  const token = body.token as string;
  await page.addInitScript(tokenValue => {
    window.localStorage.setItem('authToken', tokenValue as string);
  }, token);
};

// Basic app smoke
test('app loads and shows main layout', async ({ page }) => {
  await setAuthToken(page);
  await page.goto('/');

  await expect(page).toHaveTitle(/friend-sched-hub/i);
  await expect(page.getByRole('heading', { name: 'RX Scheduler' }).first()).toBeVisible();
});

// Contacts + Messages wiring
test('contacts load and selecting a contact loads messages', async ({ page }) => {
  await setAuthToken(page);
  await page.goto('/');

  // Click Messages tab
  await page.getByRole('button', { name: 'Messages' }).click();

  // Expect contact list area
  await expect(page.getByPlaceholder('Search contacts...')).toBeVisible();

  // Click first contact in the list if present
  const firstContact = page.locator('[class*="cursor-pointer"]').first();
  const count = await firstContact.count();
  if (count > 0) {
    await firstContact.click();
    // Messages area should render (look for message input)
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
  }
});
