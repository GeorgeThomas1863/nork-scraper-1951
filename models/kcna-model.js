import CONFIG from "../config/scrape-config.js";
import dbModel from "./db-model.js";

import Article from "./article-model.js";
import Pic from "./pic-model.js";
import Vid from "./vid-model.js";

import { newListMap, newContentMap } from "../config/map.js";

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
    console.log("GETTING LIST DATA FOR " + type.toUpperCase());
    const newListHTML = await this.getNewListHTML(type);
    if (!newListHTML) return "FETCH FUCKED";

    switch (type) {
      case "articles":
        //pass to article model for parsing
        const articleListModel = new Article(newListHTML);
        const articleListArray = await articleListModel.buildArticleList();
        console.log(articleListArray);
        return articleListArray;

      case "pics":
        const picSetModel = new Pic(newListHTML);
        const picSetListArray = await picSetModel.buildPicSetList();
        console.log(picSetListArray);
        return picSetListArray;

      case "vids":
        const vidModel = new Vid(newListHTML);
        const vidListArray = await vidModel.buildVidList();
        console.log(vidListArray);
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

  //------------------

  //ITEM CONTENT SECTION

  /**
   * Gets new obj Items for each data type (article, picSet, vid), returns as array (for tracking)
   * @function getNewObjArray
   * @returns array of objs for tracking
   */
  async getNewContentArray() {
    const type = this.dataObject;
    console.log("GETTING OBJECT DATA FOR " + type.toUpperCase());
    const newContentArray = await this.getNewContentArray(type);

    //return on null
    if (!newContentArray || !newContentArray.length) return "NOTHING NEW TO DOWNLOAD";

    //otherwise pass to each item model to parse
    switch (type) {
      case "articles":
        const articleObjModel = new Article(newContentArray);
        const articleObjArray = await articleObjModel.buildArticleContent();
        return articleObjArray;

      case "pics":
        const picSetPageModel = new Pic(newContentArray);
        const picSetPageArray = await picSetPageModel.buildPicSetContent();
        return picSetPageArray;

      case "vids":
        const vidObjModel = new Vid(newContentArray);
        const vidObjArray = vidObjModel.buildVidContent();
        return vidObjArray;
    }
  }

  /**
   * Gets Obj items to download using MONGO (to pull those not downloaded)
   * @function getDownloadArray
   * @param {*} type (data item type: article, picSet, vid)
   * @returns array of data objs for tracking
   */
  async getNewContentArray(type) {
    //uses map to lookup params, params contain correct collections
    const newDataParams = await newContentMap(type);
    const newContentModel = new dbModel(newDataParams, "");
    const newContentArray = await newContentModel.findNewURLs();
    return newContentArray;
  }

  //-------------------

  //NEW MEDIA SECTION

  async getNewMediaData() {
    console.log("BUILD FAGGOT");
  }
}

export default KCNA;
