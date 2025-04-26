// import CONFIG from "../config/scrape-config.js";
// import KCNA from "../models/kcna-model.js";
// import dbModel from "../models/db-model.js";

// import { uploadNewArticlesTG } from "./articles.js";
// import { uploadNewPicSetsTG } from "./pics.js";
// import { uploadNewVidsTG } from "./vids.js";

// import { newListMap, newContentMap, findNewMediaMap, downloadNewMediaMap, newUploadMap } from "../config/map.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeNewKCNA = async () => {
  console.log("STARTING NEW KCNA SCRAPE AT " + new Date());

  const urlData = await scrapeNewURLs();
  console.log(urlData);

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  return;
};

//------------------

//UPLOAD SHIT SECTION

//---------------------

//---------------

//NEW CONTENT SECTION

//------------

//NEW MEDIA SECTION

//----------------------------------
