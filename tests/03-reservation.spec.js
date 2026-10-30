const { test, expect } = require('@playwright/test');

// MISSION 3 — Add two realistic tests:
// (a) invalid email gives visible error without a POST to /api/reservations
// (b) a successful reservation; intercept/mock POST /api/reservations and assert
//     the JSON request payload and success message.

test('invalid email blocks reservation', async ({ page }) => {
  let reservationRequests = 0;
  await page.route('**/api/reservations', async route => {
    reservationRequests++;
    await route.abort();
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await page.getByLabel('Email address').fill('not-an-email');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('');
  expect(reservationRequests).toBe(0);
});

test('reservation sends correct payload and confirms booking', async ({ page }) => {
  let payload;
  await page.route('**/api/reservations', async route => {
    expect(route.request().method()).toBe('POST');
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ reservationId: 'CB-DEMO-777', stationId: 'central' })
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await expect(page.getByText('Selected station: Central Square')).toBeVisible();
  await page.getByLabel('Email address').fill('student@example.com');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByRole('status')).toHaveText('Reservation confirmed: CB-DEMO-777');
  expect(payload).toEqual({ stationId: 'central', email: 'student@example.com' });
});
