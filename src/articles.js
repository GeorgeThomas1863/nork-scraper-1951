import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import Article from "../models/article-model.js";
import UTIL from "../models/util-model.js";
import dbModel from "../models/db-model.js";

//FIX MODELS

/**
 * Extracts articleListPage data items, sorts / normalizes them, then stores them
 * @function buildArticleList
 * @returns {array} ARRAY of sorted OBJECTs (for tracking)
 */
export const buildArticleList = async (html) => {
  // Parse the HTML using JSDOM
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find the element with class "article-link"
  const articleLinkElement = document.querySelector(".article-link");

  //if no article links (shouldnt happen)
  if (!articleLinkElement) return null;

  // get array of article list (from link elements)
  const linkElementArray = articleLinkElement.querySelectorAll("a");
  const parseModel = new Article({ inputArray: linkElementArray });
  const articleListArray = await parseModel.getArticleListArray();
  console.log("GOT " + articleListArray.length + " ARTICLES");

  //sort the array
  const sortModel = new UTIL({ inputArray: articleListArray });
  const articleListSort = await sortModel.sortArrayByDate();

  //add article ID
  const idModel = new UTIL({ inputArray: articleListSort });
  const articleListNormal = await idModel.addArticleId(CONFIG.articleList, "articleId");

  const storeDataModel = new dbModel(articleListNormal, CONFIG.articleList);
  await storeDataModel.storeArray();
  // console.log(storeData);

  //for tracking
  return articleListNormal;
};

/**
 * GETs and buils array of NEW articleObjs by looping through download array (which ONLY contains new items)
 * @function buildArticleContent
 * @returns array of articleObjs (for tracking)
 */
export const buildArticleContent = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  // console.log("ARTICLE CONTENT ARRAY");
  // console.log(inputArray);

  //loop (dont check if stored since inputArray based on mongo compare earlier)
  const articleObjArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const inputObj = inputArray[i];
      const articleObjModel = new Article({ inputObj: inputObj });
      const articleObj = await articleObjModel.getArticleObj();
      if (!articleObj) return null;

      articleObjArray.push(articleObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return articleObjArray;
};
