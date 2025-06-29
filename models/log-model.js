import CONFIG from "../config/config.js";
import dbModel from "./db-model.js";

class Log {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async logStart() {
    const { log } = CONFIG;
    const startScrapeTime = new Date();
    console.log("STARTING NEW KCNA SCRAPE AT " + startScrapeTime);
    const startModel = new dbModel({ startTime: startScrapeTime }, log);
    const startData = await startModel.storeAny();
    const newScrapeId = startData.insertedId;

    const returnObj = {
      scrapeId: newScrapeId,
      scrapeStartTime: startScrapeTime,
    };

    return returnObj;
  }

  async logStop() {
    const { scrapeState } = this.dataObject;
    const { scrapeId, scrapeStartTime } = scrapeState;

    //get end time / start time
    const endTime = new Date();

    //calc scrape secs
    const scrapeSeconds = +((endTime - scrapeStartTime) / 1000).toFixed(2);

    //build objs
    const timeObj = {
      endTime: endTime,
      scrapeSeconds: scrapeSeconds,
    };

    //get all stats (loop)
    const statsModel = new Log({ scrapeId: scrapeId });
    const statsObj = await statsModel.logStats();

    const dataObj = { ...statsObj, ...timeObj };

    const storeObj = {
      inputObj: dataObj,
      scrapeId: scrapeId,
    };

    console.log("STORE OBJECT");
    console.log(storeObj);

    //store it
    const storeModel = new dbModel(storeObj, CONFIG.log);
    const storeData = await storeModel.updateLog();

    //display log in console log (can turn off)
    const displayModel = new Log(timeObj);
    await displayModel.showScrapeTime();

    return storeData;
  }

  async logStats() {
    const { scrapeId } = this.dataObject;
    const { logArr } = CONFIG;
    const lookupObj = {
      keyToLookup: "scrapeId",
      itemValue: scrapeId,
    };

    const returnObj = {};
    for (let i = 0; i < logArr.length; i++) {
      const logItem = logArr[i];
      console.log("LOG ITEM");
      console.log(logItem);
      const loopModel = new dbModel(lookupObj, CONFIG[logItem]);
      const dataArray = await loopModel.getUniqueArray();
      console.log("LOOKUP RETURN");
      console.log(dataArray?.length);
      returnObj[logItem] = dataArray?.length || 0;
    }

    return returnObj;
  }

  async showScrapeTime() {
    const { scrapeSeconds } = this.dataObject;

    //if short
    if (scrapeSeconds < 90) {
      return console.log("FINISHED SCRAPE FOR NEW DATA, SCRAPE TOOK " + scrapeSeconds + " seconds");
    }

    //otherwise return in minutes
    const scrapeMinutes = +(scrapeSeconds / 60).toFixed(2);
    return console.log("FINISHED SCRAPE FOR NEW DATA, SCRAPE TOOK " + scrapeMinutes + " minutes");
  }
}

export default Log;
