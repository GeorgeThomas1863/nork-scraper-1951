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
  scrapeSeconds: 0,
  scrapeMinutes: 0,

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

  console.log("SCRAPE ID");
  console.log(scrapeId);

  //set scrapeId if its null
  // if (!scrapeId) {
  //   const params = {
  //     keyToLookup: "startTime",
  //     howMany: 1,
  //   };

  //   const logModel = new dbModel(params, log);
  //   const logArray = await logModel.getLastItemsArray();
  //   if (!logArray || !logArray.length) return null;

  //   scrapeState.scrapeId = logArray[0]._id.toString() || null;
  //   scrapeState.scrapeStartTime = logArray[0].startTime || null;
  //   scrapeState.scrapeEndTime = logArray[0].endTime || null;
  // }

  // console.log("SCRAPE STATE AFTER");
  // console.log(scrapeState);

  return true;
};
