import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const logListData = async (inputArray, scrapeId) => {
  if (!inputArray || !inputArray.length) return null;

  //normalize data
  const normalArray = await normalizeListData(inputArray);
  if (!normalArray || !normalArray.length) return null;

  for (let i = 0; i < normalArray.length; i++) {
    //store by updating log
    const storeObj = {
      inputObj: normalArray[i],
      scrapeId: scrapeId,
    };

    const storeModel = new dbModel(storeObj, CONFIG.log);
    const storeData = await storeModel.updateLog();
    console.log(storeData);
  }

  return true;
};

export const normalizeListData = async (inputArray) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    const { type, newListData, newContentData } = inputArray[i];

    //log data stats (fix type string first)
    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    const urlDataObj = {
      [`${typeStr}_listItemCount`]: newListData?.length || 0,
      [`${typeStr}_contentScrapedCount`]: newContentData?.length || 0,
    };
    normalArray.push(urlDataObj);
  }

  return normalArray;
};
