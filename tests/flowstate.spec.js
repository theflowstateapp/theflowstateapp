const { test, expect } = require('@playwright/test');

test.describe('FlowState App', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.getByText('Make your life')).toBeVisible();
    
    // Check if the AI-powered LifeOS badge is present
    await expect(page.getByText('AI‑powered LifeOS')).toBeVisible();
    
    // Check if the tour button exists
    await expect(page.getByText('Take Tour')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Click on Dashboard
    await page.getByText('Dashboard').click();
    
    // Check if we're on the dashboard
    await expect(page.getByText('Your life, neatly summarized.')).toBeVisible();
    
    // Check if P.A.R.A. organization is visible
    await expect(page.getByText('P.A.R.A. Organization')).toBeVisible();
    
    // Navigate to AI Assistant
    await page.getByText('AI Assistant').click();
    
    // Check if AI Assistant page loads
    await expect(page.getByText('AI Life Assistant')).toBeVisible();
  });

  test('AI assistant chat interface works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('AI Assistant').click();
    
    // Find the AI chat input
    const chatInput = page.getByPlaceholder('Tell me about your day, goals, or challenges...');
    await expect(chatInput).toBeVisible();
    
    // Test typing a message
    await chatInput.fill('I woke up at 7:30 AM and need to workout today');
    
    // Click send button
    const sendButton = page.getByText('Send');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    
    // Check if "Processing..." appears
    await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('tour functionality works', async ({ page }) => {
    await page.goto('/');
    
    // Start the tour
    await page.getByText('Take Tour').click();
    
    // Check if tour modal appears
    await expect(page.getByText('Welcome to FlowState')).toBeVisible();
    await expect(page.getByText('App Tour')).toBeVisible();
    
    // Navigate through tour steps
    await page.getByText('Next').click();
    await expect(page.getByText('AI Assistant')).toBeVisible();
    
    // Complete tour
    await page.getByText('Complete Tour').click();
    
    // Check if tour modal is closed
    await expect(page.getByText('Welcome to FlowState')).not.toBeVisible();
  });

  test('P.A.R.A. method displays correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Dashboard').click();
    
    // Check all P.A.R.A. categories are visible
    await expect(page.getByText('📁 Projects')).toBeVisible();
    await expect(page.getByText('🏢 Areas')).toBeVisible();
    await expect(page.getByText('📚 Resources')).toBeVisible();
    await expect(page.getByText('📦 Archives')).toBeVisible();
    
    // Check tooltips are present
    await expect(page.locator('[data-tour="para-dashboard"]')).toBeVisible();
  });

  test('tooltips show on hover', async ({ page }) => {
    await page.goto('/');
    
    // Hover over navigation to trigger tooltip
    const dashboardButton = page.getByText('Dashboard');
    await dashboardButton.hover();
    
    // We would check for tooltip here if we had more specific selectors
    // await expect(page.getByText('Your organized life at a glance')).toBeVisible();
  });
});

