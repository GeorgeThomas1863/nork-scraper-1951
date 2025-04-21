import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

// import { buildArticleList, buildArticleContent } from "./articles.js";
// import { buildPicSetList, buildPicSetContent } from "./pics.js";
// import

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
    const scrapeData = await scrapeItem(type);
    console.log(scrapeData);
  }
  return "FINISHED GETTING NEW CONTENT";
};

export const scrapeItem = async (type) => {
  const dataModel = new KCNA(type);
  const type = typeArr[i];

  //data list
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const newListArray = await dataModel.getNewListData();
  console.log(newListArray);

  //content [combine with media?]
  console.log("GETTING NEW CONTENT FOR " + type.toUpperCase());
  const newContentArray = await dataModel.getNewContentData();
  console.log(newContentArray);

  //media
  console.log("GETTING NEW MEDIA FOR " + type.toUpperCase());
  const newMediaArray = await dataModel.getNewMediaData();
  console.log(newMediaArray);

  //download
  console.log("DOWNLOADING NEW MEDIA FOR " + type.toUpperCase());
  const downloadData = await dataModel.downloadNewMedia();

  return newListArray.length;
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
