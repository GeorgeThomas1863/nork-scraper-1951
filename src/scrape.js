import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

export const scrapeNewKCNA = async () => {
  //loop through types
  // for (let i = 0; i<CONFIG.typeArr; i++){
  //below for testing
  for (let i = 0; i < 1; i++) {
    const type = CONFIG.typeArr[i];
    const listPageModel = new KCNA({ url: CONFIG[type] });
    const listPageArray = await listPageModel.getListPageArray();
  }
};

// export const getListPageHTML = async (type) => {
//   if (!type) return null;

//   const listPageModel = new KCNA({ url: CONFIG[type] });
//   const listPageHTML = await listPageModel.getHTML();

//   console.log("AHHHHHHHHHHH");
//   console.log(listPageHTML);
// };
