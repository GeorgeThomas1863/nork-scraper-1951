import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

import { buildArticleList, buildArticleContent } from "./articles.js";
import { buildPicSetList, buildPicSetContent, getPicDataArray } from "./pics.js";
import { buildVidList, buildVidPageContent, getVidDataArray } from "./vids.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeKCNA = async () => {
  const { typeArr } = CONFIG;

  //loop through types
  for (let i = 0; i < typeArr.length; i++) {
    const type = typeArr[i];
    const scrapeData = await scrapeEach(type);
    console.log(scrapeData);
  }
  return "FINISHED SCRAPING NEW DATA";
};

export const scrapeEach = async (type) => {
  //data list
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const newListArray = await getNewListData(type);
  console.log(newListArray);

  //content [combine with media?]
  console.log("GETTING NEW CONTENT FOR " + type.toUpperCase());
  const newContentArray = await getNewContentData(type);
  console.log(newContentArray);

  //media
  console.log("GETTING NEW MEDIA FOR " + type.toUpperCase());
  const newMediaArray = await getNewMediaData(type);
  console.log(newMediaArray);

  //download [MIGHT MOVE UP ONE LEVEL]
  console.log("DOWNLOADING NEW MEDIA FOR " + type.toUpperCase());
  const downloadData = await downloadNewMedia(type);
  console.log(downloadData);

  return newListArray.length;
};

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
  console.log(newListHTML);

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
  // console.log("GETTING OBJECT DATA FOR " + type.toUpperCase());
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

//GET NEW MEDIA URLS section

export const getNewMediaData = async (type) => {
  if (type === "articles") return null;
  console.log("GETTING MEDIA FOR " + type.toUpperCase());
  const downloadModel = new KCNA({ type: type });
  const downloadArray = await downloadModel.getMediaToDownloadArray();

  switch (type) {
    case "articles":
      return null;

    case "pics":
      const picData = await getPicDataArray(downloadArray);
      return picData;

    case "vids":
      const vidData = await getVidDataArray(downloadArray);
      return vidData;
  }
};

//download new shit
export const downloadNewMedia = async (type) => {
  console.log("FUCKING BUILD");
};

// export const scrapeKCNA = async () => {
//   const newContentKCNA = await getNewContentKCNA();
//   console.log(newContentKCNA);
//   const newMediaKCNA = await getNewMediaKCNA();
//   console.log(newMediaKCNA);

//   console.log("FINSIHED FUCKER");
// };

// export const getNewMediaKCNA = async () => {
//   const { typeArr } = CONFIG;

//   //get pic / vid media (articles index 0)
//   for (let i = 1; i < typeArr.length; i++) {
//     const type = typeArr[i];
//     console.log("GETTING NEW MEDIA FOR " + type.toUpperCase());

//     const dataModel = new KCNA(type);
//     const newMediaArray = await dataModel.getNewMediaData();
//     console.log(newMediaArray);

//     console.log("DOWNLOADING NEW MEDIA FOR " + type.toUpperCase());
//     const downloadData = await dataModel.downloadNewMedia();
//     console.log(downloadData);
//   }

//   return "FINISHED GETTING NEW MEDIA";
// };

// export const getNewContentKCNA = async () => {
//   const { typeArr } = CONFIG;

//   //loop through types
//   for (let i = 0; i < typeArr.length; i++) {
//     const type = typeArr[i];
//     console.log("GETTING LIST DATA FOR " + type.toUpperCase());

//     const dataModel = new KCNA(type);
//     const newListArray = await dataModel.getNewListData();
//     if (!newListArray) continue;

//     console.log("GETTING NEW CONTENT FOR " + type.toUpperCase());
//     const newContentArray = await dataModel.getNewContentData();
//     console.log(newContentArray);
//   }
//   return "FINISHED GETTING NEW CONTENT";
// };
