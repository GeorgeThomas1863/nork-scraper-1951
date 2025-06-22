import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const updateMongo = async () => {
  console.log("!!! UPDATING MONGO !!!");
  await updatePicDB();

  await updatePicArrayDBs();

  const updateThumbnailData = await updateThumbnailDBs();
  console.log("UPDATE THUMBNAIL DATA");
  console.log(updateThumbnailData);

  const updateVidData = await updateVidDB();
  console.log("UPDATE VID DATA");
  console.log(updateVidData);
};

//updates pics
export const updatePicDB = async () => {
  const { pics } = CONFIG;

  //get all pic data
  const picModel = new dbModel("", pics);
  const picDataArray = await picModel.getAll();

  //loop through and check that each have all data
  const returnArray = [];
  for (let i = 0; i < picDataArray.length; i++) {
    try {
      const picDocObj = picDataArray[i];
      const updatePicData = await updatePicItem(picDocObj);
      if (!updatePicData) continue;

      //return for tracking
      returnArray.push(updatePicData);
    } catch (e) {
      console.log("UPDATE PIC DB FUCKED");
      console.log(e);
      continue;
    }
  }

  return returnArray;
};

export const updatePicItem = async (inputObj) => {
  if (!inputObj || inputObj.savePath) return null; //return if already has save Path
  const { url } = inputObj;
  const { pics, picsDownloaded } = CONFIG;

  //get update data
  const dataParams = {
    keyToLookup: "url",
    itemValue: url,
  };

  const dataModel = new dbModel(dataParams, picsDownloaded);
  const updateData = await dataModel.getUniqueItem();
  if (!updateData) return null;
  const { savePath, downloadedSize } = updateData;

  const updateObj = {
    savePath: savePath,
    downloadedSize: downloadedSize,
  };

  //update it
  const updateParams = {
    keyToLookup: "url",
    itemValue: url,
    updateObj: updateObj,
  };

  const updateModel = new dbModel(updateParams, pics);
  const updateItemData = await updateModel.updateObjItem();

  return updateItemData;
};

//-------------------------------

//updates articles and picSetContent
export const updatePicArrayDBs = async () => {
  const { articles, picSetContent } = CONFIG;

  const picArrayCollectionArr = [articles, picSetContent];

  //update each picArray collection
  const returnArray = [];
  for (let i = 0; i < picArrayCollectionArr.length; i++) {
    try {
      //collection to update
      const picArrayCollection = picArrayCollectionArr[i];

      const updateData = await updateNestedCollection(picArrayCollection);
      returnArray.push(updateData);
    } catch (e) {
      console.log("UPDATE PIC ARRAY DB FUCKED");
      console.log(e);
      continue;
    }
  }

  return returnArray;
};

//UPDATES COLLECTION with nested array
export const updateNestedCollection = async (collection) => {
  if (!collection) return null;

  //get all data from collection
  const collectionModel = new dbModel("", collection);
  const collectionDataArray = await collectionModel.getAll();
  if (!collectionDataArray || !collectionDataArray.length) return null;

  //loops through each doc in collection
  const returnArray = [];
  for (let i = 0; i < collectionDataArray.length; i++) {
    try {
      const docObj = collectionDataArray[i];
      //if no picArray, skip
      if (!docObj || !docObj.picArray || !docObj.picArray.length) continue;

      const updateData = await updateNestedItem(docObj, collection);
      if (!updateData) continue;

      returnArray.push(updateData);
    } catch (e) {
      console.log("UPDATE NESTED COLLECTION FUCKED");
      console.log(e);
      continue;
    }
  }
  return returnArray;
};

//takes picArray as input
export const updateNestedItem = async (inputObj, collection) => {
  if (!inputObj || !inputObj.picArray || !inputObj.picArray.length) return null;
  const { url, picArray } = inputObj;

  //check if the picArray has ANY non objs (only rebuild if it does)
  const hasNonObjs = picArray.some((item) => typeof item !== "object");
  if (!hasNonObjs) return null;

  //otherwise rebuild picArray
  const rebuiltPicArray = await rebuildPicArray(picArray);
  if (!rebuiltPicArray || !rebuiltPicArray.length) return null;

  const params = {
    docKey: "url",
    docValue: url,
    updateKey: "picArray",
    updateArray: rebuiltPicArray,
  };

  const updateModel = new dbModel(params, collection);
  const updateData = await updateModel.updateArrayNested();

  console.log("UPDATE DATA");
  console.log(updateData);

  return updateData;
};

