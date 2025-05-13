import Log from "../models/log-model.js";

import { continueScrape, setScrapeActive, setScrapeId } from "./scrape-util.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

export const scrapeNewKCNA = async () => {
  //set scrape active
  await setScrapeActive(true);

  //log scrape start / set scrape ID
  const startModel = new Log();
  const scrapeId = await startModel.logStart();
  await setScrapeId(scrapeId);

  //get and store new urls
  await scrapeNewURLs(scrapeId);

  //get new media data AND download it
  await scrapeNewMedia(scrapeId);

  const uploadData = await uploadNewTG(scrapeId);
  console.log(uploadData);

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new Log({ scrapeId: scrapeId });
  await endModel.logStop();
  console.log("#DONE");

  //clear scrape active
  await setScrapeActive(false);
  return scrapeId;
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
