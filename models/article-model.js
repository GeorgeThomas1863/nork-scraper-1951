import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
// import Pic from "./pic-model.js";
import UTIL from "./util-model.js";

/**
 * @class Article
 * @description Does shit with KCNA Articles (gets them, parses html)
 */
class Article {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //------------
  //PARSE DATA

  //FOR ARTICLE LIST PAGE SECTION

  /**
   * Parses array of article link items (loops through), returns array of (unsorted) articleListObjs
   * @function parseLinkArray
   * @param {*} inputArray (array of article link items)
   * @returns //array of (unsorted) articleListObjs
   */
  async parseLinkArray(inputArray) {
    //loop through a tags and pull out hrefs
    const articleListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const listItem = inputArray[i];
      const articleListObj = await this.getArticleListObj(listItem);

      articleListArray.push(articleListObj); //add to array
    }

    return articleListArray;
  }

  /**
   * Parses individual article link item, builds / returns single articleListObj
   * @function getArticleListObj
   * @param {*} listItem article link item
   * @returns articleListObj (with url / date extracted)
   */
  async getArticleListObj(listItem) {
    const href = listItem.getAttribute("href");
    if (!href) return;

    //build full url
    const urlConstant = "http://www.kcna.kp";
    const url = urlConstant + href;

    //GET DATE
    const dateElement = listItem.querySelector(".publish-time");
    if (!dateElement) return;
    const dateText = dateElement.textContent.trim();
    const dateModel = new UTIL(dateText);
    const articleDate = await dateModel.parseDateElement();

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
  async getArticleObj(inputObj) {
    //get html for new article
    const htmlModel = new KCNA(inputObj);
    const articleHTML = await htmlModel.getHTMLAxios();
    if (!articleHTML) return null;

    //parse the data from the html
    const parseObj = await this.parseArticleHMTL(articleHTML);
    if (!parseObj) return null;

    const articleObj = { ...inputObj, ...parseObj };

    const storeModel = new dbModel(articleObj, CONFIG.articlesDownloaded);
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
  async parseArticleHMTL(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract the title
    const titleElement = document.querySelector(".article-main-title");
    const articleTitle = titleElement?.textContent?.replace(/\s+/g, " ").trim();

    //extract content text
    const textElement = document.querySelector(".content-wrapper");
    const textArray = textElement.querySelectorAll("p"); //array of paragraph elements
    const articleText = await this.parseArticleText(textArray);

    //build obj
    const parseObj = {
      title: articleTitle,
      text: articleText,
    };

    //get article PAGE (if exists) where all pics are displayed
    const mediaIconElement = document.querySelector(".media-icon");
    const picPageHref = mediaIconElement?.firstElementChild?.getAttribute("href");

    //return article obj if no pic
    if (!picPageHref) return parseObj;

    //otherwise build pic / pic array
    const picPageURL = "http://www.kcna.kp" + picPageHref;
    const articlePicArray = await this.getArticlePicArray(picPageURL);

    //if articlePicArray fails to return (load) return null (to download again later)
    if (!articlePicArray || !articlePicArray.length) return null;

    //add to object and return
    parseObj.picPageURL = picPageURL;
    parseObj.articlePicArray = articlePicArray;
    return parseObj;
  }

  /**
   * Extracts text content from article (array of paragraph items)
   * @function parseArticleText
   * @param {*} inputArray array of paragraph items containing article text
   * @returns article text as a joined string
   */
  async parseArticleText(inputArray) {
    const paragraphArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      paragraphArray.push(inputArray[i].textContent.trim());
    }

    // Join paragraphs with double newlines for better readability
    const articleText = paragraphArray.join("\n\n");
    return articleText;
  }

  /**
   * Extracts articlPicArray by parsing article pic page (if present)
   * AFTER adding to array (so not impacted by pics already downloaded) stores NEW pics in pic db for later downloading
   * @param {} picPageURL url for article pic page
   * @returns array of articlePicObjs
   */
  async getArticlePicArray(picPageURL) {
    //get the html, build dom
    const htmlModel = new KCNA({ url: picPageURL });
    const html = await htmlModel.getHTMLAxios();

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
        const articlePicURL = await this.getArticlePicURL(imgArray[i]);
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
  async getArticlePicURL(imgItem) {
    if (!imgItem) return null;

    //build picURL
    const imgSrc = imgItem.getAttribute("src");
    const urlConstant = "http://www.kcna.kp";

    const articlePicURL = urlConstant + imgSrc;
    return articlePicURL;
  }

  //-----------------
}

export default Article;
