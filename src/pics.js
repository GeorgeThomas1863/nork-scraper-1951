import CONFIG from "../config/config.js";
import Pic from "../models/pic-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";

import { continueScrape } from "./scrape-util.js";

//FIND PICS / GET PICURLS SECTION

//PICSET LIST
export const buildPicSetList = async (inputHTML) => {
  try {
    //stop if needed
    if (!continueScrape) return null;

    const picSetModel = new Pic({ html: inputHTML });
    const picSetListArray = await picSetModel.getPicSetListArray();

    //sort the array
    const sortModel = new UTIL({ inputArray: picSetListArray });
    const picSetListSort = await sortModel.sortArrayByDate();

    //add picSetId ID
    const idModel = new UTIL({ inputArray: picSetListSort });
    const picSetListNormal = await idModel.addListId(CONFIG.picSetList, "picSetId");

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
    if (!continueScrape) return picSetArray;
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
    if (!continueScrape) return picDataArray;

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
    if (!continueScrape) return downloadPicDataArray;
    try {
      //add save path to picObj
      const picObj = sortArray[i];
      const savePath = CONFIG.picPath + picObj.kcnaId + ".jpg";
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
    if (!continueScrape) return uploadDataArray;
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
