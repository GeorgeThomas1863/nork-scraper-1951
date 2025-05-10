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

export const normalizeByType = async (inputArray, logType) => {
  let normalArray = [];

  switch (logType) {
    case "listArray":
      normalArray = await normalizeListArray(inputArray);
      return normalArray;

    case "contentArray":
      normalArray = await normalizeContentArray(inputArray);

    case "findMedia":
      normalArray = await normalizeFindMediaArray(inputArray);

    case "downloadMedia":
      normalArray = await normalizeDownloadArray(inputArray);
  }
};

//---------------

export const normalizeListArray = async (inputArray) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    const { type, newListData } = inputArray[i];

    //log data stats (fix type string first)
    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    const normalObj = {
      [`${typeStr}_listItemCount`]: newListData?.length || 0,
    };
    normalArray.push(normalObj);
  }

  return normalArray;
};

export const normalizeContentArray = async (inputArray) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    const { type, newContentData } = inputArray[i];

    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    const normalObj = {
      [`${typeStr}_contentScrapedCount`]: newContentData?.length || 0,
    };
    normalArray.push(normalObj);
  }

  return normalArray;
};

export const normalizeFindMediaArray = async (inputArray) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    const { type, newMediaData } = inputArray[i];

    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    const normalObj = { [`${typeStr}_foundCount`]: newMediaData?.length || 0 };
    normalArray.push(normalObj);
  }

  return normalArray;
};

export const normalizeDownloadArray = async (inputArray) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    const { type, downloadMediaData } = inputArray[i];

    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    const normalObj = { [`${typeStr}_downloadedCount`]: downloadMediaData?.length || 0 };
    normalArray.push(normalObj);
  }

  return normalArray;
};

//------------
