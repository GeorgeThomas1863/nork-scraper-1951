import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

import Article from "../models/article-model.js";
import UTIL from "../models/util-model.js";
import dbModel from "../models/db-model.js";

import { articleTypeMap } from "../config/map.js";

export const buildArticleListByType = async (inputHTML) => {
  const { articleTypeArr } = CONFIG;

  const articleListTypeArray = [];
  for (let i = 0; i < articleTypeArr.length; i++) {
    const articleType = articleTypeArr[i];
    const articleListHTML = await getArticleListHTML(articleType, inputHTML);
    const articleListTypeData = await buildArticleList(articleListHTML, articleType);
    if (!articleListTypeData) continue;

    articleListTypeArray.push(articleListTypeData);
  }

  return articleListTypeArray;
};

export const getArticleListHTML = async (articleType, inputHTML) => {
  if (articleType === "fatboy") return inputHTML;

  //otherwise get html by type
  const articleListURL = await articleTypeMap(articleType);

  const htmlModel = new KCNA({ url: articleListURL });
  const articleListHTML = await htmlModel.getHTML();

  return articleListHTML;
};

/**
 * Extracts articleListPage data items, sorts / normalizes them, then stores them
 * @function buildArticleList
 * @returns {array} ARRAY of sorted OBJECTs (for tracking)
 */
export const buildArticleList = async (inputHTML, articleType) => {
  try {
    //build inputObj
    const inputObj = {
      html: inputHTML,
      type: articleType,
    };

    const articleListModel = new Article(inputObj);
    const articleListArray = await articleListModel.getArticleListArray();
    console.log("GOT " + articleListArray.length + " ARTICLES");

    //sort the array
    const sortModel = new UTIL({ inputArray: articleListArray });
    const articleListSort = await sortModel.sortArrayByDate();

    //add article ID
    const idModel = new UTIL({ inputArray: articleListSort });
    const articleListNormal = await idModel.addListId(CONFIG.articleList, "articleId");

    //store the sorted array
    const storeDataModel = new dbModel(articleListNormal, CONFIG.articleList);
    await storeDataModel.storeArray();

    //for tracking
    return articleListNormal;
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }
};

/**
 * GETs and builds array of NEW articleObjs by looping through download array (which ONLY contains new items)
 * @function buildArticleContent
 * @params downloadArray (new articles to download)
 * @returns array of articleObjs (for tracking)
 */
export const buildArticleContent = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  //loop (dont check if stored since inputArray based on mongo compare earlier)
  const articleObjArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const articleObjModel = new Article({ inputObj: inputArray[i] });
      const articleObj = await articleObjModel.getArticleObj();
      if (!articleObj) return null;

      articleObjArray.push(articleObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return articleObjArray;
};

//---------------------

//UPLOAD SHIT

export const uploadNewArticlesTG = async (inputArray) => {
  //null check and sort shouldnt be necessary, doing for redundancy
  if (!inputArray || !inputArray.length) return null;
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByDate();

  //upload the array
  const uploadModel = new Article({ inputArray: sortArray });
  const uploadArticleData = await uploadModel.postArticleArrayTG();

  return uploadArticleData;
};
