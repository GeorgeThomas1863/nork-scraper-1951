import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

// import { continueScrape } from "./scrape-util.js";
import { findNewMediaMap, downloadNewMediaMap } from "../config/map-scrape.js";
import { scrapeState } from "./scrape-state.js";
// import { logData } from "./scrape-log.js";

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  const { scrapeActive } = scrapeState;
  if (!scrapeActive) return null;

  await findNewMedia();
  if (!scrapeActive) return null;

  await downloadNewMedia();
  if (!scrapeActive) return null;

  return true;
};

export const findNewMedia = async () => {
  const { typeArr } = CONFIG;

  for (let i = 1; i < typeArr.length; i++) {
    if (!scrapeState.scrapeActive) return null;
    const findType = typeArr[i];
    if (findType === "watch") continue;
    await getNewMediaData(findType);
  }

  return true;
};

export const getNewMediaData = async (type) => {
  if (type === "articles") return null;

  //get new media ARRAY
  const newMediaObj = await findNewMediaMap(type);
  const arrayModel = new dbModel(newMediaObj.params, "");
  const newMediaArray = await arrayModel.findNewURLs();

  if (!newMediaArray || !newMediaArray.length) {
    console.log("NO NEW " + type.toUpperCase());
    return null;
  }

  console.log("GETTING DATA FOR " + newMediaArray?.length + " " + type.toUpperCase());
  const mediaDataArray = await newMediaObj.func(newMediaArray);

  //console log results
  if (!mediaDataArray || !mediaDataArray.length) return null;
  console.log("FOUND " + mediaDataArray?.length + " " + type.toUpperCase());

  return true;
};

//-----------

export const downloadNewMedia = async () => {
  const { typeArr } = CONFIG;

  for (let i = 1; i < typeArr.length; i++) {
    if (!scrapeState.scrapeActive) return null;
    const downloadType = typeArr[i];
    if (downloadType === "watch") continue;
    await downloadNewMediaByType(downloadType);
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

  console.log("DOWNLOADING " + downloadArray?.length + " " + type.toUpperCase());
  const downloadDataArray = await downloadObj.func(downloadArray);
  if (!downloadDataArray || !downloadDataArray.length) return null;

  console.log("DOWNLOADED " + downloadDataArray?.length + " " + type.toUpperCase());

  return downloadDataArray;
};
