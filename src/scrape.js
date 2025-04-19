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
  for (let i = 0; i < typeArr; i++) {
    const dataType = typeArr[i];
    const newDataKCNA = await getNewDataKCNA(dataType);

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
export const getNewDataKCNA = async (dataType) => {
  console.log("AHHHHHHHHH");
  console.log(dataType);
  console.log("STARTING SCRAPE OF " + dataType.toUpperCase() + "S");
  const dataModel = new KCNA(dataType);
  const newListArray = await dataModel.getNewListArray();
  console.log(newListArray);

  //getNewPageArray (for pics / vids)

  console.log("GETTING OBJECTS FOR " + dataType.toUpperCase() + "S");
  const newObjArray = await dataModel.getNewObjArray();
  return newObjArray;
};
