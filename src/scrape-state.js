import { textStrMap, runScrapeMap, startStopMap } from "../config/map-scrape.js";

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

  console.log("UPDATE SCRAPE STATE BY COMMAND");
  console.log(inputType);

  //set the textStr
  scrapeState.textStr = textStrMap[inputType];
  scrapeState.runScrape = runScrapeMap[inputType];
  startStopMap[inputType]?.();

  return true;
};
