import Log from "../models/log-model.js";

import { continueScrape, setScrapeActive, scrapeId } from "./scrape-util.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";
import { runCleanFS } from "./clean-fs.js";

export const scrapeNewKCNA = async () => {
  //set scrape active
  await setScrapeActive(true);

  //get and store new urls
  await scrapeNewURLs();

  //get new media data AND download it
  await scrapeNewMedia();

  //upload to TG
  await uploadNewTG();

  //delete empty / fucked files (for next scrape)
  await runCleanFS();

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new Log({ scrapeId: scrapeId });
  await endModel.logStop();
  console.log("#DONE");

  //clear scrape active
  await setScrapeActive(false);
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

//might move
export const restartAutoScrape = async (inputParams) => {
  //if scrape already active return null (prevents double scrapes)
  console.log("BUILD");
};
