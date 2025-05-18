import { JSDOM } from "jsdom";
import fs from "fs";

import CONFIG from "../config/config.js";
import KCNA from "./kcna-model.js";
import TG from "./tg-control-model.js";
import Pic from "./pic-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

import { scrapeId } from "../src/scrape-util.js";

class Vid {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //VID PAGE LIST SECTION

  async getVidListArray() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //throw error if no vid Pages found
    if (!document) {
      const error = new Error("CANT EXTRACT VID PAGE LIST");
      error.url = CONFIG.vidListURL;
      error.function = "getVidListArray (MODEL)";
      throw error;
    }

    // Select all the elements that contain individual video data
    const vidWrapperArray = document.querySelectorAll(".video-wrapper");

    const vidListModel = new Vid({ inputArray: vidWrapperArray });
    const vidListArray = await vidListModel.parseVidPageLinks();

    return vidListArray;
  }

  async parseVidPageLinks() {
    const { inputArray } = this.dataObject;

    const vidListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const vidListModel = new Vid({ listItem: inputArray[i] });
        const vidListObj = await vidListModel.parseVidListItem();
        if (!vidListObj) return null;

        //push to array
        vidListArray.push(vidListObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }
    return vidListArray;
  }

  async parseVidListItem() {
    const { listItem } = this.dataObject;
    if (!listItem) return null;

    //extract vid link and store it
    const vidLinkElement = listItem.querySelector(".img a");
    const href = vidLinkElement.getAttribute("href");

    //throw error HERE
    if (!href) {
      const error = new Error("CANT FIND VID LINK [VID MODEL]");
      error.url = listItem.textContent;
      error.function = "parseVidListItem";
      throw error;
    }

    //build URL
    const urlConstant = "http://www.kcna.kp";
    const vidPageURL = urlConstant + href;

    //check HERE if new URL, throw error if not new
    const checkModel = new dbModel({ url: vidPageURL }, CONFIG.vidPageList);
    await checkModel.urlNewCheck();

    //extract thmubnail and store it
    const thumbnailModel = new Vid({ inputItem: listItem });
    const thumbnailURL = await thumbnailModel.getVidThumbnail();

    //get date
    const dateModel = new UTIL({ inputItem: listItem });
    const vidDate = await dateModel.parseListDate();
    const dateElement = listItem.querySelector(".publish-time");

    //get title
    const titleElement = listItem.querySelector(".title a");
    const titleRaw = titleElement.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    const vidListObj = {
      url: vidPageURL,
      thumbnail: thumbnailURL,
      date: vidDate,
      title: title,
      scrapeId: scrapeId,
    };

    return vidListObj;
  }

  async getVidThumbnail() {
    const { inputItem } = this.dataObject;

    //get thumbnailURL
    const thumbnailElement = inputItem.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const urlConstant = "http://www.kcna.kp";
    const thumbnailURL = urlConstant + thumbSrc;
    if (!thumbnailURL) return null;

    //store it in picURLs
    try {
      const picModel = new dbModel({ url: thumbnailURL, scrapeId: scrapeId }, CONFIG.picURLs);
      const storeData = await picModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return thumbnailURL;
  }

  //----------------------

  //VID CONTENT SECTION

  async getVidPageObj() {
    const { inputObj } = this.dataObject;

    //html
    const vidPageModel = new KCNA(inputObj);
    const vidPageHTML = await vidPageModel.getHTML();

    //throw error if cant get html
    if (!vidPageHTML) {
      const error = new Error("FAILED TO GET VIDPAGE HTML");
      error.url = inputObj.url;
      error.function = "getVidPageObj (MODEL)";
      throw error;
    }

    //extract vidURL add to obj
    const vidURLModel = new Vid({ html: vidPageHTML });
    const vidURL = await vidURLModel.parseVidURL();

    //add to obj
    const vidPageObj = { ...inputObj };
    vidPageObj.vidURL = vidURL;
    vidPageObj.scrapeId = scrapeId;

    //store obj
    const storeModel = new dbModel(vidPageObj, CONFIG.vidPageContent);
    const storeVidData = await storeModel.storeUniqueURL();
    console.log(storeVidData);

    //return for tracking
    return vidPageObj;
  }

  //extract vid URL as String
  async parseVidURL() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //throw error if no vid Pages found
    if (!document) {
      const error = new Error("CANT EXTRACT VID PAGE LIST");
      error.url = CONFIG.vidListURL;
      error.function = "getVidListArray (MODEL)";
      throw error;
    }

    //parse through scripts
    const scriptArray = document.querySelectorAll("script");

    const vidModel = new Vid({ inputArray: scriptArray });
    const mp4Link = await vidModel.parseVidScripts();

    //if cant find vid link return null
    if (!mp4Link) return null;

    const urlConstant = "http://www.kcna.kp";
    const vidURL = urlConstant + mp4Link;

    console.log("!!!VID URL");
    console.log(vidURL);

    //store it in vidURLs
    try {
      const storeModel = new dbModel({ url: vidURL, scrapeId: scrapeId }, CONFIG.vidURLs);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return vidURL;
  }

  async parseVidScripts() {
    const { inputArray } = this.dataObject;

    let mp4Link = null;

    for (const script of inputArray) {
      const content = script.textContent;
      if (content && content.includes("type='video/mp4'")) {
        //regex looking for the vid type mp4
        const match = content.match(/source src='([^']+)' type='video\/mp4'/);
        if (match && match[1]) {
          mp4Link = match[1];
          return mp4Link;
        }
      }
    }

    return mp4Link;
  }

  //------------------------

  //VID DATA SECTION

  async getVidData() {
    const { inputObj } = this.dataObject;
    const headerObj = { ...inputObj };

    console.log("VID DATA INPUT OBJ");
    console.log(headerObj);

    //CHECK IF ALREADY HAVE (shouldnt happen, but double check)
    const checkModel = new dbModel(headerObj, CONFIG.vids);
    await checkModel.urlNewCheck();

    //throws error on fail
    const headerModel = new KCNA(headerObj);
    const headerData = await headerModel.getMediaHeaders();
    if (!headerData) return null;

    console.log("VID HEADER DATA!!!!");
    console.log(headerData);

    //just add entire object in, no need for complex parsing here
    headerObj.headerData = headerData;

    //add scrape id here
    headerObj.scrapeId = scrapeId;

    //get vid ID
    const vidIdModel = new UTIL({ type: "vids" });
    const vidId = await vidIdModel.getNextId();

    console.log("VID ID!!!!");
    console.log(vidId);

    headerObj.vidId = vidId;

    const storeModel = new dbModel(headerObj, CONFIG.vids);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return headerObj;
  }

  //----------------------

  //DOWNLOAD VID SECTION

  async downloadVidFS() {
    const { inputObj } = this.dataObject;
    const { vidId } = inputObj;
    const { vidChunkSize, tempPath } = CONFIG;

    //check if new (not possible in most situations, but adding check to be sure)
    const checkModel = new dbModel(inputObj, CONFIG.vidsDownloaded);
    await checkModel.urlNewCheck(); //throws error if not new (keep out of try block to propogate error)

    //get vid size here (PROB NEED TO CHANGE BASED ON FUTURE HEADERS)
    const vidSizeModel = new Vid({ inputObj: inputObj });
    const vidSizeBytes = await vidSizeModel.parseVidSize();

    //build temp save path / calc things
    const vidTempPath = tempPath + vidId + ".mp4";
    const totalChunks = Math.ceil(vidSizeBytes / vidChunkSize);

    //add to obj, and then vidObj
    const dataObj = {
      scrapeId: scrapeId,
      vidTempPath: vidTempPath,
      vidSizeBytes: vidSizeBytes,
      totalChunks: totalChunks,
    };

    const vidObj = { ...inputObj, ...dataObj };

    //download vid multi
    const downloadModel = new KCNA({ inputObj: vidObj });
    const downloadVidObj = await downloadModel.getVidMultiThread();

    //if fucked try other vid download
    if (!downloadVidObj) {
      const retryObj = await downloadModel.getVidSimple();
      return retryObj;
    }

    return downloadVidObj;
  }

  //WILL PROB HAVE TO CHANGE BASED ON FUTURE HEADERS
  async parseVidSize() {
    const { inputObj } = this.dataObject;
    const { headerData } = inputObj;

    // Extract video size from content-range header (format: bytes 0-72/36378941)
    if (headerData && headerData["content-range"]) {
      const contentRangeMatch = headerData["content-range"].match(/bytes \d+-\d+\/(\d+)/);
      if (contentRangeMatch && contentRangeMatch[1]) {
        return parseInt(contentRangeMatch[1], 10);
      }
    }

    // If we couldn't get size from content-range, try content-length
    if (headerData && headerData["content-length"]) {
      return parseInt(headerData["content-length"], 10);
    }

    console.log("ERROR: Could not determine video size from headers");
    return null;
  }

  //-----------------------------

  //UPLOAD VIDS
  async postVidPageObj() {
    const { inputObj } = this.dataObject;
    const { url, vidURL, thumbnail } = inputObj;

    if (!inputObj) {
      const error = new Error("VID PAGE UPLOAD FUCKED");
      error.url = url;
      error.function = "postVidPageObj";
      throw error;
    }

    //add channel to post to HERE
    inputObj.tgUploadId = CONFIG.tgUploadId;
    inputObj.scrapeId = scrapeId;

    //normalizes obj
    const normalModel = new UTIL({ inputObj: inputObj });
    const normalObj = await normalModel.normalizeInputsTG();

    //get vid obj data (extra data for each vid)
    const lookupParams = {
      keyToLookup: "url",
      itemValue: vidURL,
    };
    const vidObjModel = new dbModel(lookupParams, CONFIG.vidsDownloaded);
    const vidObjData = await vidObjModel.getUniqueItem();

    //build vidPageObj
    const vidPageObj = { ...normalObj, ...vidObjData };

    console.log("VID PAGE OBJ");
    console.log(vidPageObj);

    //check if file exists HERE, throw error if it doesnt
    const vidExists = fs.existsSync(vidPageObj.savePath);
    if (!vidExists) {
      const error = new Error("VID NOT YET DOWNLOADED");
      error.url = url;
      error.function = "postVidPageObj";
      throw error;
    }

    //otherwise post title
    const tgModel = new TG({ inputObj: vidPageObj });
    await tgModel.postTitleTG();

    //post thumbnail
    const thumbnailModel = new Vid({ inputObj: normalObj });
    await thumbnailModel.postVidThumbnail();

    //post vid
    const postVidData = await tgModel.postVidTG();

    return postVidData;
  }

  async postVidThumbnail() {
    const { inputObj } = this.dataObject;
    const { thumbnail, kcnaId } = inputObj;

    //thumbnail params
    const thumbnailLookupParams = {
      keyToLookup: "url",
      itemValue: thumbnail,
    };

    //get thumbnail data
    const thumbnailLookupModel = new dbModel(thumbnailLookupParams, CONFIG.picsDownloaded);
    const lookupObj = await thumbnailLookupModel.getUniqueItem();
    const thumbnailObj = { ...lookupObj, ...inputObj };

    //check if thumbnail exists, download it if not
    try {
      const picExists = fs.existsSync(thumbnailObj.savePath);
      if (!picExists) {
        //build download pic params
        const picParams = {
          url: thumbnail,
          kcnaId: kcnaId,
          savePath: thumbnailObj.savePath,
          scrapeId: scrapeId,
        };
        const picModel = new Pic({ picObj: picParams });
        await picModel.downloadPicFS();
      }
      //post thumbnail
      const thumnailPostModel = new TG({ inputObj: thumbnailObj });
      await thumnailPostModel.postPicTG();
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }
}

export default Vid;
