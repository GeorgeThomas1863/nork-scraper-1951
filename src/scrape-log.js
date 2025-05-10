import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const logUrlData = async (inputArray, scrapeId) => {
  if (!inputArray || !inputArray.length) return null;

  //normalize data
  const normalArray = await normalizeUrlData(inputArray);
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

export const logDownloadData = async (inputObj, scrapeId) => {
  if (!inputObj) return null;

  //normalize data
  const normalObj = await normalizeDownloadData(inputObj);

  //store it
  const storeObj = {
    inputObj: normalObj,
    scrapeId: scrapeId,
  };

  console.log("!!! STORE OBJ");
  console.log(storeObj);

  const storeModel = new dbModel(storeObj, CONFIG.log);
  const storeData = await storeModel.updateLog();
  console.log(storeData);
};

//---------------

export const normalizeUrlData = async (inputArray) => {
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

//------------

export const normalizeDownloadData = async (inputObj) => {
  const { findMediaArray, downloadMediaArray } = inputObj;

  //found media array loop
  const normalObj = {};
  for (let i = 0; i < findMediaArray.length; i++) {
    const { type, newMediaData } = findMediaArray[i];
    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    normalObj[`${typeStr}_foundCount`] = newMediaData?.length || 0;
  }

  //downloaded media array loop
  for (let i = 0; i < downloadMediaArray.length; i++) {
    const { type, downloadMediaData } = downloadMediaArray[i];
    const typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    normalObj[`${typeStr}_downloadedCount`] = downloadMediaData?.length || 0;
  }

  return normalObj;
};
