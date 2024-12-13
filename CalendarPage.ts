import { expect, Locator, Page } from '@playwright/test';
const playwright = require('playwright');

export class CalendarPage {
  readonly page: Page;
  firstnameInput: Locator;
  lastnameInput: Locator;
  emailInput: Locator;
  phoneInput: Locator;
  submitButton: Locator;
  
  // const id="";

  constructor(page: Page) {
    this.page = page;
    this.firstnameInput = page.locator('input[name="first_name"]'); 
    this.lastnameInput = page.locator('input[name="last_name"]');
    this.phoneInput = page.locator('input[name="phone"]'); 
    this.emailInput = page.locator('input[name="email"]'); 
    this.submitButton = page.locator('button[type="submit"]'); 
  }

  // Open the calendar with the required widget type
  async openCalendar(baseURL: string) {
    const urlWithWidget = `${baseURL}?widget_type=classic`;
    await this.page.goto(urlWithWidget);
  }

  async selectTimezone(): Promise<any>{
    const selectTimeZoneButton = '//div[@class="multiselect__select"]';
    const alltimeZones = '//ul[@id="listbox-null"]/li';
    await this.page.locator(selectTimeZoneButton).click();
    const allTimeZones = await this.page.locator(alltimeZones).all();

    if(allTimeZones.length === 0){
      throw new Error('No available timezone to select.');
    }
    const randomTimezone = allTimeZones[Math.floor(Math.random() * (allTimeZones.length-2))];
    await randomTimezone.waitFor({state: 'visible'});
    await randomTimezone.click();
    this.page.waitForTimeout(2000);
    console.log(randomTimezone.locator('.option__title').textContent());
  }


  // Get the current month displayed on the calendar
  async getCurrentMonth(): Promise<string> {
    const currentMonthSelector = 'button.text-capitalize'; 
    return await this.page.locator(currentMonthSelector).innerText();
  }

  // Navigate to the next month
  async clickNextMonth() {
    const nextButtonSelector = '//button[@title="Next month"]'; 
    await this.page.click(nextButtonSelector);
  }

  // Randomly pick a target month
  async getRandomMonth(): Promise<string> {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const randomIndex = Math.floor(Math.random() * months.length);
    return months[randomIndex];
  }

  // Navigate to the randomly selected month
  async navigateToRandomMonth() {
    const targetMonth = await this.getRandomMonth();
    console.log(`Target Month: ${targetMonth}`);
    await this.clickNextMonth(); //to skip 2024 december

    let currentMonth = await this.getCurrentMonth();

    while (currentMonth !== targetMonth) {
      await this.clickNextMonth();
    //   this.page.waitForTimeout(2000);
      currentMonth = await this.getCurrentMonth();
    }

    console.log(`Reached the desired month: ${currentMonth}`);
  }

   // Get all available dates for the current month
   async getAvailableDates(): Promise<string[]> {
    const availableDateSelector = 'td.selectable.vdpCell';
    await this.page.waitForSelector(availableDateSelector, { state: 'attached' });
    const availableDatesLocator = await this.page.locator(availableDateSelector).all();

    // Get the inner text of each date
    const availableDates: string[] = [];
    for (let i = 0; i < availableDatesLocator.length; i++) {
      const dateText = await availableDatesLocator[i].innerText();
      if (dateText.trim()) { 
        availableDates.push(dateText.trim());
      }
    }
    console.log(`Available Dates (including selected): ${availableDates}`);
    return availableDates;
  }

  // Select a random available date from the current month
  async selectRandomAvailableDate() {
    const availableDates = await this.getAvailableDates();
    if (availableDates.length === 0) {
      throw new Error('No available dates to select.');
    }

    const randomIndex = Math.floor(Math.random() * availableDates.length);
    const selectedDate = availableDates[randomIndex];
    console.log(`Selected Date: ${selectedDate}`);

    const dateLocator=`.selectable.vdpCell>>text="${selectedDate}"`;
    await this.page.locator(dateLocator).click();

    console.log(`Clicked on the date: ${selectedDate}`);
  }

  async getAvailableSlots(): Promise<string[]> {
    const availableSlotsLocator = '#pick-hours--am .hour-select label, #pick-hours--pm .hour-select label';

    // await this.page.waitForSelector(availableSlotsLocator, { state: 'visible' });
    const availableSlots = await this.page.locator(availableSlotsLocator).allTextContents();

    console.log('Available slots:', availableSlots);
    return availableSlots;
  }

  async selectRandomAvailableSlot(): Promise<string> {

    const availableSlots = await this.getAvailableSlots();
  
    // Ensure slots are available
    if (availableSlots.length === 0) {
      throw new Error('No available slots found!');
    }
  
    // Select a random slot
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    const selectedSlot = availableSlots[randomIndex];
  
    console.log('Randomly selected slot:', selectedSlot);
    await this.page.locator(`label>>text="${selectedSlot}"`).click();
  
    console.log(`Clicked on slot: ${selectedSlot}`);
    return selectedSlot;
  }

