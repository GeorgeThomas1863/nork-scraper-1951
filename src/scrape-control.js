import UTIL from "../models/util-model.js";

import { continueScrape } from "./scrape-stop.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

export const scrapeNewKCNA = async () => {
  //log scrape start
  const startModel = new UTIL({ type: "startScrape" });
  const scrapeId = await startModel.logScrape();

  const urlData = await scrapeNewURLs();
  //send this shit back or stop here
  console.log(urlData);

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  //LOG SCRAPE / show how long it took and write it in readable format
  const endModel = new UTIL({ type: "endScrape", scrapeId: scrapeId });
  await endModel.logScrape();
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
