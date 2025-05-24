import CONFIG from "../config/config.js";

import Article from "../models/article-model.js";
import UTIL from "../models/util-model.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-util.js";

//ARTICLE LIST SECTION

export const buildArticleListByType = async (inputHTML) => {
  const { articleTypeArr } = CONFIG;

  const articleListTypeArray = [];
  for (let i = 0; i < articleTypeArr.length; i++) {
    try {
      //stop if needed
      if (!continueScrape) return articleListTypeArray;

      const articleType = articleTypeArr[i];
      const articleListTypeModel = new Article({ type: articleType, html: inputHTML });
      const articleListTypeHTML = await articleListTypeModel.getArticleListTypeHTML();

      const articleListTypeData = await buildArticleList(articleListTypeHTML, articleType);
      if (!articleListTypeData) continue;

      //need spread operator to appropriately append (could also use concat)
      articleListTypeArray.push(...articleListTypeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return articleListTypeArray;
};

export const buildArticleList = async (inputHTML, articleType) => {
  //build inputObj
  const inputObj = {
    html: inputHTML,
    type: articleType,
  };

  const articleListModel = new Article(inputObj);
  const articleListArray = await articleListModel.getArticleListArray();
  console.log("GOT " + articleListArray.length + " NEW ARTICLES");

  //sort the array
  const sortModel = new UTIL({ inputArray: articleListArray });
  const articleListSort = await sortModel.sortArrayByDate();

  //add article ID
  const idModel = new UTIL({ inputArray: articleListSort, inputType: "articleId" });
  const articleListNormal = await idModel.addListId();

  //store the sorted array
  try {
    const storeDataModel = new dbModel(articleListNormal, CONFIG.articleList);
    await storeDataModel.storeArray();
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }

  return articleListNormal;
};

//---------------

//Article content

export const buildArticleContent = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  //loop (dont check if stored since inputArray based on mongo compare earlier)
  const articleObjArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //stop if needed
    if (!continueScrape) return articleObjArray;
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
export const uploadArticleArrayTG = async (inputArray) => {
  //null check and sort shouldnt be necessary, doing for redundancy
  if (!inputArray || !inputArray.length) return null;
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByArticleId();

  const uploadDataArray = [];
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!continueScrape) return uploadDataArray;
    try {
      const inputObj = sortArray[i];
      const uploadModel = new Article({ inputObj: inputObj });
      const uploadArticleData = await uploadModel.postArticleObjTG();
      if (!uploadArticleData || !uploadArticleData.length) continue;

      //Build store obj (just store object for first text chunk)
      const storeObj = { ...inputObj, ...uploadArticleData[0] };
      storeObj.textChunks = uploadArticleData.length;

      //store data
      const storeModel = new dbModel(storeObj, CONFIG.articlesUploaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);

      uploadDataArray.push(storeObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      // console.log(e);
    }
  }

  return uploadDataArray;
};
