import UTIL from "../models/util-model.js";

import { continueScrape } from "./scrape-stop.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeNewKCNA = async () => {
  if (!continueScrape) return null;

  const urlData = await scrapeNewURLs();
  //send this shit back or stop here
  console.log(urlData);

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  //FIX
  ////LOG SCRAPE / show how long it took and write it in readable format
  // const endScrapeTime = new Date();
  // const logModel = new KCNA({ startTime: startScrapeTime, endTime: endScrapeTime });
  // await logModel.logScrape();

  console.log("#DONE");

  return true;
};

export const scrapeAllKCNA = async () => {
  if (!continueScrape) return null;
  console.log("BUILD");
};

export const scrapeUrlKCNA = async (url) => {
  if (!continueScrape) return null;
  //figure out type based on html of URL
  console.log("build");
};

// export const continueScrape = async (keepGoing = true) =>{
//   return keepGoing
// }
