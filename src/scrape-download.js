import CONFIG from "../config/scrape-config.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-stop.js";
import { findNewMediaMap, downloadNewMediaMap } from "../config/map.js";

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  const { typeArr } = CONFIG;

  //retarded loop for getting new media data (start at 1 bc 0 is articles)
  const findMediaArray = [];
  for (let i = 1; i < typeArr.length; i++) {
    if (!continueScrape) return null;
    const findType = typeArr[i];
    const newMediaData = await getNewMediaData(findType);

    const findMediaObj = {
      type: findType,
      newMediaData: newMediaData,
    };

    //ADD CHECK HERE for STOPPING

    //otherwise push to array
    findMediaArray.push(findMediaObj);
  }

  //retarded loop for downloading shit
  const downloadMediaArray = [];
  for (let i = 1; i < typeArr.length; i++) {
    if (!continueScrape) return null;
    const downloadType = typeArr[i];
    const downloadMediaData = await downloadNewMediaFS(downloadType);

    const downloadMediaObj = {
      type: downloadType,
      downloadMediaData: downloadMediaData,
    };

    //ADD CHECK HERE for STOPPING

    //otherwise push to array
    downloadMediaArray.push(downloadMediaObj);
  }

  const newMediaObj = {
    findMediaArray: findMediaArray,
    downloadMediaArray: downloadMediaArray,
  };

  return newMediaObj;
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

export const downloadNewMediaFS = async (type) => {
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
