import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

import { buildArticleList, buildArticleContent } from "./articles.js";
import { buildPicSetList, buildPicSetContent, getPicDataArray, downloadNewPics } from "./pics.js";
import { buildVidList, buildVidPageContent, getVidDataArray, downloadNewVids } from "./vids.js";

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
    // console.log(scrapeData);
  }
  return "FINISHED SCRAPING NEW DATA";
};

export const scrapeEach = async (type) => {
  //data list
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const newListArray = await getNewListData(type);
  console.log(newListArray);

  //new article items / media pages
  const newContentArray = await getNewContentData(type);
  console.log(newContentArray);

  //new media items
  const newMediaArray = await getNewMediaData(type);
  console.log(newMediaArray);

  //download new media
  const downloadData = await downloadNewMedia(type);
  console.log(downloadData);

  return newListArray.length;
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

//GET NEW MEDIA URLS section

export const getNewMediaData = async (type) => {
  if (type === "articles") return null;
  console.log("GETTING MEDIA DATA FOR " + type.toUpperCase());
  const downloadModel = new KCNA({ type: type });
  const downloadArray = await downloadModel.getMediaToDownloadArray();

  switch (type) {
    case "pics":
      const picData = await getPicDataArray(downloadArray);
      return picData;

    case "vids":
      const vidData = await getVidDataArray(downloadArray);
      return vidData;
  }
};

//DOWNLOAD SHIT
export const downloadNewMedia = async (type) => {
  if (type === "articles") return null;

  console.log("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
  console.log("DOWNLOADING FUCKING" + type.toUpperCase());
  const downloadModel = new KCNA({ type: type });
  const downloadArray = await downloadModel.getMediaToScrapeFS();

  switch (type) {
    case "pics":
      const downloadPicData = await downloadNewPics(downloadArray);
      return downloadPicData;

    case "vids":
      const downloadVidData = await downloadNewVids(downloadArray);
      return downloadVidData;
  }
};
