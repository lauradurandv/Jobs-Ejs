const puppeteer = require("puppeteer");
const get_chai = require("../utils/get_chai");
require("../app");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const Job = require("../models/Job");

let testUser = null;
let page = null;
let browser = null;

// Launch the browser and open a new blank page
describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });
  after(async function () {
    this.timeout(10000);
    await browser.close();
  });
  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });
  describe("index page test", function () {
    this.timeout(10000);
    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)"
      );
    });
    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe("logon page test", function () {
    this.timeout(20000);
    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });
    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector("a ::-p-text(Click this link to see jobs.)");
      await page.waitForSelector('a[href="/secretWord"]');
      await page.waitForSelector('a[href="/jobs"]');
      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });

  describe("puppeteer job operations", function () {
    this.timeout(20000);
    it("should click link for job list ", async () => {
      this.JobsLink = await page.waitForSelector(
        "a ::-p-text(Click this link to see jobs.)"
      );
    });

    it("Should display the 20 jobs", async () => {
      const { expect } = await import("chai");
      await this.JobsLink.click();
      await page.waitForNavigation();
      await page.waitForSelector("a ::-p-text(Add)");
      await page.waitForSelector('a[href="/jobs/newJob"]');
      let pageContent = await page.content();
      pageContent = pageContent.split("<tr>");
      expect(pageContent.length).to.equal(21);
    });

    it("Should click to add job", async () => {
      this.newJobLink = await page.waitForSelector("a ::-p-text(Add)");
    });

    it("Display the add new job page", async () => {
      await this.newJobLink.click();
      await page.waitForNavigation();
      this.company = await page.waitForSelector('input[name="company"]');
      this.position = await page.waitForSelector('input[name="position"]');
      this.status = await page.waitForSelector('select[name="status"]');
      this.submit = await page.waitForSelector("button ::-p-text(Submit)");
      await this.company.click({ clickCount: 3 });
      await this.company.press("Backspace");
      await this.position.click({ clickCount: 3 });
      await this.position.press("Backspace");
    });

    it("Should add a new job entry", async () => {
      await this.company.type("IBM");
      await this.position.type("Accountant");
      await this.status.select("pending");
      await this.submit.click();
      await page.waitForNavigation();
    });

    it("Should check to make sure job was added to the list", async () => {
      const { expect } = await import("chai");
      let pageContent = await page.content();
      pageContent = pageContent.split("<tr>");
      expect(pageContent.length).to.equal(22);
    });
  });
});
