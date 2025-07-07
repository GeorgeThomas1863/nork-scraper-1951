import CONFIG from "../config/config.js";
import Log from "../models/log-model.js";
import { textStrMap, runScrapeMap, startStopMap } from "../config/map-scrape.js";
// import dbModel from "../models/db-model.js";

export const scrapeState = {
  scrapeId: null,
  scrapeActive: false,
  schedulerActive: false,

  textStr: null,
  runScrape: false,

  scrapeStartTime: null,
  scrapeEndTime: null,
  scrapeSeconds: 0,
  scrapeMinutes: 0,

  scrapeCommand: null,
  commandReq: null, //all params sent to command
  finished: false,
};

//track separately to avoid fucking stateObj
export const intervalObj = {
  intervalId: null,
};

export const updateScrapeStateByCommand = async (inputParams) => {
  if (!inputParams || !inputParams.commandType) return null;
  const { commandType } = inputParams;

  //update the scrapeState
  scrapeState.commandReq = inputParams; //track all params
  scrapeState.scrapeCommand = commandType;
  scrapeState.runScrape = runScrapeMap[commandType];
  startStopMap[commandType]?.();

  //update textstr
  let updateTextStr = "";
  if (commandType === "admin-scrape-status") {
    updateTextStr = `SCRAPE ACTIVE: ${scrapeState.scrapeActive}. <br> SCHEDULER ACTIVE: ${scrapeState.schedulerActive}`;
  } else {
    updateTextStr = textStrMap[commandType];
  }
  scrapeState.textStr = updateTextStr;

  return true;
};
