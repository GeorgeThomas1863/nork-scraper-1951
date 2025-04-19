import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

/**
 * @class Vid
 * @description Does shit with KCNA Vid (gets them, parses html)
 */
class Vid {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async buildVidObj() {
    console.log("BUILD VID OBJECT");
    console.log(this.dataObject);
  }

  //------------
  //PARSE DATA

  //FOR VID LIST PAGE SECTION

  /**
   * Extracts articleListPage data items, sorts / normalizes them, then stores them
   * @function parseVidList
   * @returns {array} ARRAY of sorted OBJECTs (for tracking)
   */
  async parseVidList() {
    // Parse the HTML using JSDOM
    const dom = new JSDOM(this.dataObject);
    const document = dom.window.document;

    // Select all the elements that contain individual video data
    const vidWrapperArray = document.querySelectorAll(".video-wrapper");
    if (!vidWrapperArray || !vidWrapperArray.length) return null;

    const vidListArray = await this.parseVidWrapperArray(vidWrapperArray);
    return vidListArray;
  }

  async parseVidWrapperArray(inputArray) {
    const vidListArray = [];

    for (let i = 0; i < inputArray.length; i++) {
      try {
        const vidElement = inputArray[i];
        const vidListObj = await this.buildVidListObj(vidElement);
        if (!vidListObj) return null;

        //store data
        const storeVidModel = new dbModel(vidListObj, CONFIG.vids);
        const storeData = await storeVidModel.storeUniqueURL();
        console.log(storeData);

        //push to array
        vidListArray.push(vidListObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //return for tracking
    return vidListArray;
  }

  async buildVidListObj(vidElement) {
    const urlConstant = "http://www.kcna.kp";

    // extract vid URL
    const vidLinkElement = vidElement.querySelector(".img img");
    const vidSrc = vidLinkElement.getAttribute("src");
    const vidURL = urlConstant + vidSrc;

    //parse vidId / dateString
    const kcnaId = vidSrc.substring(vidSrc.lastIndexOf("/") + 2, vidSrc.lastIndexOf("."));
    const dateString = vidSrc.substring(vidSrc.indexOf("video/kp/") + 9, vidSrc.indexOf("/V"));

    //extract thumbnail
    const thumbnailElement = vidElement.querySelector(".img a");
    const href = thumbnailElement.getAttribute("href");
    const thumbnailURL = urlConstant + href;

    //get date
    const dateElement = vidElement.querySelector(".publish-time");
    const dateText = dateElement.textContent.trim();
    const dateModel = new UTIL(dateText);
    const vidDate = await dateModel.parseDateElement();

    //get title
    const titleElement = vidElement.querySelector(".title a");
    const titleRaw = titleElement.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    const vidListObj = {
      url: vidURL,
      thumbnail: thumbnailURL,
      kcnaId: kcnaId,
      dateString: dateString,
      date: vidDate,
      title: title,
    };

    return vidListObj;
  }

  //----------------------

  //VID OBJ SECTION
  async getNewVidObjArray() {
    const downloadArray = this.dataObject;

    const vidObjArray = [];
    for (let i = 0; i < downloadArray.length; i++) {
      try {
        const inputObj = downloadArray[i];

        //get HTML
        const vidPageHTML = await this.getVidPageHTML(inputObj);

        const vidObjModel = new Vid(vidPageHTML);
        const parseObj = await vidObjModel.buildVidObj();
        const vidObj = { ...inputObj, ...parseObj };

        const storePicSetModel = new dbModel(vidObj, CONFIG.vidsDownloaded);
        const storePicSetData = await storePicSetModel.storeUniqueURL();
        console.log(storePicSetData);

        //add to array
        vidObjArray.push(vidObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //return for tracking
    return vidObjArray;
  }

  async getVidPageHTML(inputObj) {
    const htmlModel = new KCNA(inputObj);
    const html = await htmlModel.getHTML();
    return html;
  }
}

export default Vid;
