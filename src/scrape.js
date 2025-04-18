import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

export const scrapeKCNA = async () => {
  //loop through types
  // for (let i = 0; i<CONFIG.typeArr; i++){
  //below for testing
  for (let i = 0; i < 1; i++) {
    const type = CONFIG.typeArr[i];
    const dataModel = new KCNA(type);
    const newListArray = await dataModel.getNewListArray();
    console.log(newListArray);

    //getNewPageArray (for pics / vids)

    const itemObjArray = await dataModel.getNewItemArray();
  }
};

// export const getListPageHTML = async (type) => {
//   if (!type) return null;

//   const listPageModel = new KCNA({ url: CONFIG[type] });
//   const listPageHTML = await listPageModel.getHTML();

//   console.log("AHHHHHHHHHHH");
//   console.log(listPageHTML);
// };
