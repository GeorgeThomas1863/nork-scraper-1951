import { textStrMap, runScrapeMap, startStopMap } from "../config/map-scrape.js";

export const scrapeState = {
  scrapeId: null,
  scrapeActive: false,
  schedulerActive: false,
  textStr: null,
  runScrape: false,

  scrapeStartTime: null,
  scrapeEndTime: null,
};

export const updateScrapeStateByCommand = async (inputType) => {
  if (!inputType) return null;

  //set the textStr
  scrapeState.textStr = textStrMap[inputType];
  scrapeState.runScrape = runScrapeMap[inputType];
  startStopMap[inputType]?.();

  //   switch (inputType) {
  //     case "admin-stop-scrape":
  //       scrapeState.scrapeActive = false;
  //       scrapeState.runScrape = null;
  //       break;

  //     case "admin-stop-scheduler":
  //       scrapeState.schedulerActive = false;
  //       scrapeState.runScrape = null;
  //       break;

  //     case "admin-start-scrape":
  //       scrapeState.scrapeActive = true;
  //       scrapeState.runScrape = true;
  //       break;

  //     case "admin-start-scheduler":
  //       scrapeState.scrapeActive = true;
  //       scrapeState.schedulerActive = true;
  //       scrapeState.runScrape = true;
  //       break;

  //     case "admin-scrape-status":
  //       scrapeState.runScrape = null;
  //       break;
  //   }

  return true;
};

// Function to update the state
// export const setStopScrape = async (inputValue) => {
//   scrapeState.stopScrape = inputValue;
//   console.log("STOP SCRAPE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
//   return continueScrape;
// };

// export const setStopScheduler = async (inputValue) => {
//   scrapeState.stopScheduler = inputValue;
//   console.log("STOP SCHEDULER STATUS CHANGED TO: " + String(inputValue).toUpperCase());
//   return scrapeState.stopScheduler;
// };

// export const setScrapeActive = async (inputValue) => {
//   scrapeState.scrapeActive = inputValue;
//   console.log("SCRAPE ACTIVE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
//   return scrapeActive;
// };

// //--------------

// //SCRAPE ID
// export let scrapeId = 0;

// export const setScrapeId = async (inputValue) => {
//   scrapeId = inputValue;
//   console.log("SCRAPE ID SET TO: " + scrapeId);
//   return scrapeId;
// };
