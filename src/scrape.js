import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */
export const scrapeKCNA = async () => {
  const { typeArr } = CONFIG;

  //loop through types
  for (let i = 0; i < typeArr.length; i++) {
    const dataModel = new KCNA(typeArr[i]);
    console.log("GETTING LIST DATA FOR " + type.toUpperCase());
    const newListArray = await dataModel.getNewListData();
    console.log(newListArray);

    console.log("GETTING NEW CONTENT FOR " + type.toUpperCase());
    const newContentArray = await dataModel.getNewContentData();
    console.log(newContentArray);
  }

  //get pic / vid media (articles index 0)
  for (let i = 1; i < typeArr.length; i++) {
    const dataModel = new KCNA(typeArr[i]);
    console.log("GETTING NEW MEDIA FOR " + type.toUpperCase());
    const newMediaArray = await dataModel.getNewMediaData();
    console.log(newMediaArray);
  }

  console.log("FINSIHED FUCKER");
};
