import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-util.js";
import { findNewMediaMap, downloadNewMediaMap } from "../config/map.js";
// import { logData } from "./scrape-log.js";

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  if (!continueScrape) return null;

  await findNewMedia();
  // await logData(findMediaData, scrapeId, "findMedia");
  if (!continueScrape) return null;

  await downloadNewMedia();
  // await logData(downloadMediaData, scrapeId, "downloadMedia");

  return true;
};

export const findNewMedia = async () => {
  const { typeArr } = CONFIG;

  // const findMediaArray = [];
  for (let i = 1; i < typeArr.length; i++) {
    if (!continueScrape) return null;
    const findType = typeArr[i];
    await getNewMediaData(findType);
    // const newMediaData = await getNewMediaData(findType);
    // if (!newMediaData) continue;

    // const findMediaObj = {
    //   type: findType,
    //   newMediaData: newMediaData,
    // };

    // findMediaArray.push(findMediaObj);
  }

  return true;
};

export const getNewMediaData = async (type) => {
  if (type === "articles") return null;

  const newMediaObj = await findNewMediaMap(type);
  const arrayModel = new dbModel(newMediaObj.params, "");
  const downloadArray = await arrayModel.findNewURLs();

  if (!downloadArray || !downloadArray.length) {
    console.log("NO NEW " + type.toUpperCase());
    return null;
  }

  console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
  const mediaDataArray = await newMediaObj.func(downloadArray);
  if (!mediaDataArray || !mediaDataArray.length) return null;

  console.log("FOUND " + mediaDataArray?.length + " " + type.toUpperCase());

  return mediaDataArray;
};

//-----------

export const downloadNewMedia = async () => {
  const { typeArr } = CONFIG;

  // const downloadMediaArray = [];
  for (let i = 1; i < typeArr.length; i++) {
    if (!continueScrape) return null;
    const downloadType = typeArr[i];
    await downloadNewMediaByType(downloadType);
    // const downloadMediaData = await downloadNewMediaByType(downloadType);

    // const downloadMediaObj = {
    //   type: downloadType,
    //   downloadMediaData: downloadMediaData,
    // };

    // //otherwise push to array
    // downloadMediaArray.push(downloadMediaObj);
  }

  return true;
};

export const downloadNewMediaByType = async (type) => {
  if (type === "articles") return null;
  const downloadObj = await downloadNewMediaMap(type);

  const downloadModel = new dbModel(downloadObj.params, "");
  const downloadArray = await downloadModel.findNewURLs();

  if (!downloadArray || !downloadArray.length) {
    console.log("NO NEW " + type.toUpperCase() + " TO DOWNLOAD");
    return null;
  }

  console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
  const downloadDataArray = await downloadObj.func(downloadArray);
  if (!downloadDataArray || !downloadDataArray.length) return null;

  console.log("DOWNLOADED " + downloadDataArray?.length + " " + type.toUpperCase());

  return downloadDataArray;
};
