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

  async getMediaToDownloadArray() {
    //uses map to lookup params, params contain correct collections
    const { type } = this.dataObject;
    const newDataParams = await newMediaMap(type);

    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewPicsBySize();
    return downloadArray;
  }

  //----------

  //DOWNLOAD MEDIA SECTION
  async getMediaToScrapeFS() {
    const { type } = this.dataObject;

    const newDataParams = await downloadMediaMap(type);

    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewPicsBySize();
    return downloadArray;
  }

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
