import Log from "../models/log-model.js";

// import { continueScrape, setScrapeActive, scrapeId } from "./scrape-util.js";
import { scrapeState } from "./scrape-state.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";
import { runCleanFS } from "./clean-fs.js";
import { updateMongo } from "./update-db.js";
// import { startScheduler, stopScheduler } from "./scrape-scheduler.js";

export const scrapeNewKCNA = async () => {
  //set scrape active
  // scrapeState.scrapeActive = true;
  // scrapeState.finished = false;

  //delete empty / fucked files
  await runCleanFS();

  //get and store new urls
  await scrapeNewURLs();

  //get new media data AND download it
  await scrapeNewMedia();

  //upload to TG
  await uploadNewTG();

  //update mongo with ALL relevant data
  await updateMongo();

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new Log();
  await endModel.logStop();
  console.log("#DONE");

  //clear scrape active
  scrapeState.scrapeActive = false;
  scrapeState.finished = true;
  return true;
};

export const scrapeAllKCNA = async () => {
  if (!scrapeState.scrapeActive) return null;
  console.log("BUILD");
};

export const scrapeUrlKCNA = async (url) => {
  if (!scrapeState.scrapeActive) return null;
  //figure out type based on html of URL
  console.log("build");
};

// export const restartAutoScrape = async (inputParams) => {
//   const { intervalMinutes } = inputParams;

//   // If no interval specified, stop the scheduler
//   if (!intervalMinutes) {
//     await stopScheduler();
//     return {
//       textStr: "AUTO SCRAPE STOPPED",
//       scrapeId: scrapeId,
//       runScrape: false,
//     };
//   }

//   // Start scheduler with specified interval
//   await startScheduler(parseInt(intervalMinutes));

//   return {
//     textStr: `AUTO SCRAPE STARTED (${intervalMinutes} minutes)`,
//     scrapeId: scrapeId,
//     runScrape: false,
//   };
// };
