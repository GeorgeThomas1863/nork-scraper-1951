import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const updateMongo = async () => {
  const updatePicData = await updatePicDBs();
  const updatePicArrayData = await updatePicArrayDBs();
  const updateThumbnailData = await updateThumbnailDBs();

  const updateVidData = await updateVidDBs();
};

//updates articles, pics, picSetContent, vidPageContent (thumbnail)
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

      const updateData = await updateNestedItem(docObj)
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

//update item
//   const itemModel = new dbModel(itemDB, picArrayCollection);
//   const itemData = await itemModel.updateObjItem();
//   console.log(itemData);

//takes picArray as input
export const updateNestedItem = async (inputObj) => {
  if (!inputObj || !inputObj.picArray || !inputObj.picArray.length) return null;
  const { url, picArray } = inputObj;

  //HERE

  //rebuild the picArray
  const rebuiltPicArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
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

export const updateVidDBs = async () => {};
