import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { newListMap, newContentMap, newMediaMap, downloadMediaMap, newUploadMap } from "../config/map.js";

import { buildArticleList, buildArticleContent, uploadNewArticlesTG } from "./articles.js";
import { buildPicSetList, buildPicSetContent, getPicDataArray, downloadNewPicsFS, uploadNewPicSetsTG } from "./pics.js";
import { buildVidList, buildVidPageContent, getVidDataArray, downloadNewVidsFS, uploadNewVidsTG } from "./vids.js";

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
    const scrapeData = await scrapeNewContent(type);
    console.log(scrapeData);
  }

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  //UPLOAD
  const uploadData = await uploadNewTG();
  console.log(uploadData);

  return;
};

//MIGHT WANT TO MAKE FUNCTIONS BELOW A PART OF KCNA MODEL (GET WORKING BEFORE DESTROYING AGAIN)

//scrape new content
export const scrapeNewContent = async (type) => {
  //get map obj, new list html
  const newListInputObj = await newListMap(type);
  const listModel = new KCNA({ url: CONFIG[newListInputObj.param] });
  const newListHTML = await listModel.getHTML();

  //extract list array from html (based on type using map.func)
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const listArray = await newListInputObj.func(newListHTML);
  console.log("FOUND " + listArray.length + " " + type.toUpperCase());

  //map obj, new content for scraping
  const newContentInputObj = await newContentMap(type);
  const contentModel = new dbModel(newContentInputObj.params, "");
  const downloadArray = await contentModel.getContentToDownloadArray();

  //scrape new content (based on type using map.func)
  console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
  const contentArray = await newContentInputObj.func(downloadArray);
  console.log("GOT CONTENT FOR " + contentArray.length + " " + type.toUpperCase());

  const returnObj = {
    listItems: listArray?.length,
    contentItems: contentArray?.length,
  };

  const textStr = "FOUND " + returnObj.listItems + " " + type.toUpperCase() + " LIST ITEMS; GOT " + returnObj.pageItems + " " + type.toUpperCase() + " OBJECTS";
  console.log(textStr);

  return returnObj;

  //run shit

  // switch (type) {
  //   case "articles":
  //
  //     listArray = await buildArticleList(newListHTML);
  //     break;

  //   case "pics":
  //     console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  //     listArray = await buildPicSetList(newListHTML);
  //     break;

  //   case "vids":
  //     console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  //     listArray = await buildVidList(newListHTML);
  //     break;
  // }

  // const contentModel = new KCNA({ type: type });
  // const downloadArray = await contentModel.getContentToDownloadArray();
  // let pageArray = [];

  // switch (type) {
  //   case "articles":
  //
  //     pageArray = await buildArticleContent(downloadArray);
  //     break;

  //   case "pics":
  //     console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
  //     pageArray = await buildPicSetContent(downloadArray);
  //     break;

  //   case "vids":
  //     console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
  //     pageArray = await buildVidPageContent(downloadArray);
  //     break;
  // }
};

//------------------

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  await scrapeNewPicData();
  await scrapeNewVidData();

  //download shit
  await downloadNewPicsFS();
  await downloadNewVidsFS();
  console.log("FINISHED GETTING NEW MEDIA DATA");
};

//GET NEW MEDIA URLS section
export const scrapeNewPicData = async () => {
  const picModel = new KCNA({ type: "pics" });
  const picArray = await picModel.getMediaToDownloadArray();
  if (!picArray || !picArray.length) return null;

  console.log("GETTING DATA FOR " + picArray?.length + " PICS");
  const picData = await getPicDataArray(picArray);
  console.log("FOUND " + picData?.length + " PICS");

  return picData;
};

