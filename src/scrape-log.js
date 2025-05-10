import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const logData = async (inputArray, scrapeId, logType) => {
  if (!inputArray || !inputArray.length) return null;

  //normalize data
  const normalArray = await normalizeByType(inputArray, logType);
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

//could make better, but dont hate self enough
export const normalizeByType = async (inputArray, logType) => {
  let normalArray = [];

  switch (logType) {
    case "listArray":
      normalArray = await normalizeArray(inputArray, "listItemCount", "newListData", true);
      break;

    case "contentArray":
      normalArray = await normalizeArray(inputArray, "contentScrapedCount", "newContentData", true);
      break;

    case "findMedia":
      normalArray = await normalizeArray(inputArray, "foundCount", "newMediaData", false);
      break;

    case "downloadMedia":
      normalArray = await normalizeArray(inputArray, "downloadedCount", "downloadMediaData", false);
      break;

    case "uploadMedia":
      normalArray = await normalizeArray(inputArray, "uploadCount", "uploadMediaData", false);
      break;
  }

  return normalArray;
};

//---------------

export const normalizeArray = async (inputArray, key, value, changeTypeStr) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //way to dynamically destructure
    const { type, [value]: valueName } = inputArray[i];

    //get type str
    let typeStr = type;
    if (changeTypeStr) {
      typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    }

    const normalObj = {
      [`${typeStr}_${key}`]: valueName?.length || 0,
    };
    normalArray.push(normalObj);
  }

  return normalArray;
};
