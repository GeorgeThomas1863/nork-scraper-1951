import { promises as fs } from "fs";
import path from "path";
import dbModel from "../models/db-model.js";
import { deleteItemsMap } from "../config/map-scrape.js";

//STOP SCRAPE CHECK
export let continueScrape = true;

// Function to update the state
export const setContinueScrape = async (inputValue) => {
  continueScrape = inputValue;
  console.log("CONTINUE SCRAPE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
  return continueScrape;
};

//---------------

//SCRAPE ACTIVE CHECK (returns null if active, prevents multiple commands)s
export let scrapeActive = false;

export const setScrapeActive = async (inputValue) => {
  scrapeActive = inputValue;
  console.log("SCRAPE ACTIVE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
  return scrapeActive;
};

//--------------

//SCRAPE ID
export let scrapeId = 0;

export const setScrapeId = async (inputValue) => {
  scrapeId = inputValue;
  console.log("SCRAPE ID SET TO: " + scrapeId);
  return scrapeId;
};

//------------------------------

//size of item in db
export const getItemSizeCheck = async (filePath, type) => {
  const { collectionArr } = await deleteItemsMap(type);

  //always delete temp files
  if (type === "temp") return 0;

  const itemParams = {
    keyToLookup: "savePath",
    itemValue: filePath,
  };

  //get item db data
  const dataModel = new dbModel(itemParams, collectionArr[0]);
  const itemData = await dataModel.getUniqueItem();

  if (type === "vids") {
    const vidSize = itemData?.vidSizeBytes || 0;
    return vidSize * 0.8;
  }

  //otherwise pics
  const picSize = itemData?.downloadedSize || 0; //set to 0 if cant find
  return picSize * 0.8;
};

//size of item on fs
export const getItemSizeFS = async (filePath) => {
  // Get file stats
  const stats = await fs.stat(filePath);

  // null if a directory
  if (!stats || stats.isDirectory()) return null;

  return stats.size;
};

//get array of FS files
export const getFileArrayFS = async (type) => {
  const { basePath } = await deleteItemsMap(type);
  const itemArray = await fs.readdir(basePath);

  //needed bc readdir ONLY returns file names
  const fileArrayFS = [];
  for (let i = 0; i < itemArray.length; i++) {
    const item = itemArray[i];
    const filePath = path.join(basePath, item);

    fileArrayFS.push(filePath);
  }

  return fileArrayFS;
};

//get array of DB files
export const getFileArrayDB = async (type) => {
  const { collectionArr } = await deleteItemsMap(type);

  const dataModel = new dbModel("", collectionArr[0]);
  const itemArray = await dataModel.getAll();

  const fileArrayDB = [];
  for (let i = 0; i < itemArray.length; i++) {
    const item = itemArray[i];
    const filePath = item.savePath;
    fileArrayDB.push(filePath);
  }

  return fileArrayDB;
};

export const getDataFromPath = async (inputPath, type) => {
  const { collectionArr } = await deleteItemsMap(type);

  const params = {
    keyToLookup: "savePath",
    itemValue: inputPath,
  };

  const dataModel = new dbModel(params, collectionArr[0]);
  const data = await dataModel.getUniqueItem();

  return data;
};
