import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";
// import dbModel from "../models/db-model.js";

import { uploadNewArticlesTG } from "./articles.js";
import { uploadNewPicSetsTG } from "./pics.js";
import { uploadNewVidsTG } from "./vids.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeKCNA = async () => {
  const { typeArr } = CONFIG;
  console.log("STARTING NEW KCNA SCRAPE AT " + new Date());

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

//---------------

//GET URLs / DOWNLOAD SHIT SECTION

//scrape new content
export const scrapeNewContent = async (type) => {
  const listModel = new KCNA({ type: type });
  const listArray = await listModel.getNewListData();

  const contentModel = new KCNA({ type: type });
  const contentArray = await contentModel.getNewContentData();

  const returnObj = {
    listItems: listArray?.length,
    contentItems: contentArray?.length,
  };

  const textStr = "FOUND " + returnObj.listItems + " " + type.toUpperCase() + " LIST ITEMS; GOT " + returnObj.pageItems + " " + type.toUpperCase() + " OBJECTS";
  console.log(textStr);

  return returnObj;
};

//NEW MEDIA SECTION (URLS AND DOWNLOAD)
export const scrapeNewMedia = async () => {
  const { typeArr } = CONFIG;

  //retarded loop for getting new media data (start at 1 bc 0 is articles)
  for (let i = 1; i < typeArr.length; i++) {
    const findType = typeArr[i];
    if (findType === "articles") continue;
    const newMediaModel = new KCNA({ type: findType });
    await newMediaModel.getNewMediaData();
  }

  //retarded loop for downloading shit
  for (let i = 1; i < typeArr.length; i++) {
    const downloadType = typeArr[i];
    if (downloadType === "articles") continue;
    const downloadDataModel = new KCNA({ type: downloadType });
    await downloadDataModel.downloadNewMediaFS();
  }

  return "FINISHED GETTING NEW MEDIA DATA";
};

//------------------

//UPLOAD SHIT SECTION

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
