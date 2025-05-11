import { JSDOM } from "jsdom";

import CONFIG from "../config/config.js";
import KCNA from "./kcna-model.js";
import TG from "./tg-control-model.js";
import dbModel from "./db-model.js";
import Pic from "./pic-model.js";
import UTIL from "./util-model.js";

import { articleTypeListMap } from "../config/map.js";
import { scrapeId } from "../src/scrape-util.js";

/**
 * @class Article
 * @description Does shit with KCNA Articles (gets them, parses html)
 */
class Article {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //-----------

  //ARTICLE LIST SECTION

  //gets article list html by type
  async getArticleListTypeHTML() {
    const { type, html } = this.dataObject;

    if (type === "fatboy") return html;

    //otherwise get html by type
    const articleListURL = await articleTypeListMap(type);

    const htmlModel = new KCNA({ url: articleListURL });
    const articleListHTML = await htmlModel.getHTML();

    return articleListHTML;
  }

  async getArticleListArray() {
    const { html, type } = this.dataObject;

    // Parse the HTML using JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find article-link (wrapper element) extract out all links
    const articleLinkElement = document.querySelector(".article-link");
    const linkElementArray = articleLinkElement?.querySelectorAll("a");

    //throw error if no links found
    if (!linkElementArray || !linkElementArray.length) {
      const error = new Error("CANT EXTRACT ARTICLE LIST");
      error.url = CONFIG.articleListURL;
      error.function = "getArticleListArray (MODEL)";
      throw error;
    }

    const articleLinkObj = {
      type: type,
      inputArray: linkElementArray,
    };

    //extract out the articleListObjs
    const articleLinkModel = new Article(articleLinkObj);
    const articleListArray = await articleLinkModel.parseArticleLinks();

    return articleListArray;
  }

  /**
   * Parses array of article link items (loops through), returns array of (unsorted) articleListObjs
   * @function parseLinkArray
   * @param {*} inputArray (array of article link items)
   * @returns //array of (unsorted) articleListObjs
   */
  async parseArticleLinks() {
    const { inputArray, type } = this.dataObject;

    //loop through a tags and pull out hrefs
    const articleListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const articleListModel = new Article({ listItem: inputArray[i] });
        const articleListObj = await articleListModel.parseArticleListItem();

        //ADD ARTICLE TYPE HERE AND SCRAPE ID HERE
        articleListObj.articleType = type;
        articleListObj.scrapeId = scrapeId;

        articleListArray.push(articleListObj); //add to array
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return articleListArray;
  }

  /**
   * Parses individual article link item, builds / returns single articleListObj
   * @function parseArticleListItem
   * @param {*} listItem article link item
   * @returns articleListObj (with url / date extracted)
   */
  async parseArticleListItem() {
    const { listItem } = this.dataObject;
    if (!listItem) return null;

    //get article link
    const href = listItem.getAttribute("href");

    //throw error if cant extact pic link
    if (!href) {
      const error = new Error("CANT FIND ARTICLE LINK [ARTICLE MODEL]");
      error.url = listItem.textContent;
      error.function = "parsePicSetListItem";
      throw error;
    }

    //build full url
    const urlConstant = "http://www.kcna.kp";
    const url = urlConstant + href;

    //CHECK IF URL NEW HERE, throws error if not new
    const checkModel = new dbModel({ url: url }, CONFIG.articleList);
    await checkModel.urlNewCheck();

    //GET DATE
    const dateModel = new UTIL({ inputItem: listItem });
    const articleDate = await dateModel.parseListDate();

    //build obj
    const articleListObj = {
      url: url,
      date: articleDate,
    };

    return articleListObj;
  }

  //--------------------------

  //ARTICLE CONTENT / DATA ITEM SECTION

  async getArticleObj() {
    //get html for new article
    const { inputObj } = this.dataObject;

    const htmlModel = new KCNA(inputObj);
    const articleHTML = await htmlModel.getHTML();

    //throw error if cant get html
    if (!articleHTML) {
      const error = new Error("FAILED TO GET ARTICLE HTML");
      error.url = inputObj.url;
      error.function = "getArticleObj (MODEL)";
      throw error;
    }

    //parse the data from the html
    const parseModel = new Article({ html: articleHTML });
    const parseObj = await parseModel.parseArticleHMTL();
    if (!parseObj) return null;

    const articleObj = { ...inputObj, ...parseObj };

    //add scrapeId here
    articleObj.scrapeId = scrapeId;

    const storeModel = new dbModel(articleObj, CONFIG.articles);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return articleObj;
  }

  /**
   * Parses the html for KCNA articles, extracts obj items, and article pic items if present
   * @function parseArticleHMTL
   * @param {*} html for article
   * @returns obj of data extracted from html (including pics if present)
   */
  async parseArticleHMTL() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const parseObjModel = new Article({ document: document });
    const contentObj = await parseObjModel.getContentObj();
    const articlePicObj = await parseObjModel.getArticlePicObj();

