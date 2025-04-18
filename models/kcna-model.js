import CONFIG from "../config/scrape-config.js";
import Article from "./article-model.js";
import dbModel from "./db-model.js";

import { listPageMap, newDownloadMap } from "../config/map.js";

/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class KCNA {
  /**
   * @constructor
   * @param {Object} dataObject - The data object with request parameters
   */
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Fetches HTML content from the specified URL (works for any url), returns as text
   * @function getHTML
   * @returns {Promise<string>} The HTML content as text
   * @throws {Error} Logs the error to console if the request fails
   */
  async getHTML() {
    try {
      const res = await fetch(this.dataObject.url);
      // console.log(res);
      const data = await res.text();
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * get LATEST list page data [predefined locations where urls for items]
   * @function getNewListArray
   * @returns arrray of listObjs (item url / date)
   */ 
  async getNewListArray() {
    //get html
    const type = this.dataObject;
    const newListParam = await newListMap(type);
    const newListModel = new KCNA({ url: CONFIG[newListParam] });
    const newListHTML = await newListModel.getHTML();

    //figure out a map obj here

    switch (type) {
      case "article":
        const articleModel = new Article(newListHTML);
        const articleListArray = await articleModel.parseArticleList();
        console.log(articleListArray);
        break
    }
  }

  //WILL HAVE GET NEW PAGE ARRAY HERE

  //MOVE TO UTIL
  async getNewItemArray() {
    const type = this.dataObject
    const newDataParams = await newDownloadMap(type);
    const downloadModel = new dbModel(newDataParams);
    const downloadArray = await downloadModel.findNewURLs();
    console.log("!!!HERE");
    console.log(downloadArray[0]);
  }
}

export default KCNA;
