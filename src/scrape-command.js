import Log from "../models/log-model.js";
import { scrapeState, updateScrapeStateByCommand } from "./scrape-state.js";
import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA } from "./scrape-control.js";
import { startScheduler, stopScheduler } from "./scrape-scheduler.js";

//REFACTOR / break into multiple funcitons
export const parseAdminCommand = async (inputParams) => {
  const { commandType } = inputParams;
  if (!commandType) return null;

  console.log("PARSE ADMIN COMMAND");
  console.log(inputParams);

  //check if already running and command to start
  const scrapeAvailable = await checkScrapeAlreadyRunning(commandType);
  if (!scrapeAvailable) return true;

  //update scrape state
  await updateScrapeStateByCommand(inputParams);

  return scrapeState;
};

export const runScrapeCommand = async (inputParams) => {
  if (!inputParams || !inputParams.scrapeCommand) return null;
  const { scrapeCommand } = inputParams;

  if (scrapeCommand === "admin-scrape-status") return true;

  switch (scrapeCommand) {
    case "admin-start-scrape":
      await runNewScrape(inputParams);
      break;

    case "admin-stop-scrape":
      const stopLogModel = new Log();
      await stopLogModel.logStop();
      break;

    case "admin-start-scheduler":
      await startScheduler();
      break;

    case "admin-stop-scheduler":
      await stopScheduler();
      break;

    default:
      return null;
  }

  return true;
};

export const runNewScrape = async (inputParams) => {
  if (!inputParams || !inputParams.commandReq || !inputParams.commandReq.howMuch) return null;
  const { commandReq } = inputParams;
  const { howMuch, urlInput } = commandReq;

  // console.log("RUN NEW SCRAPE");
  // console.log(inputParams);

  //START NEW SCRAPE, CREATE LOG HERE
  const newScrapeModel = new Log();
  await newScrapeModel.logStart();

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

  //check if already scraping
  if (commandType === "admin-start-scrape" && scrapeActive) {
    scrapeState.textStr = "ALREADY SCRAPING FAGGOT";
    scrapeState.finished = true;
    return null;
  }
  // check if already scraping / scheduled
  if (commandType === "admin-start-scheduler" && schedulerActive) {
    scrapeState.textStr = "ALREADY SCHEDULED FAGGOT";
    scrapeState.finished = true;
    return null;
  }

  return true;
};
