import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";
import Vid from "../models/vid-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";

//FIND VID PAGES / GET VID URLs SECTION

/**
 * Extracts articleListPage data items, sorts / normalizes them, then stores them
 * @function parseVidList
 * @returns {array} ARRAY of sorted OBJECTs (for tracking)
 */
export const buildVidList = async (inputHTML) => {
  try {
    // Parse the HTML using JSDOM
    const vidListModel = new Vid({ html: inputHTML });
    const vidListArray = await vidListModel.getVidListArray();

    //sort and add id to vidPage
    const sortModel = new UTIL({ inputArray: vidListArray });
    const vidListSort = await sortModel.sortArrayByDate();

    //add vidPageId
    const idModel = new UTIL({ inputArray: vidListSort });
    const vidListNormal = await idModel.addListId(CONFIG.vidPageList, "vidPageId");

    //store it
    const storeDataModel = new dbModel(vidListNormal, CONFIG.vidPageList);
    await storeDataModel.storeArray();

    //(added sorting)
    return vidListArray;
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }
};

//---------------

//VID PAGE
export const buildVidPageContent = async (inputArray) => {
  const vidPageArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const vidPageModel = new Vid({ inputObj: inputArray[i] });
      const vidPageObj = await vidPageModel.getVidPageObj();

      //add to array
      vidPageArray.push(vidPageObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //return for tracking
  return vidPageArray;
};

//------------------------

//VID ITEM
export const buildVidData = async (inputArray) => {
  const vidDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const vidModel = new Vid(inputArray[i]);
      const vidDataObj = await vidModel.getVidData();
      if (!vidDataObj) continue;

      vidDataArray.push(vidDataObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }
  return vidDataArray;
};

//----------------------------

//DOWNLOAD VID SECTION
export const downloadNewVidsFS = async (inputArray) => {
  //download just first item (below necessary for obj to be seen as array)
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByKcnaId();

  // //REMOVE
  // return null;

  // //TURN BACK ON // ONLY DOWNLOADING 1 PER ITERATION
  const vidDownloadArray = [sortArray[0]];
  const vidModel = new Vid({ inputArray: vidDownloadArray });
  // const vidModel = new Vid({ inputArray: sortArray }); //for testing

  const downloadVidDataArray = await vidModel.downloadVidArray();
  return downloadVidDataArray;
};

//---------------------

//UPLOAD SHIT

export const uploadNewVidPagesTG = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByDate();

  //upload the array
  const uploadModel = new Vid({ inputArray: sortArray });
  const uploadVidPageData = await uploadModel.postVidPageArrayTG();

  return uploadVidPageData;
};
