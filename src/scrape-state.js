import CONFIG from "../config/config.js";
import Log from "../models/log-model.js";
import { textStrMap, runScrapeMap, startStopMap } from "../config/map-scrape.js";
// import dbModel from "../models/db-model.js";

export const scrapeState = {
  scrapeId: null,
  scrapeActive: false,
  schedulerActive: false,
  intervalId: null,

  textStr: null,
  runScrape: false,

  scrapeStartTime: null,
  scrapeEndTime: null,
  scrapeSeconds: 0,
  scrapeMinutes: 0,

  scrapeCommand: null,
  finished: false,
};

export const updateScrapeStateByCommand = async (inputType) => {
  if (!inputType) return null;
  // const { scrapeId } = scrapeState;

  //update the scrapeState
  scrapeState.scrapeCommand = inputType;
  scrapeState.runScrape = runScrapeMap[inputType];
  startStopMap[inputType]?.();

  //update textstr
  let updateTextStr = "";
  if (inputType === "admin-scrape-status") {
    updateTextStr = `SCRAPE ACTIVE: ${scrapeState.scrapeActive}. <br> SCHEDULER ACTIVE: ${scrapeState.schedulerActive}`;
  } else {
    updateTextStr = textStrMap[inputType];
  }
  scrapeState.textStr = updateTextStr;

  // console.log("SCRAPE ID");
  // console.log(scrapeId);

  // //if stopping create log
  // if (inputType === "admin-stop-scrape") {
  //   const stopLogModel = new Log();
  //   await stopLogModel.logStop();

  //   scrapeState.textStr = "SCRAPE STOPPED";
  // }

  // //stop scheduler
  // if (inputType === "admin-stop-scheduler") {
  //   await stopScheduler();
  // }

  return true;
};
