import axios from "axios";

import { randomDelay } from "../config/util.js";

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
      console.log("AXIOS ERROR, for " + inputURL + "\nRESPONSE: " + (await e.response) + "; REQUEST: " + (await e.request));
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
      console.log("AXIOS ERROR, for " + inputURL + "\nRESPONSE: " + (await e.response) + "; REQUEST: " + (await e.request));
      return null;
    }
  }
}

export default KCNA;
