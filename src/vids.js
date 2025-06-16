import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import Vid from "../models/vid-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";
import { continueScrape, getDataFromPath } from "./scrape-util.js";

//FIND VID PAGES / GET VID URLs SECTION

export const buildVidList = async (inputHTML) => {
  try {
    //stop if needed
    if (!continueScrape) return null;

    // Parse the HTML using JSDOM
    const vidListModel = new Vid({ html: inputHTML });
    const vidListArray = await vidListModel.getVidListArray();

    //sort and add id to vidPage
    const sortModel = new UTIL({ inputArray: vidListArray });
    const vidListSort = await sortModel.sortArrayByDate();

    //add vidPageId
    const idModel = new UTIL({ inputArray: vidListSort, inputType: "vidPageId" });
    const vidListNormal = await idModel.addListId();

    //store it
    const storeDataModel = new dbModel(vidListNormal, CONFIG.vidPageList);
    const storeData = await storeDataModel.storeArray();
    console.log(storeData);

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
    //stop if needed
    if (!continueScrape) return vidPageArray;

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
    //stop if needed
    if (!continueScrape) return vidDataArray;

    try {
      const vidModel = new Vid({ inputObj: inputArray[i] });
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
export const downloadVidPageArray = async (inputArray) => {
  //download just first item (below necessary for obj to be seen as array)
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByKcnaId();
  if (!sortArray || !sortArray.length) return null;

  const downloadVidDataArray = [];
  // for (let i = 0; i < 1; i++) { //download 1 for TESTING
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!continueScrape) return downloadVidDataArray;

    try {
      //add save path to picObj
      const vidObj = sortArray[i];
      const savePath = CONFIG.vidPath + vidObj.vidId + ".mp4";
      vidObj.savePath = savePath;
      const vidModel = new Vid({ inputObj: vidObj });

      //download the vid
      const downloadVidObj = await vidModel.downloadVidFS();
      if (!downloadVidObj) continue;

      //STORE HERE
      const storeObj = { ...vidObj, ...downloadVidObj };
      const storeModel = new dbModel(storeObj, CONFIG.vidsDownloaded);
      await storeModel.storeUniqueURL();

      downloadVidDataArray.push(storeObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return downloadVidDataArray;
};

//---------------------

//UPLOAD SHIT

export const uploadVidPageArrayTG = async (inputArray) => {
  console.log("!!!!!!!UPLOAD VID PAGE ARRAY");
  console.log(inputArray);

  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByDate();
  if (!sortArray || !sortArray.length) return null;

  const uploadDataArray = [];
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!continueScrape) return uploadDataArray;
    try {
      const inputObj = sortArray[i];
      const uploadModel = new Vid({ inputObj: inputObj });
      const postVidPageObjData = await uploadModel.postVidPageObj();
      if (!postVidPageObjData) continue;

      //Build store obj (just store object for first text chunk)
      const storeObj = { ...inputObj };
      storeObj.chat = postVidPageObjData?.chat;
      storeObj.message_id = postVidPageObjData?.message_id;
      storeObj.sender_chat = postVidPageObjData?.sender_chat;

      //store data
      const storeModel = new dbModel(storeObj, CONFIG.vidPagesUploaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);

      uploadDataArray.push(storeObj);
    } catch (e) {
      // console.log(e);
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return uploadDataArray;
};

//---------------------------

//REDOWNLOAD VIDS

export const reDownloadVids = async (inputArray) => {
  const { collectionArr } = await deleteItemsMap("vids");

  const vidDownloadArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const savePath = inputArray[i];
      const fuckedObj = await getDataFromPath(savePath, "vids");
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

      //get vid headers
      const headerObj = await reDownloadVidHeaders(fuckedObj);

      //redownload vid
      const vidModel = new Vid({ inputObj: headerObj });
      const vidObj = await vidModel.downloadVidFS();
      if (!vidObj || !vidObj.chunksProcessed) continue;

      //build return obj
      const storeObj = { ...headerObj };
      storeObj.chunksProcessed = vidObj.chunksProcessed;

      //store it
      const storeModel = new dbModel(storeObj, CONFIG.vidsDownloaded);
      await storeModel.storeUniqueURL();

      vidDownloadArray.push(storeObj);
    } catch (e) {
      console.log(e);
    }
  }

  return vidDownloadArray;
};

export const reDownloadVidHeaders = async (inputObj) => {
  const { url, vidId, scrapeId, date } = inputObj;

  //redo getting headers
  const headerParams = {
    url: url,
  };

  const headerModel = new KCNA(headerParams);
  const headerData = await headerModel.getMediaHeaders();
  if (!headerData) return null;

  console.log("VID HEADER DATA!!!!");
  console.log(headerData);

  //parse vid headers here [will prob need to change based on future headers]
  const parseModel = new Vid({ headerData: headerData });
  const headerObj = await parseModel.parseVidHeaders();

  //add vid temp path
  const vidTempPath = CONFIG.tempPath + vidId + ".mp4";

  //add back to obj
  headerObj.url = url;
  headerObj.vidId = vidId;
  headerObj.scrapeId = scrapeId;
  headerObj.date = date;
  headerObj.vidTempPath = vidTempPath;

  //store it again
  const storeModel = new dbModel(headerObj, CONFIG.vids);
  await storeModel.storeUniqueURL();

  return headerObj;
};
