import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-stop.js";
import { newListMap, newContentMap } from "../config/map.js";

export const scrapeNewURLs = async () => {
  const { typeArr } = CONFIG;

  //loop through types for content data
  const urlDataArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    //stop if needed
    if (!continueScrape) return null;
    const type = typeArr[i];
    const newListData = await getNewListData(type);
    const newContentData = await getNewContentData(type);

    //return data stats
    const urlDataObj = {
      type: type,
      newListData: newListData,
      newContentData: newContentData,
    };
    if (!urlDataObj) continue;

    urlDataArray.push(urlDataObj);
  }

  return urlDataArray;
};

export const getNewListData = async (type) => {
  const newListInputObj = await newListMap(type);
  const listModel = new KCNA({ url: CONFIG[newListInputObj.param] });
  const newListHTML = await listModel.getHTML();

  //extract list array from html (based on type using map.func)
  console.log("GETTING LIST DATA FOR " + type.toUpperCase());
  const listArray = await newListInputObj.func(newListHTML);

  if (!listArray || !listArray.length) {
    console.log("FOUND 0 NEW " + type.toUpperCase());
    return null;
  }

  console.log("FOUND " + listArray?.length + " " + type.toUpperCase());

  return listArray;
};

export const getNewContentData = async (type) => {
  //map obj, new content for scraping
  const newContentInputObj = await newContentMap(type);
  const contentModel = new dbModel(newContentInputObj.params, "");
  const downloadArray = await contentModel.findNewURLs();

  //scrape new content (based on type using map.func)
  console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
  const contentArray = await newContentInputObj.func(downloadArray);
  if (!contentArray || !contentArray.length) return null;

  console.log("GOT CONTENT FOR " + contentArray.length + " " + type.toUpperCase());

  return contentArray;
};
