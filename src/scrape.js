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
    const type = typeArr[i];
    const newDataKCNA = await getNewDataKCNA(type);

    console.log(newDataKCNA);
    console.log("FINSIHED FUCKER");
  }
};

/**
 * Gets new data from KCNA based on input type (article, picSet, vid)
 * @function getNewDataKCNA
 * @param {} type (article, picSet, vid)
 * @returns array of finished data for tracking
 */
export const getNewDataKCNA = async (type) => {
  console.log("STARTING SCRAPE OF " + type.toUpperCase());
  const dataModel = new KCNA(type);
  const newListArray = await dataModel.getNewListArray();
  console.log(newListArray);

  console.log("GETTING OBJECTS FOR " + type.toUpperCase());
  const newObjArray = await dataModel.getNewObjArray();
  return newObjArray;
};