    //if no pics return just content
    if (!articlePicObj) return contentObj;

    //otherwise combine into one obj and return
    const returnObj = { ...contentObj, ...articlePicObj };

    return returnObj;
  }

  async getContentObj() {
    const { document } = this.dataObject;
    // Extract the title
    const titleElement = document.querySelector(".article-main-title");
    const articleTitle = titleElement?.textContent?.replace(/\s+/g, " ").trim();

    //extract content text
    const textElement = document.querySelector(".content-wrapper");
    const textModel = new Article({ textElement: textElement });
    const articleText = await textModel.parseArticleText();

    //build obj
    const parseObj = {
      title: articleTitle,
      text: articleText,
    };

    return parseObj;
  }

  async parseArticleText() {
    const { textElement } = this.dataObject;
    const textArray = textElement.querySelectorAll("p"); //array of paragraph elements

    const paragraphArray = [];
    for (let i = 0; i < textArray.length; i++) {
      paragraphArray.push(textArray[i].textContent.trim());
    }

    // Join paragraphs with double newlines for better readability
    const articleText = paragraphArray.join("\n\n");
    return articleText;
  }

  async getArticlePicObj() {
    const { document } = this.dataObject;

    //get article PAGE (if exists) where all pics are displayed
    const mediaIconElement = document.querySelector(".media-icon");
    const picPageHref = mediaIconElement?.firstElementChild?.getAttribute("href");

    //return null if  pic doesnt exist
    if (!picPageHref) return null;

    //otherwise build pic / pic array
    const picPageURL = "http://www.kcna.kp" + picPageHref;
    const articlePicModel = new Article({ url: picPageURL });
    const picArray = await articlePicModel.getArticlePicArray();

    //if articlePicArray fails to return (load) return null (to download again later)
    if (!picArray || !picArray.length) return null;

    const articlePicObj = {
      picPageURL: picPageURL,
      picArray: picArray,
    };

    return articlePicObj;
  }

  async getArticlePicArray() {
    //get article pic html
    const htmlModel = new KCNA(this.dataObject);
    const html = await htmlModel.getHTML();

    //if fails return null
    if (!html) return null;

    //otherwise parse html
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //define return array
    const picArray = [];

    //get and loop through img elements
    const imgArray = document.querySelectorAll("img");
    for (let i = 0; i < imgArray.length; i++) {
      try {
        const urlModel = new Article({ imgItem: imgArray[i] });
        const articlePicURL = await urlModel.getArticlePicURL();
        if (!articlePicURL) continue;

        picArray.push(articlePicURL);

        //store url to picDB (so dont have to do again)
        const picDataModel = new dbModel({ url: articlePicURL }, CONFIG.picURLs);
        await picDataModel.storeUniqueURL();
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return picArray;
  }

  async getArticlePicURL() {
    const { imgItem } = this.dataObject;
    if (!imgItem) return null;

    //build picURL
    const imgSrc = imgItem.getAttribute("src");
    const urlConstant = "http://www.kcna.kp";

    const articlePicURL = urlConstant + imgSrc;
    return articlePicURL;
  }

  //-----------------

  //UPLOAD SECTION
  async postArticleObjTG() {
    const { inputObj } = this.dataObject;

    //throw error on bad input
    if (!inputObj) {
      const error = new Error("ARTICLE UPLOAD OBJ FUCKED");
      error.url = this.dataObject.url;
      error.function = "postArticlePicArrayTG";
      throw error;
    }

    //destructures // normalizes obj
    const normalModel = new UTIL({ inputObj: inputObj });
    const articleObj = await normalModel.normalizeInputsTG();

    //add channel to post to / SRAPE ID  HERE
    articleObj.tgUploadId = CONFIG.tgUploadId;
    articleObj.scrapeId = scrapeId;

    //post title
    const titleModel = new TG({ inputObj: articleObj });
    await titleModel.postTitleTG();

    //if no article pics
    if (!articleObj.picArray || !articleObj.picArray.length) {
      //post content
      const noPicsModel = new Article({ inputObj: articleObj });
      const noPicsData = await noPicsModel.postArticleContentTG();
      return noPicsData;
    }

    //otherwise post pics then content
    const picModel = new Pic({ inputObj: articleObj });
    await picModel.postPicArrayTG();
    const articleModel = new Article({ inputObj: articleObj });
    const articlePicData = await articleModel.postArticleContentTG();

    return articlePicData;
  }

  async postArticleContentTG() {
    const { inputObj } = this.dataObject;
    const contentObj = { ...inputObj };

    //BUILD TEXT ARRAY
    const textModel = new TG({ inputObj: inputObj });
    const textArray = await textModel.buildTextArrayTG();

    //add text array to obj
    contentObj.textArray = textArray;

    //post it
    const postContentModel = new TG({ inputObj: contentObj });
    const postContentData = await postContentModel.postTextArrayTG();

    return postContentData;
  }
}

export default Article;
