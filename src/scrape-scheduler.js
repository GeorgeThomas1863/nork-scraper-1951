import CONFIG from "../config/config.js";
import { scrapeNewKCNA } from "./scrape-control.js";
import { scrapeState } from "./scrape-state.js";

//async not needed, but can keep
export const startScheduler = async () => {
  const { scrapeInterval } = CONFIG;

  console.log("STARTING SCHEDULER AT:");
  console.log(new Date().toISOString());

  const intervalId = setInterval(async () => {
    if (!scrapeState?.schedulerActive) return null;
    await scrapeNewKCNA();
  }, scrapeInterval);

  scrapeState.intervalId = intervalId;
  scrapeState.schedulerActive = true;
  return intervalId;
};

export const stopScheduler = async () => {
  if (!scrapeState || !scrapeState.intervalId) return null;
  const { intervalId } = scrapeState;

  console.log("STOPPING SCHEDULER AT:");
  console.log(new Date().toISOString());

  clearInterval(intervalId);
  scrapeState.intervalId = null;
  scrapeState.schedulerActive = false;

  return true;
};
