import CONFIG from "../config/config.js";
import dbModel from "./db-model.js";

class Log {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async logStart() {
    const startScrapeTime = new Date();
    console.log("STARTING NEW KCNA SCRAPE AT " + startScrapeTime);
    const startModel = new dbModel({ startTime: startScrapeTime }, CONFIG.log);
    const startData = await startModel.storeAny();
    const startScrapeId = startData.insertedId;

    return startScrapeId;
  }

  async logStop() {
    const { scrapeId } = this.dataObject;

    //get end time / start time
    const endTime = new Date();
    const findModel = new dbModel({ keyToLookup: "_id", itemValue: scrapeId }, CONFIG.log);
    const findData = await findModel.getUniqueItem();
    const startTime = findData.startTime;

    //calc scrape secs
    const scrapeSeconds = +((endTime - startTime) / 1000).toFixed(2);

    //build objs
    const timeObj = {
      endTime: endTime,
      scrapeSeconds: scrapeSeconds,
    };

    //get all stats (loop)
    const statsModel = new Log({ scrapeId: scrapeId });
    const statsObj = await statsModel.logStats();

    console.log("STATS OBJ");
    console.log(statsObj);

    const storeObj = {
      inputObj: timeObj,
      scrapeId: scrapeId,
    };

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
    const { logArr2 } = CONFIG;
    const lookupObj = {
      keyToLookup: "scrapeId",
      itemValue: scrapeId,
    };

    const returnObj = {};
    for (let i = 0; i < logArr2.length; i++) {
      const logItem = logArr2[i];
      const loopModel = new dbModel(lookupObj, logItem);
      const dataArray = await loopModel.getUniqueArray();
      returnObj[logItem] = dataArray.length;
    }

    console.log("!!!!RETURN OBJ!!!!");
    console.log(returnObj);

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
