import CONFIG from "../config/config.js";
import { scrapeNewKCNA } from "./scrape-control.js";
import { scrapeState, intervalObj } from "./scrape-state.js";

//async not needed, but can keep
export const startScheduler = async () => {
  const { scrapeInterval } = CONFIG;

  console.log("STARTING SCHEDULER");
  console.log(new Date().toISOString());

  const intervalId = setInterval(async () => {
    if (!scrapeState?.schedulerActive) return null;
    if (scrapeState.scrapeActive) return null;

    await scrapeNewKCNA();
  }, scrapeInterval);

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
