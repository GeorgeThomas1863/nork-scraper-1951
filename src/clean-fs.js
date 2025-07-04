import { promises as fs } from "fs";
import path from "path";
import { deleteItemsMap } from "../config/map-scrape.js";

import dbModel from "../models/db-model.js";
import { getItemSizeCheck, getItemSizeFS, getFileArrayFS, getFileArrayDB } from "./scrape-util.js";
import { reDownloadPics } from "./pics.js";
import { reDownloadVids } from "./vids.js";
import { scrapeState } from "./scrape-state.js";

export const runCleanFS = async () => {
  //delete EMPTY FILES
  if (!scrapeState.scrapeActive) return true;

  const deleteEmptyArray = await deleteEmptyFilesFS();
  // console.log("DELETE EMPTY DATA");
  // console.log(deleteEmptyArray);

  if (!scrapeState.scrapeActive) return true;
  const reDownloadData = await reDownloadMedia();
  console.log("RE DOWNLOAD DATA");
  console.log(reDownloadData);

  //DELETE TOO MANY FILES (more than X in folder)
};

//------------------------------

//DELETE EMPTY FILES SECTION

export const deleteEmptyFilesFS = async () => {
  const typeArr = ["vids", "pics", "temp"];

  //loop through each type
  const emptyFilesArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    try {
      if (!scrapeState.scrapeActive) return true;
      //get file Array
      const type = typeArr[i];
      const { basePath } = await deleteItemsMap(type);

      const fileArray = await fs.readdir(basePath);

      const deleteArrayData = await deleteArrayFS(fileArray, type);

      const deleteDataObj = {
        type: type,
        deleteDataArray: deleteArrayData,
      };
      emptyFilesArray.push(deleteDataObj);
    } catch (e) {
      console.log("DELETE TYPE ERROR");
      console.log(e);
    }
  }

  return emptyFilesArray;
};

export const deleteArrayFS = async (inputArray, type) => {
  const { basePath } = await deleteItemsMap(type);

  const deleteDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      if (!scrapeState.scrapeActive) return true;
      const filePath = path.join(basePath, inputArray[i]);
      const deleteDataObj = await deleteItemFS(filePath, type);

      deleteDataArray.push(deleteDataObj);
    } catch (e) {
      console.log("DELETE ITEM / FILE PATH ERROR");
      console.log(e);
    }
  }

  //return for tracking
  return deleteDataArray;
};

export const deleteItemFS = async (filePath, type) => {
  const itemSizeCheck = await getItemSizeCheck(filePath, type);
  const itemSizeFS = await getItemSizeFS(filePath);

  if (type === "temp") {
    console.log("TEMP FILE");
    console.log(itemSizeCheck);
    console.log(itemSizeFS);
  }

  // Delete check (exists and is bigger than db)
  if (itemSizeFS && itemSizeCheck && itemSizeFS > itemSizeCheck) {
    //return obj for tracking
    const keepObj = {
      status: "keep",
      filePath: filePath,
      fileType: type,
      itemSizeFS: itemSizeFS,
      itemSizeCheck: itemSizeCheck,
    };
    // console.log(`Kept: ${filePath} (${itemSizeFS} bytes)`);
    return keepObj;
  }

  //otherwise delete
  await fs.unlink(filePath);
  console.log("AHHHHHHHHH");
  console.log(`Deleted: ${filePath} (${itemSizeFS} bytes)`);

  const deleteObj = {
    status: "delete",
    filePath: filePath,
    fileType: type,
    itemSizeFS: itemSizeFS,
    itemSizeCheck: itemSizeCheck,
  };

  //store items deleted for tracking
  const storeModel = new dbModel(deleteObj, "deletedItems");
  const storeData = await storeModel.storeAny();
  console.log(storeData);

  console.log("DELETED ITEM");
  console.log(deleteObj);

  //return delete obj
  return deleteObj;
};

//--------------------------------

//RE DOWNLOAD MEDIA SECTION

export const reDownloadMedia = async () => {
  const typeArr = ["vids", "pics"];

  const redownloadDataArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    try {
      if (!scrapeState.scrapeActive) return true;
      //get file Array
      const type = typeArr[i];
      console.log("TYPE");
      console.log(type);

      const fileArrayFS = await getFileArrayFS(type);
      const fileArrayDB = await getFileArrayDB(type);

      const redownloadArray = await getRedownloadArray(fileArrayFS, fileArrayDB);
      if (!redownloadArray || !redownloadArray.length) continue;

      const redownloadData = await reDownloadByType(redownloadArray, type);
      const redownloadDataObj = {
        type: type,
        redownloadArray: redownloadArray,
        redownloadData: redownloadData,
      };

      //for tracking
      redownloadDataArray.push(redownloadDataObj);
    } catch (e) {
      console.log("RE DOWNLOAD DATA ARRAY ERROR");
      console.log(e);
    }
  }

  return redownloadDataArray;
};

export const getRedownloadArray = async (fileArrayFS, fileArrayDB) => {
  const redownloadArray = [];
  for (let i = 0; i < fileArrayDB.length; i++) {
    if (!scrapeState.scrapeActive) return true;
    if (fileArrayFS.includes(fileArrayDB[i])) continue;

    //otherwise add to array
    redownloadArray.push(fileArrayDB[i]);
  }

  // console.log("REDOWNLOAD ARRAY");
  // console.log(redownloadArray);

  return redownloadArray;
};

export const reDownloadByType = async (inputArray, type) => {
  console.log("RE DOWNLOAD BY TYPE");
  console.log(type);
  console.log(inputArray);

  switch (type) {
    case "pics":
      return await reDownloadPics(inputArray);
    case "vids":
      return await reDownloadVids(inputArray);

    default:
      return null;
  }
};
