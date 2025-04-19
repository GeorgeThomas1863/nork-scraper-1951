import CONFIG from "../config/scrape-config.js";
import Article from "./article-model.js";
import dbModel from "./db-model.js";

import { newListMap, newDownloadMap } from "../config/map.js";

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
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
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
    console.log("GETTING LIST DATA FOR " + newListParam + "s");
    const newListModel = new KCNA({ url: CONFIG[newListParam] });
    const newListHTML = await newListModel.getHTML();
    if (!newListHTML) return "FETCH FUCKED";
    //figure out a map obj here

    switch (type) {
      case "article":
        const articleListModel = new Article(newListHTML);
        const articleListArray = await articleListModel.parseArticleList();
        console.log(articleListArray);
        return articleListArray;
    }
  }

  //WILL HAVE GET NEW PAGE ARRAY HERE

  //MOVE TO UTIL
  async getNewObjArray() {
    const type = this.dataObject;
    const newDataParams = await newDownloadMap(type);
    const downloadModel = new dbModel(newDataParams);
    const downloadArray = await downloadModel.findNewURLs();

    switch (type) {
      case "article":
        const articleObjModel = new Article(downloadArray);
        const articleObjArray = await articleObjModel.buildArticleObjArray();
        return articleObjArray;
    }
  }
}

export default KCNA;
