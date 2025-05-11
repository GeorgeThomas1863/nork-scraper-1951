import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const logData = async (inputArray, scrapeId, logType) => {
  if (!inputArray) return null;

  //normalize data
  const normalArray = await normalizeByType(inputArray, logType);
  if (!normalArray) return null;

  for (let i = 0; i < normalArray.length; i++) {
    //store by updating log
    let storeObj = {
      inputObj: normalArray[i],
      scrapeId: scrapeId,
    };

    if (logType === "uploadMedia") {
      const mediaObj = await extractMediaCount(inputArray);
      storeObj = { ...storeObj, ...mediaObj };
    }

    const storeModel = new dbModel(storeObj, CONFIG.log);
    const storeData = await storeModel.updateLog();
    console.log(storeData);
  }

  return true;
};

//could make better, but dont hate self enough
export const normalizeByType = async (inputArray, logType) => {
  let normalArray = [];

  switch (logType) {
    case "listArray":
      normalArray = await normalizeArray(inputArray, "listItemCount", "newListData", true);
      break;

    case "contentArray":
      normalArray = await normalizeArray(inputArray, "contentScrapedCount", "newContentData", true);
      break;

    case "findMedia":
      normalArray = await normalizeArray(inputArray, "foundCount", "newMediaData", false);
      break;

    case "downloadMedia":
      normalArray = await normalizeArray(inputArray, "downloadedCount", "downloadMediaData", false);
      break;

    case "uploadMedia":
      normalArray = await normalizeArray(inputArray, "uploadCount", "uploadMediaData", true);

      break;
  }

  return normalArray;
};

export const extractMediaCount = async (inputArray) => {
  //extract pics posted
  const picsPosted = await extractPicsPosted(inputArray);
  const vidsPosted = await extractVidsPosted(inputArray);

  //build obj
  const storeObj = {
    pics_uploadCount: picsPosted || 0,
    vids_uploadCount: vidsPosted || 0,
  };

  return storeObj;
};

//---------------

export const normalizeArray = async (inputArray, key, value, changeTypeStr) => {
  const normalArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //way to dynamically destructure
    const { type, [value]: valueName } = inputArray[i];

    //get type str
    let typeStr = type;
    if (changeTypeStr) {
      typeStr = type === "pics" ? "picSets" : type === "vids" ? "vidPages" : type;
    }

    const normalObj = {
      [`${typeStr}_${key}`]: valueName?.length || 0,
    };
    normalArray.push(normalObj);
  }

  return normalArray;
};

export const extractPicsPosted = async (inputArray) => {
  let picsPosted = 0;

  console.log("EXTRACT PICS FROM ARTICLES");
  console.log(inputArray[0]);
  console.log("EXTRACT PICS FROM PIC SETS");
  console.log(inputArray[1]);
  console.log("EXTRACT PICS FROM VIDS");
  console.log(inputArray[2]);

  for (let i = 0; i < inputArray.length; i++) {
    const { type, uploadMediaData } = inputArray[i];
    if (!uploadMediaData) continue;

    switch (type) {
      case "articles":
        for (let j = 0; j < uploadMediaData.length; j++) {
          const articleItem = uploadMediaData[j];
          if (!articleItem || !articleItem.picArray || !articleItem.picArray.length) continue;

          //add number of articles posted
          picsPosted = picsPosted + articleItem.picArray?.length;
        }
        break;

      case "pics":
        for (let k = 0; k < uploadMediaData.length; k++) {
          const picSetItem = uploadMediaData[k];
          if (!picSetItem || !picSetItem.picArray || !picSetItem.picArray.length) continue;

          //add number of articles posted
          picsPosted = picsPosted + picSetItem.picArray?.length;
        }
        break;

      case "vids":
        for (let m = 0; m < uploadMediaData.length; m++) {
          const vidPageItem = uploadMediaData[m];
          if (!vidPageItem || !vidPageItem.thumbnail) continue;

          //otherwise count thumbnail
          picsPosted++;
        }
        break;
    }

    return picsPosted;
  }

  console.log("######PICS POSTED");
  console.log(picsPosted);
};

export const extractVidsPosted = async (inputArray) => {
  let vidsPosted = 0;

  for (let i = 0; i < inputArray.length; i++) {
    const { type, uploadMediaData } = inputArray[i];
    if (type !== "vids" || !uploadMediaData) continue;

    for (let j = 0; j < uploadMediaData.length; j++) {
      const vidItem = uploadMediaData[j];
      if (!vidItem || !vidItem.tgUploadId) continue;

      //otherwise count vid as uploaded
      vidsPosted++;
    }
  }

  return vidsPosted;
};
