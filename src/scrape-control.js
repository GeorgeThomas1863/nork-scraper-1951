import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-stop.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

export const scrapeNewKCNA = async () => {
  //log scrape start
  const startScrapeTime = new Date();
  const startModel = new dbModel({ startTime: startScrapeTime }, CONFIG.log);
  const startData = await startModel.storeAny();
  const scrapeId = startData.insertedId;
  console.log("SCRAPE ID");
  console.log(scrapeId);
  console.log("STARTING NEW KCNA SCRAPE AT " + startScrapeTime);

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
