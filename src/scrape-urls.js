import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { newListMap, newContentMap } from "../config/map.js";

export const scrapeNewURLs = async () => {
  const { typeArr } = CONFIG;
  //loop through types for content data
  for (let i = 0; i < typeArr.length; i++) {
    const type = typeArr[i];
    await getNewListData(type);
    await getNewContentData(type);
  }

  return "DONE GETTING NEW URLs";
};

export const getNewListData = async (type) => {
  const newListInputObj = await newListMap(type);
  const listModel = new KCNA({ url: CONFIG[newListInputObj.param] });
  const newListHTML = await listModel.getHTML();

  //extract list array from html (based on type using map.func)
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const listArray = await newListInputObj.func(newListHTML);
  console.log("FOUND " + listArray?.length + " " + type.toUpperCase());

  return listArray;
};

export const getNewContentData = async (type) => {
  //map obj, new content for scraping
  const newContentInputObj = await newContentMap(type);
  const contentModel = new dbModel(newContentInputObj.params, "");
  const downloadArray = await contentModel.findNewURLs();

  if (!downloadArray || !downloadArray.length) {
    console.log("NO NEW " + type.toUpperCase());
    return null;
  }

  //scrape new content (based on type using map.func)
  console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
  const contentArray = await newContentInputObj.func(downloadArray);
  console.log("GOT CONTENT FOR " + contentArray?.length + " " + type.toUpperCase());

  return contentArray;
};