  async bookSlot() {
    await this.page.locator(`text='Select Date'`).click();
    console.log('Clicked on Select Date');
  }

  // fill out the form
  async fillForm(firstname: string, lastname: string, phone: string,  email: string) {
    await this.firstnameInput.fill(firstname);
    await this.page.waitForTimeout(500);
    await this.lastnameInput.fill(lastname);
    await this.page.waitForTimeout(500);
    await this.phoneInput.fill(phone);
    await this.page.waitForTimeout(500);
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(500);
  }

  // submit the form
  async submitForm() {
    await this.page.locator("input[type='checkbox']").click();
    // await this.submitButton.click();
    // console.log("Form filled");
  }

  async skip() {
    await this.page.locator("button:has-text('Skip')").click();
    console.log("Submitted");
  }

  async bookAppointmentAndGetAPIResponse(): Promise<any> {
    // Intercept the network request

    const [response] = await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/appointment') && response.request().method() === 'POST'
      ),
      await this.submitButton.click(),
      console.log("Form filled"),
      this.page.waitForTimeout(2000)
    ]);


    // Get the response body
    const responseBody = await response.json();
    // console.log(responseBody.id);
    const Id = responseBody.id;
    const contactID = responseBody.contact.id;
    const first_name= responseBody.contact.first_name;
    const last_name = responseBody.contact.last_name;
    const loactionID = responseBody.contact.loaction_id;
    const email = responseBody.contact.email;
    const phone = responseBody.contact.phone;
    const calendarID = responseBody.contact.internal_source.id;
    const start_time = responseBody.appointment.only_start_time;
    const end_time = responseBody.appointment.only_end_time;

    // console.log(calendarID);
    // console.log(contactID);

    const pitToken = "pit-1e387c7c-eb8e-4a2c-9ea9-b28ef037f2d7";
    const appointmentID = Id;

    const appointmentURL =  `https://staging.services.leadconnectorhq.com/calendars/events/appointments/${appointmentID}`;
    const contactURL = `https://staging.services.leadconnectorhq.com/contacts/${contactID}`;

    const getAppointmentResponse = await this.page.request.get(appointmentURL, {
      headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${pitToken}`,
          Version: '2021-04-15',
      },
    });

    // Handle response
    if (getAppointmentResponse.ok()) {
        const responseData = await getAppointmentResponse.json();
        // console.log('API Response:', responseData);

        const sTime = responseData.appointment.startTime;
        const startTime = await this.convertTime(sTime);
        const eTime = responseData.appointment.endTime;
        const endTime = await this.convertTime(eTime);
        // console.log(startTime);
        // console.log(start_time);
        
        if(responseData.appointment.calendarId === calendarID)
        {
          console.log("Calendar ID verified");
        }
        if(responseData.appointment.contactId === contactID)
        {
          console.log("Contact ID verified");
        }
        if(responseData.appointment.id === appointmentID)
        {
          console.log("Appointment Id verified");
        }
        if(responseData.locationId === loactionID)
        {
          console.log("Location ID verified");
        }        
        if(startTime === start_time)
        {
          console.log("start time verified");
        }
        if(endTime === end_time)
        {
          console.log("end time verified");
        }
    } else {
        console.error(`API call failed with status: ${getAppointmentResponse.status()}`);
    }


    const getContactResponse = await this.page.request.get(contactURL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${pitToken}`,
        Version: '2021-07-28',
      },
    });

    if (getContactResponse.ok()) {
      const responseData = await getContactResponse.json();
      // console.log('API Response:', responseData);
      if(responseData.contact.id === contactID)
      {
        console.log("Conatct ID verified");
      }
      if(responseData.contact.firstName === first_name)
      {
        console.log("First Name verified");
      }
      if(responseData.contact.lastName === last_name)
      {
        console.log("Last Name verified");
      }
      if(responseData.contact.email === email)
      {
        console.log("email verified");
      }   
      if(responseData.contact.phone === `${phone}`)
      {
        console.log("Phone verified");
      }         
    } else {
        console.error(`API call failed with status: ${getContactResponse.status()}`);
    }

    return responseBody;
  }

  async convertTime(Time: string): Promise<any> {
    const [time, timezone] = Time.split('T')[1].split('+');
    const formattedTime = `${time.slice(0, 5)}`; // Get 13:00
    const offset = `+${timezone}`; // Get +05:30

    // Convert 24-hour format to 12-hour format for comparison
    const [hours, minutes] = formattedTime.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    // const peroid = "";
    const twelveHourTime = `${((hours % 12) || 12).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${period}`;
    return twelveHourTime;
  }
}
