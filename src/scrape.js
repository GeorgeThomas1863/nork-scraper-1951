import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

import { buildArticleList, buildArticleContent, uploadNewArticlesTG } from "./articles.js";
import { buildPicSetList, buildPicSetContent, getPicDataArray, downloadNewPics, uploadNewPicSetsTG } from "./pics.js";
import { buildVidList, buildVidPageContent, getVidDataArray, downloadNewVids, uploadNewVidsTG } from "./vids.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeKCNA = async () => {
  const { typeArr } = CONFIG;

  //loop through types for content data
  for (let i = 0; i < typeArr.length; i++) {
    const type = typeArr[i];
    const scrapeData = await scrapeEach(type);
    console.log(scrapeData);
  }

  //new media items, will check for / DOWNLOAD both
  await getNewMediaData();
  await downloadNewMedia();
  console.log("FINISHED GETTING NEW DATA");

  //UPLOAD
  const uploadData = await uploadNewTG();
  console.log(uploadData);

  return;
};

export const scrapeEach = async (type) => {
  //data list
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const newListArray = await getNewListData(type);
  console.log("FOUND " + newListArray?.length + " LIST ITEMS");

  //new article items / media pages
  const newContentArray = await getNewContentData(type);
  console.log("GOT CONTENT FOR " + newContentArray?.length + " " + type.toUpperCase());

  return newListArray;
};

//-------------------------

/**
 * get NEWEST LIST PAGE data [predefined PAGE with urls for articles, pics, vids]
 * @function getNewListData
 * @returns arrray of listObjs (item url / date / id etc)
 */
export const getNewListData = async (type) => {
  //get html
  const htmlModel = new KCNA({ type: type });
  const newListHTML = await htmlModel.getNewListHTML();
  if (!newListHTML) return null;
  // console.log(newListHTML);

  switch (type) {
    case "articles":
      const articleListArray = await buildArticleList(newListHTML);
      // console.log(articleListArray);
      return articleListArray;

    case "pics":
      const picSetListArray = await buildPicSetList(newListHTML);
      // console.log(picSetListArray);
      return picSetListArray;

    case "vids":
      const vidListArray = await buildVidList(newListHTML);
      // console.log(vidListArray);
      return vidListArray;
  }
};

/**
 * Gets new obj Items for each data type (article, picSet, vid), returns as array (for tracking)
 * @function getNewObjArray
 * @returns array of objs for tracking
 */
export const getNewContentData = async (type) => {
  console.log("GETTING CONTENT FOR " + type.toUpperCase());
  const downloadModel = new KCNA({ type: type });
  const downloadArray = await downloadModel.getContentToDownloadArray();

  //return on null
  if (!downloadArray || !downloadArray.length) return "NOTHING NEW TO DOWNLOAD";

  //otherwise pass to each item model to parse
  switch (type) {
    case "articles":
      const articleObjArray = await buildArticleContent(downloadArray);
      return articleObjArray;

    case "pics":
      const picSetPageArray = await buildPicSetContent(downloadArray);
      return picSetPageArray;

    case "vids":
      const vidObjArray = await buildVidPageContent(downloadArray);
      return vidObjArray;
  }
};

//------------------

//GET NEW MEDIA URLS section

export const getNewMediaData = async () => {
  const { typeArr } = CONFIG;

  //runs pics and vids
  for (let i = 1; i < typeArr.length; i++) {
    try {
      const type = typeArr[i];
      const downloadModel = new KCNA({ type: type });
      const downloadArray = await downloadModel.getMediaToDownloadArray();

      switch (type) {
        case "pics":
          console.log("GETTING DATA FOR " + downloadArray?.length + " PICS");
          const picData = await getPicDataArray(downloadArray);
          console.log("FOUND " + picData?.length + " PICS");
          break;

        case "vids":
          console.log("GETTING DATA FOR " + downloadArray?.length + " VIDS");
          const vidData = await getVidDataArray(downloadArray);
          console.log("FOUND " + vidData?.length + " VIDS");
          break;
      }
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return "FINISHED FINDING NEW MEDIA";
};

//DOWNLOAD SHIT
export const downloadNewMedia = async () => {
  const { typeArr } = CONFIG;

  //runs pics and vids
  for (let i = 1; i < typeArr.length; i++) {
    try {
      const type = typeArr[i];
      const downloadModel = new KCNA({ type: type });
      const downloadArray = await downloadModel.getMediaToScrapeFS();

      switch (type) {
        case "pics":
          console.log("DOWNLOADING " + downloadArray?.length + " FUCKING PICS");
          const picData = await downloadNewPics(downloadArray);
          console.log("DOWNLOADED " + picData?.length + " PICS");
          break;

        case "vids":
          console.log(downloadArray?.length + " VIDS STILL NEED TO BE DOWNLOADED");
          const vidData = await downloadNewVids(downloadArray);
          console.log("FOUND " + vidData?.length + " VIDS");
          break;
      }
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return "FINISHED DOWNLOADING NEW MEDIA";
};

//------------------

//UPLOAD SHIT
export const uploadNewTG = async () => {
  const { typeArr } = CONFIG;

  for (let i = 0; i < typeArr.length; i++) {
    try {
      const type = typeArr[i];
      const uploadModel = new KCNA({ type: type });
      const uploadArray = await uploadModel.getUploadArray();

      switch (type) {
        case "articles":
          console.log("UPLOADING " + uploadArray?.length + " NEW ARTICLES");
          const articleData = await uploadNewArticlesTG(uploadArray);
          console.log("UPLOADED " + articleData?.length + " NEW ARTICLES");
          break;

        case "pics":
          console.log("UPLOADING " + uploadArray?.length + " NEW PIC SETS");
          const picData = await uploadNewPicSetsTG(uploadArray);
          console.log("UPLOADED " + picData?.length + " NEW PICS SETS");
          break;

        case "vids":
          console.log("UPLOADING " + uploadArray?.length + " NEW VIDS");
          const vidData = await uploadNewVidsTG(uploadArray);
          console.log("UPLOADED " + vidData?.length + " NEW VIDS");
          break;
      }
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }
};
