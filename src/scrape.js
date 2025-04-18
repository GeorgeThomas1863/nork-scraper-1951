import KCNA from "../models/kcna-model.js";

export const scrapeNewKCNA = async () => {
    // const listPageModel = new KCNA{}
  const listPageHTML = await getListPageHTML("articleListURL");
};

export const getListPageHTML = async (type) => {
  if (!type) return null;

  const listPageModel = new KCNA({ url: CONFIG[type] });
  const listPageHTML = await listPageModel.getHTML();
 
  console.log("AHHHHHHHHHHH");
  console.log(listPageHTML);
};
