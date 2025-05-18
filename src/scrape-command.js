import Log from "../models/log-model.js";
import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA, restartAutoScrape } from "./scrape-control.js";
import { setContinueScrape, scrapeActive, scrapeId, setScrapeId } from "./scrape-util.js";

//REFACTOR / break into multiple funcitons
export const parseAdminCommand = async (inputParams) => {
  const { commandType } = inputParams;
  if (!commandType) return null;
  const returnObj = {};

  //if stop scrape
  if (commandType === "admin-stop-scrape") {
    await setContinueScrape(false);

    returnObj.textStr = "STOPPING SCRAPE";
    returnObj.scrapeId = scrapeId;
    returnObj.runScrape = null;

    console.log(returnObj.textStr);
    return returnObj;
  }

  //if just getting status, return same as scrape active
  if (commandType === "admin-scrape-status") {
    returnObj.textStr = "SCRAPE STATUS: ";
    returnObj.scrapeId = scrapeId;
    returnObj.runScrape = null;
    return returnObj;
  }

  //if already scraping
  if (scrapeActive) {
    returnObj.textStr = "ALREADY SCRAPING FAGGOT";
    returnObj.scrapeId = scrapeId;
    returnObj.runScrape = null;

    console.log(returnObj.textStr);
    return returnObj;
  }

  // reset the stopper
  await setContinueScrape(true);

  //if reset auto
  if (commandType === "admin-reset-auto") {
    const restartData = await restartAutoScrape(inputParams);
    return restartData;
  }

  //handle other entries
  if (commandType !== "admin-start-scrape") return null;

  //otherwise SET scrape ID here
  const newScrapeModel = new Log();
  const newScrapeId = await newScrapeModel.logStart();
  await setScrapeId(newScrapeId);

  //TELLS ROUTER TO RUN SCRAPE COMMAND
  returnObj.textStr = "SCRAPE STARTED!";
  returnObj.scrapeId = newScrapeId;
  returnObj.runScrape = true;

  return returnObj;
};

export const runScrapeCommand = async (inputParams) => {
  const { howMuch, urlInput } = inputParams;

  if (!howMuch) return null;

  let data = "";
  switch (howMuch) {
    case "admin-scrape-new":
      data = await scrapeNewKCNA();
      break;

    case "admin-scrape-all":
      data = await scrapeAllKCNA();
      break;

    case "admin-scrape-url":
      if (!urlInput) return null;
      data = await scrapeUrlKCNA(urlInput);
      break;
  }

  return data;
};
