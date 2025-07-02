import CONFIG from "../config/config.js";
import { scrapeNewKCNA } from "./scrape-control.js";
// import { scrapeActive } from "./scrape-util.js";
import { scrapeState } from "./scrape-state.js";

//FIX [see if can move schedulerInterval to scrapeState]

let schedulerInterval = null;

export const startScheduler = async () => {
  const { scrapeInterval } = CONFIG;
  const { schedulerActive, scrapeActive } = scrapeState;

  console.log("FUCK YOU!!!!!!!!")
  console.log("SCRAPE STATE")
  console.log(scrapeState)

  // If scheduler is already running, stop it first
  if (schedulerActive) {
    scrapeState.schedulerActive = false;
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  }

  // Start the scheduler
  schedulerInterval = setInterval(async () => {
    // Only run if not already scraping
    if (!scrapeActive) {
      try {
        await scrapeNewKCNA();
      } catch (error) {
        console.error("Scheduled scrape failed:", error);
      }
    }
  }, scrapeInterval);

  scrapeState.schedulerActive = true;
  return true;
};

// export const stopScheduler = async () => {
//   if (schedulerInterval) {
//     clearInterval(schedulerInterval);
//     schedulerInterval = null;
//   }
//   scrapeState.schedulerActive = false;
//   return true;
// };

// export const getSchedulerStatus = () => {
//   return {
//     isActive: scrapeState.schedulerActive,
//     interval: schedulerInterval ? schedulerInterval._idleTimeout / (60 * 1000) : null,
//   };
// };
