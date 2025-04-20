import CONFIG from "../config/scrape-config.js";
import dbModel from "./db-model.js";

import Article from "./article-model.js";
import Pic from "./pic-model.js";
import Vid from "./vid-model.js";

import { newListMap, newContentMap, newMediaMap } from "../config/map.js";

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
  async getNewListData() {
    //get html
    const type = this.dataObject;
    // console.log("GETTING LIST DATA FOR " + type.toUpperCase());
    const newListHTML = await this.getNewListHTML(type);
    if (!newListHTML) return "FETCH FUCKED";

    switch (type) {
      case "articles":
        //pass to article model for parsing
        const articleListModel = new Article(newListHTML);
        const articleListArray = await articleListModel.buildArticleList();
        // console.log(articleListArray);
        return articleListArray;

      case "pics":
        const picSetModel = new Pic(newListHTML);
        const picSetListArray = await picSetModel.buildPicSetList();
        // console.log(picSetListArray);
        return picSetListArray;

      case "vids":
        const vidModel = new Vid(newListHTML);
        const vidListArray = await vidModel.buildVidList();
        // console.log(vidListArray);
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
  async getNewContentData() {
    const type = this.dataObject;
    // console.log("GETTING OBJECT DATA FOR " + type.toUpperCase());
    const downloadArray = await this.getContentToDownloadArray(type);

    //return on null
    if (!downloadArray || !downloadArray.length) return "NOTHING NEW TO DOWNLOAD";

    //otherwise pass to each item model to parse
    switch (type) {
      case "articles":
        const articleObjModel = new Article(downloadArray);
        const articleObjArray = await articleObjModel.buildArticleContent();
        return articleObjArray;

      case "pics":
        const picSetPageModel = new Pic(downloadArray);
        const picSetPageArray = await picSetPageModel.buildPicSetContent();
        return picSetPageArray;

      case "vids":
        const vidObjModel = new Vid(downloadArray);
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
  async getContentToDownloadArray(type) {
    //uses map to lookup params, params contain correct collections
    const newDataParams = await newContentMap(type);
    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewURLs();
    return downloadArray;
  }

  //-------------------

  //GET NEW MEDIA URLS section

  async getNewMediaData() {
    const type = this.dataObject;
    console.log("GETTING MEDIA FOR " + type.toUpperCase());
    const downloadArray = await this.getMediaToDownloadArray(type);

    switch (type) {
      case "articles":
        return null;

      case "pics":
        const picModel = new Pic(downloadArray);
        const picData = await picModel.getPicDataArray();
        return picData;

      case "vids":
        const vidModel = new Vid(downloadArray);
        const vidData = await vidModel.getVidDataArray();
        return vidData;
    }

    // console.log("DOWNLOAD ARRAY FAGGOT");
    // console.log(downloadArray);
  }

  async getMediaToDownloadArray(type) {
    //uses map to lookup params, params contain correct collections
    const newDataParams = await newMediaMap(type);
    console.log("AHHHHHHHHHH");
    console.log(newDataParams);
    
    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewURLs();
    return downloadArray;
  }

  //----------

  //DOWNLOAD MEDIA SECTION

  async downloadNewMedia() {}
}

export default KCNA;
