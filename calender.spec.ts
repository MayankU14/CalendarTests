import { expect, test } from '@playwright/test';
import { CalendarPage } from './CalendarPage';

test.describe('Calendar Widget Tests', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    const calendarBaseURL = 'https://funnel-preview-dot-highlevel-staging.uc.r.appspot.com/widget/bookings/tests-cal'; 
    await calendarPage.openCalendar(calendarBaseURL);
  });

  test('Basic Calendar Test', async ({ page }) => {
    // Placeholder for additional steps
    console.log('Calendar opened with widget_type=classic');
    await calendarPage.navigateToRandomMonth();
    // const timeZone = await calendarPage.selectTimezone();
    await calendarPage.selectRandomAvailableDate();
    await calendarPage.selectRandomAvailableSlot();
    await calendarPage.bookSlot();
    
    // Data to fill the form
    const firstname = 'James';
    const lastname = 'Bond'
    const email = 'james.bond@example.com';
    const phone = '9876543210';
  
    // Fill out the form
    await calendarPage.fillForm(firstname, lastname, phone, email);

    await calendarPage.submitForm();

    await page.waitForTimeout(2000); 

    await calendarPage.bookAppointmentAndGetAPIResponse();

    await calendarPage.skip();

  });
});
