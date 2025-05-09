import UTIL from "../models/util-model.js";

import { continueScrape, setScrapeActive } from "./scrape-status.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";
import { logUrlData, logDownloadData } from "./scrape-log.js";

export const scrapeNewKCNA = async () => {
  //set scrape active
  await setScrapeActive(true);

  //log scrape start
  const startModel = new UTIL();
  const scrapeId = await startModel.logScrape();

  //get and store new urls
  const urlData = await scrapeNewURLs();
  await logUrlData(urlData, scrapeId);

  const downloadData = await scrapeNewMedia();
  await logDownloadData(downloadData, scrapeId);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new UTIL({ scrapeId: scrapeId });
  await endModel.logScrape();
  console.log("#DONE");

  //clear scrape active
  await setScrapeActive(false);
  return "FINISHED NEW SCRAPE";
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

// //put here so you can use the fucking scrape id
// export const storeLogData = async (inputArray, scrapeId) => {

// };
