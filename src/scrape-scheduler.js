import CONFIG from "../config/config.js";
import Log from "../models/log-model.js";
import { scrapeNewKCNA } from "./scrape-control.js";
import { scrapeState, intervalObj } from "./scrape-state.js";

//async not needed, but can keep
export const startScheduler = async () => {
  const { scrapeInterval } = CONFIG;

  const testInterval = 5000;

  console.log("STARTING SCHEDULER");
  console.log(new Date().toISOString());

  const intervalId = setInterval(async () => {
    if (scrapeState.scrapeActive) return null;

    console.log("STARTING NEW SCRAPE");
    const newScrapeModel = new Log();
    await newScrapeModel.logStart();

    await scrapeNewKCNA();
  }, testInterval); //RESET

  intervalObj.intervalId = intervalId;
  scrapeState.schedulerActive = true;
  return true;
};

export const stopScheduler = async () => {
  if (!intervalObj || !intervalObj.intervalId) return null;

  console.log("STOPPING SCHEDULER AT:");
  console.log(new Date().toISOString());

  clearInterval(intervalObj.intervalId);
  intervalObj.intervalId = null;
  scrapeState.schedulerActive = false;

  return true;
};
