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
  finished: false,
};

export const updateScrapeStateByCommand = async (inputType) => {
  if (!inputType) return null;
  const { log } = CONFIG;
  const { scrapeId } = scrapeState;
  //set the textStr
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

    const scrapeIdLog = logArray[0]._id.toString();

    scrapeState.scrapeId = scrapeIdLog;
  }

  return true;
};
