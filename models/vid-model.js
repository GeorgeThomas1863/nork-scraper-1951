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

  async getVidData() {
    const { url } = this.dataObject;
    const vidParams = await this.getVidParams(url);

    const vidObj = await this.buildVidObj(vidParams);
    if (!vidObj) return null;

    const storeModel = new dbModel(vidObj, CONFIG.vids);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return vidObj;
  }

  async getVidParams(vidURL) {
    const kcnaId = +vidURL.substring(vidURL.length - 11, vidURL.length - 4);

    const dateString = vidURL.substring(vidURL.indexOf("/video/") + "/video/kp/".length, vidURL.indexOf("/VID", vidURL.indexOf("/video/")));

    const vidParams = {
      url: vidURL,
      kcnaId: kcnaId,
      dateString: dateString,
    };

    console.log("FUCKING VID PARAMS");
    console.log(vidParams);

    return vidParams;
  }

  async buildVidObj(vidParams) {
    const { url, kcnaId, dateString } = vidParams;

    const htmlModel = new KCNA(vidParams);
    const res = await htmlModel.getMediaHeaders();

    //get pic headers
    const headerData = res.headers;

    const serverData = headerData.server;
    const eTag = headerData.etag;
    const vidEditDate = new Date(headerData["last-modified"]);
    const contentRange = headerData["content-range"];
    const vidSize = contentRange.substring(contentRange.lastIndexOf("/") + 1, contentRange.length - 1);

    const vidObj = {
      url: url,
      kcnaId: kcnaId,
      dateString: dateString,
      scrapeDate: new Date(),
      vidSize: vidSize,
      serverData: serverData,
      eTag: eTag,
      vidEditDate: vidEditDate,
    };

    console.log("VID OBJECT YOU FUCKING FAGGOT");
    console.log(vidObj);

    return vidObj;
  }

  //------------
  //PARSE DATA

  async getVidListArray() {
    const inputArray = this.dataObject.inputArray;
    const vidListArray = [];

    for (let i = 0; i < inputArray.length; i++) {
      try {
        const vidElement = inputArray[i];
        const vidListObj = await this.getVidListObj(vidElement);
        if (!vidListObj) return null;

        //store data
        const storeVidModel = new dbModel(vidListObj, CONFIG.vidPageList);
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

    //extract vid link and store it
    const vidLinkElement = vidElement.querySelector(".img a");
    const href = vidLinkElement.getAttribute("href");
    const vidPageURL = urlConstant + href;

    //extract thmubnail and store it
    const thumbnailElement = vidElement.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const thumbnailURL = urlConstant + thumbSrc;
    await this.storeVidThumbnail(thumbnailURL);

    //parse vidId / dateString
    const kcnaId = +thumbSrc.substring(thumbSrc.lastIndexOf("/") + 2, thumbSrc.lastIndexOf("."));
    const dateString = thumbSrc.substring(thumbSrc.indexOf("video/kp/") + 9, thumbSrc.indexOf("/V"));

    //get date
    const dateModel = new UTIL({ inputItem: vidElement });
    const vidDate = await dateModel.parseListDate();
    // const dateElement = vidElement.querySelector(".publish-time");
    // const dateText = dateElement.textContent.trim();
    // const dateModel = new UTIL({ dateText: dateText });
    // const vidDate = await dateModel.parseDateElement();

    //get title
    const titleElement = vidElement.querySelector(".title a");
    const titleRaw = titleElement.textContent.trim();
    const dateElement = vidElement.querySelector(".publish-time");
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

  async storeVidURL(vidURL) {
    try {
      const vidModel = new dbModel({ url: vidURL }, CONFIG.vidURLs);
      const storeData = await vidModel.storeUniqueURL();
      console.log(storeData);
      return storeData;
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //----------------------

  async getVidURL() {
    const { inputObj } = this.dataObject;
    const vidPageModel = new KCNA(inputObj);
    const vidPageHTML = await vidPageModel.getHTML();

    //extract vidURL and store it
    const vidURL = await this.extractVidStr(vidPageHTML);
    await this.storeVidURL(vidURL);

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