export const scrapeNewVidData = async () => {
  const vidModel = new KCNA({ type: "vids" });
  const vidArray = await vidModel.getMediaToDownloadArray();
  if (!vidArray || !vidArray.length) return null;

  console.log("GETTING DATA FOR " + vidArray?.length + " VIDS");
  const vidData = await getVidDataArray(vidArray);
  console.log("FOUND " + vidData?.length + " VIDS");

  return vidData;
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

// /**
//  * get NEWEST LIST PAGE data [predefined PAGE with urls for articles, pics, vids]
//  * @function getNewListData
//  * @returns arrray of listObjs (item url / date / id etc)
//  */
// export const getNewListData = async (type) => {
//   //get html
//   const dataModel = new KCNA({ type: type });
//   const newListHTML = await dataModel.getNewListHTML();
//   const downloadArray = await dataModel.getContentToDownloadArray();
//   if (!newListHTML) return null;
//   // console.log(newListHTML);

//   switch (type) {
//     case "articles":
//       const articleListArray = await buildArticleList(newListHTML);
//       const articleObjArray = await buildArticleContent(downloadArray);
//       return articleObjArray;

//     case "pics":
//       const picSetListArray = await buildPicSetList(newListHTML);
//       // console.log(picSetListArray);
//       return picSetListArray;

//     case "vids":
//       const vidListArray = await buildVidList(newListHTML);
//       // console.log(vidListArray);
//       return vidListArray;
//   }
// };

// /**
//  * Gets new obj Items for each data type (article, picSet, vid), returns as array (for tracking)
//  * @function getNewObjArray
//  * @returns array of objs for tracking
//  */
// export const getNewContentData = async (type) => {
//   console.log("GETTING CONTENT FOR " + type.toUpperCase());
//   const downloadModel = new KCNA({ type: type });
//   const downloadArray = await downloadModel.getContentToDownloadArray();

//   //return on null
//   if (!downloadArray || !downloadArray.length) return "NOTHING NEW TO DOWNLOAD";

//   //otherwise pass to each item model to parse
//   switch (type) {
//     case "articles":
//       const articleObjArray = await buildArticleContent(downloadArray);
//       return articleObjArray;

//     case "pics":
//       const picSetPageArray = await buildPicSetContent(downloadArray);
//       return picSetPageArray;

//     case "vids":
//       const vidObjArray = await buildVidPageContent(downloadArray);
//       return vidObjArray;
//   }
// };

// export const scrapeNewMediaData = async () => {
//   //get pic data

//   //runs pics and vids
//   for (let i = 1; i < typeArr.length; i++) {
//     try {
//       const type = typeArr[i];
//       const downloadModel = new KCNA({ type: type });
//       const downloadArray = await downloadModel.getMediaToDownloadArray();

//       switch (type) {
//         case "pics":
//           console.log("GETTING DATA FOR " + downloadArray?.length + " PICS");
//           const picData = await getPicDataArray(downloadArray);
//           console.log("FOUND " + picData?.length + " PICS");
//           break;

//         case "vids":
//           console.log("GETTING DATA FOR " + downloadArray?.length + " VIDS");
//           const vidData = await getVidDataArray(downloadArray);
//           console.log("FOUND " + vidData?.length + " VIDS");
//           break;
//       }
//     } catch (e) {
//       console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
//     }
//   }

//   return "FINISHED FINDING NEW MEDIA";
// };

// export const downloadNewMedia = async () => {
//   const { typeArr } = CONFIG;

//   //runs pics and vids
//   for (let i = 1; i < typeArr.length; i++) {
//     try {
//       const type = typeArr[i];
//       const downloadModel = new KCNA({ type: type });
//       const downloadArray = await downloadModel.getMediaToScrapeFS();

//       switch (type) {
//         case "pics":
//           console.log("DOWNLOADING " + downloadArray?.length + " FUCKING PICS");
//           const picData = await downloadNewPics(downloadArray);
//           console.log("DOWNLOADED " + picData?.length + " PICS");
//           break;

//         case "vids":
//           console.log(downloadArray?.length + " VIDS STILL NEED TO BE DOWNLOADED");
//           const vidData = await downloadNewVids(downloadArray);
//           console.log("FOUND " + vidData?.length + " VIDS");
//           break;
//       }
//     } catch (e) {
//       console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
//     }
//   }

//   return "FINISHED DOWNLOADING NEW MEDIA";
// };
