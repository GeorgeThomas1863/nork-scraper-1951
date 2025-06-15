import { promises as fs } from "fs";
import path from "path";
import dbModel from "../models/db-model.js";
import { deleteItemsMap } from "../config/map-scrape.js";

export const runCleanFS = async () => {
  //delete EMPTY FILES
  await deleteEmptyFilesFS();
  // console.log("DELETE EMPTY DATA");
  // console.log(deleteEmptyData);

  //DELETE TOO MANY FILES (more than X in folder)
};

export const deleteEmptyFilesFS = async () => {
  const typeArr = ["vids", "pics", "temp"];

  //loop through each type
  const emptyFilesArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    try {
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

  //Delete saved item from mongo
  const removeDataArray = await removeFromMongo(filePath, type);

  //add to existing obj
  if (removeDataArray) {
    deleteObj.removeDataArray = removeDataArray;
  }

  //store items deleted for tracking
  const storeModel = new dbModel(deleteObj, "deletedItems");
  const storeData = await storeModel.storeAny();
  console.log(storeData);

  console.log("DELETED ITEM");
  console.log(deleteObj);

  //return delete obj
  return deleteObj;
};

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

//remove blank items from mongo
export const removeFromMongo = async (filePath, type) => {
  const { collectionArr } = await deleteItemsMap(type);

  if (type === "temp") return null; //avoids error

  const lookupParams = {
    keyToLookup: "savePath",
    itemValue: filePath,
  };

  //lookup data first to delete with url
  const lookupModel = new dbModel(lookupParams, collectionArr[0]);
  const lookupData = await lookupModel.getUniqueItem();
  if (!lookupData || !lookupData.url) return null;

  const { url } = lookupData;

  //loop through collections
  const deleteDataArray = [];
  for (let i = 0; i < collectionArr.length; i++) {
    const collection = collectionArr[i];
    const deleteParams = {
      keyToLookup: "url",
      itemValue: url,
    };
    const deleteModel = new dbModel(deleteParams, collection);
    const deleteData = await deleteModel.deleteItem();
    const deleteDataObj = {
      collection: collection,
      url: url,
      deleteData: deleteData,
    };
    deleteDataArray.push(deleteDataObj);
  }

  return deleteDataArray;
};
