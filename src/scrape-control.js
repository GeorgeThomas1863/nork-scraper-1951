import CONFIG from "../config/config.js";
import UTIL from "../models/util-model.js";
import dbModel from "../models/db-model.js";

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
  const urlDataArray = await scrapeNewURLs();
  await storeLogDataArray(urlDataArray, scrapeId);

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

//put here so you can use the fucking scrape id
export const storeLogDataArray = async (inputArray, scrapeId) => {
  if (!inputArray || !inputArray.length) return null;

  for (let i = 0; i < inputArray.length; i++) {
    const storeObj = {
      inputObj: inputArray[i],
      scrapeId: scrapeId,
    };
    const storeModel = new dbModel(storeObj, CONFIG.log);
    const storeData = await storeModel.updateLog();
    console.log(storeData);
  }

  return true;
};
