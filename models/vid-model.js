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

  async getVidDataArray() {
    const vidArray = this.dataObject;

    for (let i = 0; i < vidArray.length; i++) {
      const vidItem = vidArray[i];
      console.log("VID ITEM FAGGOT");
      console.log(vidItem);
    }
  }

  // async buildVidObj() {
  //   const { url, kcnaId, dateString } = this.dataObject;

  //   const res = await fetch(url);

  //   //if URL doesnt exist / return headers throw error
  //   if (!res || !res.headers) {
  //     const error = new Error("URL DOESNT EXIST");
  //     error.url = url;
  //     error.function = "getPicData KCNA MODEL";
  //     throw error;
  //   }

  //   //get pic headers
  //   const headerData = res.headers;
  //   // console.log("VID HEADER DATA");
  //   // console.log(headerData);
  // }

  //------------
  //PARSE DATA

  //FOR VID LIST PAGE SECTION

  /**
   * Extracts articleListPage data items, sorts / normalizes them, then stores them
   * @function parseVidList
   * @returns {array} ARRAY of sorted OBJECTs (for tracking)
   */
  async buildVidList() {
    // Parse the HTML using JSDOM
    const dom = new JSDOM(this.dataObject);
    const document = dom.window.document;

    // Select all the elements that contain individual video data
    const vidWrapperArray = document.querySelectorAll(".video-wrapper");
    if (!vidWrapperArray || !vidWrapperArray.length) return null;

    const vidListArray = await this.parseWrapperArray(vidWrapperArray);
    return vidListArray;
  }

  async parseWrapperArray(inputArray) {
    const vidListArray = [];

    for (let i = 0; i < inputArray.length; i++) {
      try {
        const vidElement = inputArray[i];
        const vidListObj = await this.getVidListObj(vidElement);
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

  async getVidListObj(vidElement) {
    const urlConstant = "http://www.kcna.kp";

    //extract vid linl
    const vidLinkElement = vidElement.querySelector(".img a");
    const href = vidLinkElement.getAttribute("href");
    const vidPageURL = urlConstant + href;

    //thumbnail
    const thumbnailElement = vidElement.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const thumbnailURL = urlConstant + thumbSrc;
    await this.storeVidThumbnail(thumbnailURL);

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
      url: vidPageURL,
      thumbnail: thumbnailURL,
      kcnaId: kcnaId,
      dateString: dateString,
      date: vidDate,
      title: title,
    };

    return vidListObj;
  }

  async storeVidThumbnail(picURL) {
    try {
      const picModel = new dbModel({ url: picURL }, CONFIG.picURLs);
      const storeData = await picModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  // async storeVidURL(vidURL) {
  //   try {
  //     const picModel = new dbModel({ url: vidURL }, CONFIG.vidURLs);
  //     const storeData = await picModel.storeUniqueURL();
  //     console.log(storeData);
  //   } catch (e) {
  //     console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  //   }
  // }

  //----------------------

  //VID OBJ SECTION
  async buildVidContent() {
    const downloadArray = this.dataObject;

    const vidPageArray = [];
    for (let i = 0; i < downloadArray.length; i++) {
      try {
        const vidPageObj = downloadArray[i];
        const vidURL = await this.getVidURL(vidPageObj);
        vidPageObj.vidURL = vidURL;

        //store it
        const storeVidPageModel = new dbModel(vidPageObj, CONFIG.vidPagesDownloaded);
        const storeVidPage = await storeVidPageModel.storeUniqueURL();
        console.log(storeVidPage);

        //add to array
        vidPageArray.push(vidPageObj);

        //store to vidURLs
        const vidURLModel = new dbModel({ url: vidURL }, CONFIG.vidURLs);
        await vidURLModel.storeUniqueURL();
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //return for tracking
    return vidPageArray;
  }

  async getVidURL(inputObj) {
    const vidPageModel = new KCNA(inputObj);
    const vidPageHTML = await vidPageModel.getHTML();

    const vidURL = await this.extractVidStr(vidPageHTML);
    return vidURL;
  }

  //extract vid URL as String
  async extractVidStr(str) {
    //claude regex that extracts anythng starting with '/siteFiles/video AND ending with .mp4'
    const regex = /'\/siteFiles\/video[^']*?\.mp4'/;
    const match = str.match(regex);
    if (!match) return null;
    const vidStr = match[0].substring(1, match[0].length - 1); //get rid of leading / trailing quotes

    const urlConstant = "http://www.kcna.kp";
    const vidURL = urlConstant + vidStr;
    return vidURL;
  }
}

export default Vid;
