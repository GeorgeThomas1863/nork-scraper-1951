import axios from "axios";

import CONFIG from "../config/scrape-config.js";
import dbModel from "./db-model.js";

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
  // async getHTML() {
  //   try {
  //     const res = await fetch(this.dataObject.url);
  //     // console.log(res);
  //     const data = await res.text();
  //     return data;
  //   } catch (e) {
  //     console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  //   }
  // }

  //FUCKING SWITCHING TO AXIOS
  // async getHTMLAxios() {
  //   const url = this.dataObject.url;
  //   try {
  //     const html = await this.getHTML(url);
  //     return html;
  //   } catch (e) {
  //     console.log(this.dataObject.url + "; " + e.message + "; F BREAK: " + e.function);
  //     return null;
  //   }
  // }

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

      if (!res || !res.data) {
        const error = new Error("FETCH FUCKED");
        error.url = url;
        error.fucntion = "GET HTML AXIOS";
        throw ReferenceError;
      }

      return res.data;
    } catch (e) {
      console.log(this.dataObject.url + "; " + e.message + "; F BREAK: " + e.function);
      return null;
    }
  }

  //----------------------

  //LIST PAGE

  /**
   * Gets LIST PAGE HTML for latest (predefined) item location
   * @param {} type (article, picSet, vid)
   * @returns
   */
  async getNewListHTML() {
    const { type } = this.dataObject;
    const newListParam = await newListMap(type);
    try {
      const newListModel = new KCNA({ url: CONFIG[newListParam] });
      const newListHTML = await newListModel.getHTML();
      console.log(newListHTML);

      return newListHTML;
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      return null;
    }
  }

  //------------------

  //ITEM CONTENT SECTION

  /**
   * Gets Obj items to download using MONGO (to pull those not downloaded)
   * @function getDownloadArray
   * @param {*} type (data item type: article, picSet, vid)
   * @returns array of data objs for tracking
   */
  async getContentToDownloadArray() {
    //uses map to lookup params, params contain correct collections
    const { type } = this.dataObject;
    const newDataParams = await newContentMap(type);

    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewURLs();
    return downloadArray;
  }

  //-------------------

  async getMediaToDownloadArray() {
    //uses map to lookup params, params contain correct collections
    const { type } = this.dataObject;
    const newDataParams = await newMediaMap(type);

    const downloadModel = new dbModel(newDataParams, "");
    const downloadArray = await downloadModel.findNewURLs();
    return downloadArray;
  }

  //----------

  //DOWNLOAD MEDIA SECTION
}

export default KCNA;
