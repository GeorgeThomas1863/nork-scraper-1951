import axios from "axios";

import CONFIG from "../config/scrape-config.js";
import { randomDelay } from "../config/util.js";
import dbModel from "./db-model.js";

import { newListMap, newContentMap, newMediaMap, downloadMediaMap, newUploadMap } from "../config/map.js";

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

  //confirm try catch works
  async getHTML() {
    const inputURL = this.dataObject.url;

    try {
      const res = await axios({
        method: "get",
        url: inputURL,
        timeout: 60000,
        responseType: "text",
      });

      return res.data;
    } catch (e) {
      //AXIOS PRODUCES OWN CUSTOM ERROR
      console.log("AXIOS ERROR, for " + inputURL + "\nRESPONSE: " + (await e.response) + "; REQUEST: " + (await e.request));
      return null;
    }
  }

  async getMediaHeaders() {
    const inputURL = this.dataObject.url;

    try {
      const delay = await randomDelay(5);
      console.log("DELAY");
      console.log(delay);

      const res = await axios({
        method: "get",
        url: inputURL,
        headers: { Range: "bytes=0-1" },
        timeout: 30000,
      });

      // console.log("RES!!!!!!!!!!");
      // console.log(res);

      return res;
    } catch (e) {
      // console.log("AXIOS ERROR, for " + inputURL);
      console.log("AXIOS ERROR, for " + inputURL + "\nRESPONSE: " + e.response + "; REQUEST: " + e.request);
      const res = await this.getRawHTML(inputURL);
      return res;
    }
  }

  //returns just data, for the pic header fail
  async getRawHTML(inputURL) {
    // const inputURL = this.dataObject.url;

    try {
      // await randomDelay(1);
      const res = await axios({
        method: "get",
        url: inputURL,
        timeout: 20000,
        responseType: "text",
      });

      return res;
    } catch (e) {
      console.log("AXIOS ERROR, for " + inputURL + "\nRESPONSE: " + e.response + "; REQUEST: " + e.request);
      return null;
    }
  }

  //----------------------

  async getNewListData() {
    const { type } = this.dataObject;

    const newListInputObj = await newListMap(type);
    const listModel = new KCNA({ url: CONFIG[newListInputObj.param] });
    const newListHTML = await listModel.getHTML();

    //extract list array from html (based on type using map.func)
    console.log("GETTING LIST DATA FOR " + type.toUpperCase());
    const listArray = await newListInputObj.func(newListHTML);
    console.log("FOUND " + listArray.length + " " + type.toUpperCase());

    return listArray;
  }

  //---------------

  //NEW CONTENT SECTION

  async getNewContentData() {
    const { type } = this.dataObject;
    //map obj, new content for scraping
    const newContentInputObj = await newContentMap(type);
    const contentModel = new dbModel(newContentInputObj.params, "");
    const downloadArray = await contentModel.findNewURLs();

    //scrape new content (based on type using map.func)
    console.log("GETTING CONTENT FOR " + downloadArray.length + " " + type.toUpperCase());
    const contentArray = await newContentInputObj.func(downloadArray);
    console.log("GOT CONTENT FOR " + contentArray.length + " " + type.toUpperCase());
  }

  //------------

  //NEW MEDIA SECTION

  async getNewMediaData() {
    const { type } = this.dataObject;

    const newMediaObj = await findNewMediaMap(type);
    const arrayModel = new dbModel(newMediaObj.params, "");
    const downloadArray = await arrayModel.findNewURLs();

    if (!downloadArray || !downloadArray.length) return null;

    console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
    const mediaDataArray = await newMediaObj.func(downloadArray);
    console.log("FOUND " + mediaDataArray?.length + " " + type.toUpperCase());

    return mediaDataArray;
  }

  async downloadNewMediaFS() {
    const { type } = this.dataObject;

    const downloadObj = await downloadNewMediaMap(type);
    const downloadModel = new dbModel(downloadObj.params, "");
    const downloadArray = await downloadModel.findNewURLs();

    if (!downloadArray || !downloadArray.length) return null;

    console.log("GETTING DATA FOR " + downloadArray?.length + " " + type.toUpperCase());
    const downloadDataArray = await downloadObj.func(downloadArray);
    console.log("FOUND " + downloadDataArray?.length + " " + type.toUpperCase());

    return downloadDataArray;
  }

  //LIST PAGE

  // /**
  //  * Gets LIST PAGE HTML for latest (predefined) item location
  //  * @param {} type (article, picSet, vid)
  //  * @returns
  //  */
  // async getNewListHTML() {
  //   const { url } = this.dataObject;

  //   try {
  //     const newListModel = new KCNA({ url: url });
  //     const newListHTML = await newListModel.getHTML();
  //     // console.log(newListHTML);

  //     return newListHTML;
  //   } catch (e) {
  //     console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  //     return null;
  //   }
  // }

  //------------------

  //ITEM CONTENT SECTION

  // /**
  //  * Gets Obj items to download using MONGO (to pull those not downloaded)
  //  * @function getDownloadArray
  //  * @param {*} type (data item type: article, picSet, vid)
  //  * @returns array of data objs for tracking
  //  */
  // async getContentToDownloadArray() {
  //   //uses map to lookup params, params contain correct collections
  //   const { type } = this.dataObject;
  //   const newDataParams = await newContentMap(type);

  //   const downloadModel = new dbModel(newDataParams, "");
  //   const downloadArray = await downloadModel.findNewURLs();
  //   return downloadArray;
  // }

  //-------------------

  // async getMediaToDownloadArray() {
  //   //uses map to lookup params, params contain correct collections
  //   const { type } = this.dataObject;
  //   const newDataParams = await newMediaMap(type);

  //   const downloadModel = new dbModel(newDataParams, "");
  //   const downloadArray = await downloadModel.findNewPicsBySize();
  //   return downloadArray;
  // }

  // //----------

  // //DOWNLOAD MEDIA SECTION
  // async getMediaToScrapeFS() {
  //   const { type } = this.dataObject;

  //   const newDataParams = await downloadMediaMap(type);

  //   const downloadModel = new dbModel(newDataParams, "");
  //   const downloadArray = await downloadModel.findNewPicsBySize();
  //   return downloadArray;
  // }

  //-----------------

  //UPLOAD SHIT SECTION
  async getUploadArray() {
    const { type } = this.dataObject;

    const newDataParams = await newUploadMap(type);

    const uploadModel = new dbModel(newDataParams, "");
    const uploadArray = await uploadModel.findNewPicsBySize();
    return uploadArray;
  }
}

export default KCNA;