//rebuilds picArray with full data
export const rebuildPicArray = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;
  const { picsDownloaded } = CONFIG;

  //rebuild the picArray
  const rebuiltPicArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      //check if item is already an obj, add to return if so
      if (typeof inputArray[i] === "object") {
        rebuiltPicArray.push(inputArray[i]);
        continue;
      }

      //otherwise list of picURLs
      const picURL = inputArray[i];

      //get data to update
      const dataParams = {
        keyToLookup: "url",
        itemValue: picURL,
      };

      const updateModel = new dbModel(dataParams, picsDownloaded);
      const updateObj = await updateModel.getUniqueItem();
      if (!updateObj) continue;

      rebuiltPicArray.push(updateObj);
    } catch (e) {
      console.log("GET PIC ARRAY UPDATE DATA FUCKED");
      console.log(e);
      continue;
    }
  }

  return rebuiltPicArray;
};

//-------------------------------

//adds pic data to thumbnail in vidPageContent ONLY (not to vids or vid downloaded)
export const updateThumbnailDBs = async () => {
  const { vidPageContent } = CONFIG;

  //get all data from collection
  const collectionModel = new dbModel("", vidPageContent);
  const collectionDataArray = await collectionModel.getAll();
  if (!collectionDataArray || !collectionDataArray.length) return null;

  //loop through each doc in collection
  const returnArray = [];
  for (let i = 0; i < collectionDataArray.length; i++) {
    try {
      const docObj = collectionDataArray[i];
      const updateData = await updateThumbnailItem(docObj, vidPageContent);
      if (!updateData) continue;
      returnArray.push(updateData);
    } catch (e) {
      console.log("UPDATE THUMBNAIL DB FUCKED");
      console.log(e);
      continue;
    }
  }

  return returnArray;
};

export const updateThumbnailItem = async (inputObj, collection) => {
  if (!inputObj || !inputObj.thumbnail) return null;
  const { url, thumbnail } = inputObj;
  const { picsDownloaded } = CONFIG;

  console.log("UPDATE THUMBNAIL ITEM!!!!");

  //get update data
  const dataParams = {
    keyToLookup: "url",
    itemValue: thumbnail,
  };

  const dataModel = new dbModel(dataParams, picsDownloaded);
  const updateObj = await dataModel.getUniqueItem();
  if (!updateObj) return null;
  //get rid of the id
  delete updateObj._id;

  //update it
  const updateParams = {
    keyToLookup: "url",
    itemValue: url,
    insertKey: "thumbnailData",
    updateObj: updateObj,
  };

  console.log("UPDATE THUMBNAIL PARAMS");
  console.log(updateParams);

  const updateModel = new dbModel(updateParams, collection);
  const updateItemData = await updateModel.updateObjInsert();

  console.log("UPDATE THUMBNAIL ITEM DATA");
  console.log(updateItemData);

  return updateItemData;
};

//----------------------------------

export const updateVidDB = async () => {
  const { vidPageContent } = CONFIG;

  //get all data from collection
  const collectionModel = new dbModel("", vidPageContent);
  const collectionDataArray = await collectionModel.getAll();
  if (!collectionDataArray || !collectionDataArray.length) return null;

  //loop through each doc in collection
  const returnArray = [];
  for (let i = 0; i < collectionDataArray.length; i++) {
    try {
      const docObj = collectionDataArray[i];
      const updateData = await updateVidItem(docObj, vidPageContent);
      if (!updateData) continue;
      returnArray.push(updateData);
    } catch (e) {
      console.log("UPDATE VID DB FUCKED");
      console.log(e);
      continue;
    }
  }

  return returnArray;
};

export const updateVidItem = async (inputObj, collection) => {
  if (!inputObj || inputObj.vidData) return null; //return if already has vidData
  const { url, vidURL } = inputObj;
  const { vidsDownloaded } = CONFIG;

  //get update data
  const dataParams = {
    keyToLookup: "url",
    itemValue: vidURL,
  };

  const dataModel = new dbModel(dataParams, vidsDownloaded);
  const updateObj = await dataModel.getUniqueItem();
  if (!updateObj) return null;
  //get rid of the id
  delete updateObj._id;

  //update it
  const updateParams = {
    keyToLookup: "url",
    itemValue: url,
    insertKey: "vidData",
    updateObj: updateObj,
  };

  const updateModel = new dbModel(updateParams, collection);
  const updateItemData = await updateModel.updateObjInsert();

  return updateItemData;
};
