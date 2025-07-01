import Log from "../models/log-model.js";
import { textStrMap } from "../config/map-scrape.js";
import { scrapeState, updateScrapeStateByCommand } from "./scrape-state.js";
import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA } from "./scrape-control.js";
// import { setContinueScrape } from "./scrape-util.js";
// import { startScheduler, stopScheduler } from "./scrape-scheduler.js";

//REFACTOR / break into multiple funcitons
export const parseAdminCommand = async (inputParams) => {
  const { commandType } = inputParams;
  if (!commandType) return null;

  // console.log("SCRAPE INPUT PARAMS");
  // console.log(inputParams);

  //check if already running and command to start
  const scrapeAvailable = await checkScrapeAlreadyRunning(commandType);
  if (!scrapeAvailable) return scrapeState;

  //update scrape state
  await updateScrapeStateByCommand(commandType);

  // console.log("RUN SCRAPE");
  // console.log(runScrape);

  //if not scraping return here [DONT DESTRUCTURE BC RUNSCRAPE CHANGES]
  if (!scrapeState.runScrape) return scrapeState;

  //otherwise SET scrape ID here
  const newScrapeModel = new Log();
  const newScrapeObj = await newScrapeModel.logStart();
  console.log("NEW SCRAPE OBJ");
  console.log(newScrapeObj);

  if (!newScrapeObj || !newScrapeObj.scrapeId || !newScrapeObj.scrapeStartTime) {
    scrapeState.textStr = "ERROR STARTING SCRAPE (defining scrapeId)";
    return scrapeState;
  }

  console.log("NEW SCRAPE OBJ");
  console.log(newScrapeObj);

  const { scrapeId, scrapeStartTime } = newScrapeObj;

  scrapeState.scrapeId = scrapeId;
  scrapeState.scrapeStartTime = scrapeStartTime;

  return scrapeState;
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

export const checkScrapeAlreadyRunning = async (commandType) => {
  const { scrapeActive, schedulerActive } = scrapeState;

  //check if command to start
  // if (commandType !== "admin-start-scrape" && commandType !== "admin-start-scheduler") return true;

  //check if already scraping
  if (commandType === "admin-start-scrape" && scrapeActive) {
    scrapeState.textStr = "ALREADY SCRAPING FAGGOT";
    return null;
  }
  // check if already scraping / scheduled
  if (commandType === "admin-start-scheduler" && schedulerActive) {
    scrapeState.textStr = "ALREADY SCHEDULED FAGGOT";
    return null;
  }

  return true;
};
