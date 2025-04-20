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
    const { url, kcnaId, dateString } = this.dataObject;

    const res = await fetch(url);

    //if URL doesnt exist / return headers throw error
    if (!res || !res.headers) {
      const error = new Error("URL DOESNT EXIST");
      error.url = url;
      error.function = "getPicData KCNA MODEL";
      throw error;
    }

    //get pic headers
    const headerData = res.headers;
    console.log("VID HEADER DATA");
    console.log(headerData);
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
        const storeVidModel = new dbModel(vidListObj, CONFIG.vidPages);
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

    //extract vid link
    const vidLinkElement = vidElement.querySelector(".img a");
    const href = vidLinkElement.getAttribute("href");
    const vidURL = urlConstant + href;

    //thumbnail
    const thumbnailElement = vidElement.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const thumbnailURL = urlConstant + thumbSrc;

    //parse vidId / dateString
    const kcnaId = +thumbSrc.substring(thumbSrc.lastIndexOf("/") + 2, thumbSrc.lastIndexOf("."));
    const dateString = thumbSrc.substring(thumbSrc.indexOf("video/kp/") + 9, thumbSrc.indexOf("/V"));

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
  async getNewVidPageArray() {
    const downloadArray = this.dataObject;

    const vidPageArray = [];
    for (let i = 0; i < downloadArray.length; i++) {
      try {
        const inputObj = downloadArray[i];
        const vidPageObj = await this.buildVidPageObj(inputObj);

        // const storePicSetModel = new dbModel(vidPageObj, CONFIG.vidPagesDownloaded);
        // const storePicSetData = await storePicSetModel.storeUniqueURL();
        // console.log(storePicSetData);

        //add to array
        vidPageArray.push(vidPageObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //return for tracking
    return vidObjArray;
  }

  async buildVidPageObj(inputObj) {
    const vidPageHTML = await this.getVidPageHTML(inputObj);
    console.log("FUCK MY BITCH FACE");
    console.log(vidPageHTML);

    const parseObj = await this.parseVidPage(vidPageHTML);

    return parseObj;
  }

  async getVidPageHTML(inputObj) {
    if (!inputObj) return null;

    const htmlModel = new KCNA(inputObj);
    const html = await htmlModel.getHTML();
    return html;
  }

  async parseVidPage(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //get vid mp4 url
    const vidElementRaw = document.querySelector("video");
    console.log(vidElementRaw.textContent);

    const vidElement = vidElementRaw.querySelector('source[type="video/mp4"]');
    const vidSrc = vidElement.getAttribute("src");

    console.log("AHHHHHHHHHHH");
    console.log("REAL FUCKING VID LINK");
    console.log(vidSrc);
  }
}

export default Vid;
