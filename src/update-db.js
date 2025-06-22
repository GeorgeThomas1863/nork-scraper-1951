import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const updateMongo = async () => {
  console.log("!!! UPDATING MONGO !!!");
  //   const updatePicData = await updatePicDBs();
  const updatePicArrayData = await updatePicArrayDBs();
  console.log("UPDATE PIC ARRAY DATA");
  console.log(updatePicArrayData);
  //   const updateThumbnailData = await updateThumbnailDBs();

  //   const updateVidData = await updateVidDBs();
};

//updates pics
export const updatePicDBs = async () => {};

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

  //check if the picArray has ANY non objs (only rebuild if it does) [this will REQUIRE a few rewrites elsewhere]
  //NEED TO TEST THIS
  const hasNonObjs = picArray.some((item) => typeof item !== "object");
  if (!hasNonObjs) return null;

  //otherwise rebuild picArray
  const rebuiltPicArray = await rebuildPicArray(picArray);
  if (!rebuiltPicArray || !rebuiltPicArray.length) return null;

  const params = {
    docKey: "url",
    docValue: url,
    nestedKey: "picArray",
    nestedValue: picArray,
    updateObj: rebuiltPicArray,
  };

  console.log("PARAMS");
  console.log(params);

  const updateModel = new dbModel(params, collection);
  const updateData = await updateModel.updateObjNested();

  console.log("UPDATE DATA");
  console.log(updateData);

  return updateData;
};

//rebuilds picArray with full data
export const rebuildPicArray = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

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

export const updateThumbnailData = async () => {};

export const updateVidDBs = async () => {};
