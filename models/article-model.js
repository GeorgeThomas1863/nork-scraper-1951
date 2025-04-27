import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
// import Pic from "./pic-model.js";
import UTIL from "./util-model.js";

import { postArticleTitleTG, postPicTG } from "../src/tg-post.js";

/**
 * @class Article
 * @description Does shit with KCNA Articles (gets them, parses html)
 */
class Article {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //-----------

  //PARSE ARTICLE LIST PAGE SECTION

  async getArticleListArray() {
    const { html } = this.dataObject;

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

    //extract out the articleListObjs
    const articleLinkModel = new Article({ inputArray: linkElementArray });
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
    const { inputArray } = this.dataObject;

    //loop through a tags and pull out hrefs
    const articleListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const articleListModel = new Article({ listItem: inputArray[i] });
        const articleListObj = await articleListModel.parseArticleListItem();

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

  //ARTICLE DATA ITEM SECTION

  /**
   * Builds articleObj by parsing articleHTML, combining with inputObj then storing it
   * [new check NOT necessary bc way download array generated]
   * @function buildArticleObj
   * @param {*} inputObj articleItem to download from downloadArray
   * @returns
   */
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

  /**
   * Extracts text content from article (array of paragraph items)
   * @function parseArticleText
   * @param {*} inputArray array of paragraph items containing article text
   * @returns article text as a joined string
   */
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
    const articlePicArray = await articlePicModel.getArticlePicArray();

    //if articlePicArray fails to return (load) return null (to download again later)
    if (!articlePicArray || !articlePicArray.length) return null;

    const articlePicObj = {
      picPageURL: picPageURL,
      articlePicArray: articlePicArray,
    };

    return articlePicObj;
  }

  /**
   * Extracts articlPicArray by parsing article pic page (if present)
   * AFTER adding to array (so not impacted by pics already downloaded) stores NEW pics in pic db for later downloading
   * @param {} picPageURL url for article pic page
   * @returns array of articlePicObjs
   */
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
    const articlePicArray = [];

    //get and loop through img elements
    const imgArray = document.querySelectorAll("img");
    for (let i = 0; i < imgArray.length; i++) {
      try {
        const urlModel = new Article({ imgItem: imgArray[i] });
        const articlePicURL = await urlModel.getArticlePicURL();
        if (!articlePicURL) continue;

        articlePicArray.push(articlePicURL);

        //store url to picDB (so dont have to do again)
        const picDataModel = new dbModel({ url: articlePicURL }, CONFIG.picURLs);
        await picDataModel.storeUniqueURL();
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return articlePicArray;
  }

  /**
   * Gets the article picObj by using Pic model, returns picObj
   * @param {*} imgItem image element with link to pic
   * @returns returns articlePicObj
   */
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

  async postArticleArrayTG() {
    const { inputArray } = this.dataObject;

    const uploadDataArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const uploadModel = new Article({ inputObj: inputArray[i] });
        const uploadArticleData = await uploadModel.postArticleObjTG();
        if (!uploadArticleData) continue;

        uploadDataArray.push(uploadArticleData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }
  }

  async postArticleObjTG() {
    const { inputObj } = this.dataObject;

    const normalModel = new UTIL({ inputObj: inputObj });
    const articleObj = await normalModel.normalizeInputsTG();

    //post title
    await postArticleTitleTG(articleObj);

    const articlePicModel = new Article({ inputObj: articleObj });
    const articlePicArrayData = await articlePicModel.postArticlePicArrayTG();

    //FIRST POST TITLE AND DATE
  }

  async postArticlePicArrayTG() {
    const { inputObj } = this.dataObject;

    if (!inputObj || !inputObj.picArray || !inputObj.picArray.length) return null;
    const { picArray } = inputObj;

    for (let i = 0; i < picArray.length; i++) {
      const postPicData = await postPicTG(picArray[i]);
    }
  }
}

export default Article;
