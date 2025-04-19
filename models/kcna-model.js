import CONFIG from "../config/scrape-config.js";
import dbModel from "./db-model.js";

import Article from "./article-model.js";
import Pic from "./pic-model.js";
import Vid from "./vid-model.js";

import { newListMap, newDownloadMap } from "../config/map.js";

/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class KCNA {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Gets HTML content from the specified URL (works for any url), returns as text
   * @function getHTML
   * @returns  HTML content as text
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

  //----------------------

  //LIST PAGE

  /**
   * get NEWEST LIST PAGE data [predefined PAGE with urls for articles, pics, vids]
   * @function getNewListArray
   * @returns arrray of listObjs (item url / date / id etc)
   */
  async getNewListArray() {
    //get html
    const type = this.dataObject;
    console.log("GETTING LIST DATA FOR " + type.toUpperCase() + "S");
    const newListHTML = await this.getNewListHTML(type);
    if (!newListHTML) return "FETCH FUCKED";

    switch (type) {
      case "article":
        //pass to article model for parsing
        const articleListModel = new Article(newListHTML);
        const articleListArray = await articleListModel.parseArticleList();
        console.log(articleListArray);
        return articleListArray;

      case "picSet":
        const picSetModel = new Pic(newListHTML);
        const picSetListArray = await picSetModel.parsePicSetList();
        console.log(picSetListArray);
        return picSetListArray;

      case "vid":
        const vidModel = new Vid(newListHTML);
        const vidListArray = await vidModel.parseVidList();
        return vidListArray;
    }
  }

  /**
   * Gets LIST PAGE HTML for latest (predefined) item location
   * @param {} type (article, picSet, vid)
   * @returns
   */
  async getNewListHTML(type) {
    const newListParam = await newListMap(type);
    const newListModel = new KCNA({ url: CONFIG[newListParam] });
    const newListHTML = await newListModel.getHTML();
    return newListHTML;
  }

  //-----------------------------

  //WILL HAVE GET NEW PAGE ARRAY HERE

  //------------------

  //ITEM OBJECT SECTION

  /**
   * Gets new obj Items for each data type (article, picSet, vid), returns as array (for tracking)
   * @function getNewObjArray
   * @returns array of objs for tracking
   */
  async getNewObjArray() {
    const type = this.dataObject;
    const downloadArray = await this.getDownloadArray(type);

    //return on null
    if (!downloadArray || !downloadArray.length) return "NOTHING NEW TO DOWNLOAD";

    //otherwise pass to each item model to parse
    switch (type) {
      case "article":
        const articleObjModel = new Article(downloadArray);
        const articleObjArray = await articleObjModel.getNewArticleObjArray();
        return articleObjArray;

      case "picSet":
        const picSetPageModel = new Pic(downloadArray);
        const picSetPageArray = await picSetPageModel.parsePicSetPage();
    }
  }

  /**
   * Gets Obj items to download using MONGO (to pull those not downloaded)
   * @function getDownloadArray
   * @param {*} type (data item type: article, picSet, vid)
   * @returns array of data objs for tracking
   */
  async getDownloadArray(type) {
    //uses map to lookup params, params contain correct collections
    const newDataParams = await newDownloadMap(type);
    const downloadModel = new dbModel(newDataParams);
    const downloadArray = await downloadModel.findNewURLs();
    return downloadArray;
  }
}

export default KCNA;
