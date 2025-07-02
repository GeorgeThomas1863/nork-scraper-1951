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
};

export const updateScrapeStateByCommand = async (inputType) => {
  if (!inputType) return null;
  const { scrapeId } = scrapeState;
  //set the textStr
  scrapeState.textStr = textStrMap[inputType];
  scrapeState.runScrape = runScrapeMap[inputType];
  startStopMap[inputType]?.();

  //set scrapeId if null
  if (!scrapeId) {
    const params = {
      keyToLookup: "startTime",
      howMany: 1,
    };

    const logArray = await dbModel.getLastItemsArray(params);
    console.log("!!!!!!!logArray");
    console.log(logArray);

    const scrapeIdLog = logArray[0]._id.toString();

    console.log("****scrapeIdLog");
    console.log(scrapeIdLog);

    scrapeState.scrapeId = scrapeIdLog;
  }

  return true;
};
