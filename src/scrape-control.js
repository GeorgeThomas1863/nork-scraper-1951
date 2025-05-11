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

  //get and store new urls
  await scrapeNewURLs(scrapeId);

  //get new media data AND download it
  await scrapeNewMedia(scrapeId);

  const uploadData = await uploadNewTG(scrapeId);
  console.log(uploadData);

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new UTIL({ scrapeId: scrapeId });
  await endModel.logScrape();
  console.log("#DONE");

  //clear scrape active
  await setScrapeActive(false);
  return "FINISHED SUCCESSFUL SCRAPE";
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

//might move
export const restartAutoScrape = async (inputParams) => {
  //if scrape already active return null (prevents double scrapes)
  console.log("BUILD");
};
