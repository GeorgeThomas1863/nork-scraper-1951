import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-status.js";
import { newListMap, newContentMap } from "../config/map.js";

export const scrapeNewURLs = async (scrapeId) => {
  //get list array data
  const newListArray = await getNewListArray();
  await logData(newListArray, scrapeId, "listArray");
  if (!continueScrape) return newListArray;

  //get content array data
  const newContentArray = await getNewContentArray();
  await logData(newListArray, scrapeId, "contentArray");

  return newContentArray;
};

export const getNewListArray = async () => {
  const { typeArr } = CONFIG;

  const newListArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    //stop if needed
    if (!continueScrape) return newListArray;
    const type = typeArr[i];
    const newListData = await getNewListData(type);
    if (!newListData) continue;

    const newListObj = {
      newListData: newListData,
      type: type,
    };
    newListArray.push(newListObj);
  }

  return newListArray;
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

  const newContentArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    //stop if needed
    if (!continueScrape) return newContentArray;
    const type = typeArr[i];
    const newContentData = await getNewContentData(type);
    if (!newContentData) continue;
    const newContentObj = {
      newContentData: newContentData,
      type: type,
    };

    newContentArray.push(newContentObj);
  }

  return newContentArray;
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
