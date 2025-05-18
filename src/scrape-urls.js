import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-util.js";
import { newListMap, newContentMap } from "../config/map-scrape.js";
// import { logData } from "./scrape-log.js";

export const scrapeNewURLs = async () => {
  if (!continueScrape) return null;

  //get list array data
  await getNewListArray();
  if (!continueScrape) return null;

  //get content array data
  await getNewContentArray();
  if (!continueScrape) return null;

  return true;
};

export const getNewListArray = async () => {
  const { typeArr } = CONFIG;

  for (let i = 0; i < typeArr.length; i++) {
    //try in case url connection fails
    try {
      //stop if needed
      if (!continueScrape) return null;
      const type = typeArr[i];
      //could add return to an array but dont care
      await getNewListData(type);
      console.log("!!!!TYPE: " + type);
    } catch (e) {
      console.log(e.message + "; F BREAK: getNewListArray; SITE CONNECTION PROB FUCKED");
    }
  }
  return true;
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

//-------------

export const getNewContentArray = async () => {
  const { typeArr } = CONFIG;

  for (let i = 0; i < typeArr.length; i++) {
    try {
      //stop if needed
      if (!continueScrape) return null;
      const type = typeArr[i];
      //could add return to an array but dont care
      await getNewContentData(type);
    } catch (e) {
      console.log(e.message + "; F BREAK: getNewContentArray; SITE CONNECTION PROB FUCKED");
    }
  }

  return true;
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
