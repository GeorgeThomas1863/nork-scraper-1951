import UTIL from "../models/util-model.js";

import { continueScrape, setScrapeActive } from "./scrape-status.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

export const scrapeNewKCNA = async () => {
  //set scrape active
  await setScrapeActive(true);

  //log scrape start
  const startModel = new UTIL();
  const scrapeId = await startModel.logScrape();

  const urlData = await scrapeNewURLs();
  //send this shit back or stop here
  console.log(urlData);

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new UTIL({ scrapeId: scrapeId });
  await endModel.logScrape();
  console.log("#DONE");

  //clear scrape active
  await setScrapeActive(false);
  return "FINISHD NEW SCRAPE";
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
