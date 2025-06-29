import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import Pic from "../models/pic-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";

import { getDataFromPath } from "./scrape-util.js";
import { deleteItemsMap } from "../config/map-scrape.js";
import { scrapeState } from "./scrape-state.js";

//FIND PICS / GET PICURLS SECTION

//PICSET LIST
export const buildPicSetList = async (inputHTML) => {
  try {
    //stop if needed
    if (!scrapeState.scrapeActive) return null;

    const picSetModel = new Pic({ html: inputHTML });
    const picSetListArray = await picSetModel.getPicSetListArray();

    //sort the array
    const sortModel = new UTIL({ inputArray: picSetListArray });
    const picSetListSort = await sortModel.sortArrayByDate();

    //add picSetId ID
    const idModel = new UTIL({ inputArray: picSetListSort, inputType: "picSetId" });
    const picSetListNormal = await idModel.addListId();

    //store it
    const storeDataModel = new dbModel(picSetListNormal, CONFIG.picSetList);
    await storeDataModel.storeArray();

    return picSetListNormal;
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }
};

//---------------

//PIC SET CONTENT
export const buildPicSetContent = async (inputArray) => {
  const picSetArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return picSetArray;
    try {
      const picSetModel = new Pic({ inputObj: inputArray[i] });
      const picSetObj = await picSetModel.getPicSetObj();

      picSetArray.push(picSetObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //for tracking
  return picSetArray;
};

//----------------

//GET PIC ITEM DATA
export const buildPicData = async (inputArray) => {
  const picDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    if (!scrapeState.scrapeActive) return picDataArray;

    try {
      const picDataModel = new Pic({ inputObj: inputArray[i] });
      const picData = await picDataModel.getPicData();
      if (!picData) continue;

      picDataArray.push(picData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return picDataArray;
};

//----------------------

//DOWNLOAD PIC SECTION
export const downloadPicSetArray = async (inputArray) => {
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByKcnaId();
  if (!sortArray || !sortArray.length) return null;

  const downloadPicDataArray = [];
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return downloadPicDataArray;
    try {
      //add save path to picObj
      const picObj = sortArray[i];
      const savePath = CONFIG.picPath + picObj.picId + ".jpg";
      picObj.savePath = savePath;
      const picModel = new Pic({ picObj: picObj });

      //download the pic
      const downloadPicData = await picModel.downloadPicFS();
      if (!downloadPicData) continue;

      downloadPicDataArray.push(downloadPicData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return downloadPicDataArray;
};

//---------------------

//UPLOAD PIC SETS
export const uploadPicSetArrayTG = async (inputArray) => {
  //null check and sort shouldnt be necessary, doing for redundancy
  if (!inputArray || !inputArray.length) return null;
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByDate();

  const uploadDataArray = [];
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return uploadDataArray;
    try {
      const inputObj = sortArray[i];
      const uploadModel = new Pic({ inputObj: inputObj });
      const postPicSetData = await uploadModel.postPicSetObjTG();
      if (!postPicSetData || !postPicSetData.length) continue;

      //Build store obj (just store object for first text chunk)
      const storeObj = { ...inputObj };
      storeObj.picsPosted = postPicSetData.length;
      storeObj.chat = postPicSetData[0]?.chat;
      storeObj.message_id = postPicSetData[0]?.message_id;
      storeObj.sender_chat = postPicSetData[0]?.sender_chat;

      //store data
      const storeModel = new dbModel(storeObj, CONFIG.picSetsUploaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);

      uploadDataArray.push(storeObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return uploadDataArray;
};

//------------------------------

//REDOWNLOAD PICS
export const reDownloadPics = async (inputArray) => {
  const { collectionArr } = await deleteItemsMap("pics");
  const picDownloadArray = [];

  for (let i = 0; i < inputArray.length; i++) {
    try {
      const savePath = inputArray[i];

      //get data from old pic entry before deleting
      const fuckedObj = await getDataFromPath(savePath, "pics");
      if (!fuckedObj || !fuckedObj.url) continue;
      const { url } = fuckedObj;

      const deleteParams = {
        keyToLookup: "url",
        itemValue: url,
      };

      //loop through to delete from each collection
      for (let j = 0; j < collectionArr.length; j++) {
        const dataModel = new dbModel(deleteParams, collectionArr[j]);
        await dataModel.deleteItem();
      }

      //redownload / store headers
      const headerObj = await reDownloadPicHeaders(fuckedObj);

      //redownload pic
      const picModel = new Pic({ picObj: headerObj });
      const picData = await picModel.downloadPicFS();
      picDownloadArray.push(picData);
    } catch (e) {
      console.log(e);
    }
  }

  return picDownloadArray;
};

export const reDownloadPicHeaders = async (inputObj) => {
  const { url, picId, scrapeId, date } = inputObj;

  //redo getting headers
  const headerParams = {
    url: url,
  };

  const headerModel = new KCNA(headerParams);
  const headerData = await headerModel.getMediaHeaders();
  if (!headerData) return null;

  //rebuild obj
  const headerObj = {
    url: url,
    scrapeId: scrapeId,
    date: date,
    headerData: headerData,
    picId: picId,
  };

  //store it again
  const storeModel = new dbModel(headerObj, CONFIG.pics);
  await storeModel.storeUniqueURL();

  return headerObj;
};
