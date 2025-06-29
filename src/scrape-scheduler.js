import CONFIG from "../config/config.js";
import { scrapeNewKCNA } from "./scrape-control.js";
// import { scrapeActive } from "./scrape-util.js";
import { scrapeState } from "./scrape-state.js";

//FIX 

let schedulerInterval = null;
let isSchedulerActive = false;

export const startScheduler = async () => {
  const { scrapeDelay } = CONFIG;

  // If scheduler is already running, stop it first
  if (isSchedulerActive) {
    await stopScheduler();
  }

  // Start the scheduler
  schedulerInterval = setInterval(async () => {
    // Only run if not already scraping
    if (!scrapeState.scrapeActive) {
      try {
        await scrapeNewKCNA();
      } catch (error) {
        console.error("Scheduled scrape failed:", error);
      }
    }
  }, scrapeDelay);

  isSchedulerActive = true;
  return true;
};

export const stopScheduler = async () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  isSchedulerActive = false;
  return true;
};

export const getSchedulerStatus = () => {
  return {
    isActive: isSchedulerActive,
    interval: schedulerInterval ? schedulerInterval._idleTimeout / (60 * 1000) : null,
  };
};
