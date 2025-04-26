import CONFIG from "../config/scrape-config.js";
import dbModel from "../models/db-model.js";

import { findNewMediaMap, downloadNewMediaMap } from "../config/map.js";

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  const { typeArr } = CONFIG;

  //retarded loop for getting new media data (start at 1 bc 0 is articles)
  for (let i = 1; i < typeArr.length; i++) {
    const findType = typeArr[i];
    if (findType === "articles") continue;
    await getNewMediaData(findType);
  }

  //retarded loop for downloading shit
  for (let i = 1; i < typeArr.length; i++) {
    const downloadType = typeArr[i];
    if (downloadType === "articles") continue;
    await downloadNewMediaFS(downloadType);
  }

  return "FINISHED GETTING NEW MEDIA DATA";
};

export const getNewMediaData = async (type) => {
  const newMediaObj = await findNewMediaMap(type);
  const arrayModel = new dbModel(newMediaObj.params, "");
  const downloadArray = await arrayModel.findNewURLs();

  if (!downloadArray || !downloadArray.length) {
    console.log("NO NEW " + type.toUpperCase());
    return null;
  }

  console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
  const mediaDataArray = await newMediaObj.func(downloadArray);
  console.log("FOUND " + mediaDataArray?.length + " " + type.toUpperCase());

  return mediaDataArray;
};

export const downloadNewMediaFS = async (type) => {
  console.log("FUCKING TYPE");
  console.log(type);
  const downloadObj = await downloadNewMediaMap(type);

  console.log("DOWNLOAD OBJECT");
  console.log(downloadObj);

  const downloadModel = new dbModel(downloadObj.params, "");
  const downloadArray = await downloadModel.findNewURLs();

  // console.log("DOWNLOAD ARRAY");
  // console.log(downloadArray);

  if (!downloadArray || !downloadArray.length) {
    console.log("NO NEW " + type.toUpperCase() + " TO DOWNLOAD");
    return null;
  }

  console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
  const downloadDataArray = await downloadObj.func(downloadArray);
  console.log("FOUND " + downloadDataArray?.length + " " + type.toUpperCase());

  return downloadDataArray;
};
