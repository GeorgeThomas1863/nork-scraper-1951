import CONFIG from "../config/config.js";
import { textStrMap, runScrapeMap, startStopMap } from "../config/map-scrape.js";
import dbModel from "../models/db-model.js";

export const scrapeState = {
  scrapeId: null,
  scrapeActive: false,
  schedulerActive: false,
  textStr: null,
  runScrape: false,

  scrapeStartTime: null,
  scrapeEndTime: null,
  scrapeCommand: null,
  finished: false,
};

export const updateScrapeStateByCommand = async (inputType) => {
  if (!inputType) return null;
  const { log } = CONFIG;
  const { scrapeId } = scrapeState;

  // console.log("UPDATE SCRAPE STATE BY COMMAND");
  // console.log(inputType);

  // console.log("SCRAPE STATE");
  // console.log(scrapeState);

  //update the scrapeState
  scrapeState.scrapeCommand = inputType;
  scrapeState.textStr = textStrMap[inputType];
  scrapeState.runScrape = runScrapeMap[inputType];
  startStopMap[inputType]?.();

  //set scrapeId if its null
  if (!scrapeId) {
    const params = {
      keyToLookup: "startTime",
      howMany: 1,
    };

    const logModel = new dbModel(params, log);
    const logArray = await logModel.getLastItemsArray();

    console.log("LOG ARRAY");
    console.log(logArray);

    const scrapeIdLog = logArray[0]._id.toString();

    scrapeState.scrapeId = scrapeIdLog;
  }

  // console.log("SCRAPE STATE AFTER");
  // console.log(scrapeState);

  return true;
};
