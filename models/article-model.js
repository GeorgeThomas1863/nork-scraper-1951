import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
import Pic from "./pic-model.js";
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

  //FOR ARTICLE LIST

  /**
   * Fetches HTML content from the specified URL (works for any url), returns as text
   * @function parseArticleList
   * @returns {array} ARRAY of sorted OBJECTs
   */
  async parseArticleList() {
    // Parse the HTML using JSDOM
    const dom = new JSDOM(this.dataObject);
    const document = dom.window.document;

    // Find the element with class "article-link"
    const articleLinkElement = document.querySelector(".article-link");

    //if no article links (shouldnt happen)
    if (!articleLinkElement) return null;

    // get array of article list (from link elements)
    const linkElementArray = articleLinkElement.querySelectorAll("a");
    const articleListArray = await this.parseLinkArray(linkElementArray);

    //sort the array
    const sortModel = new UTIL(articleListArray);
    const articleListSort = await sortModel.sortArrayByDate();

    //add article ID
    const idModel = new UTIL(articleListSort);
    const articleListNormal = await idModel.addArticleId();

    const storeDataModel = new dbModel(articleListNormal, CONFIG.articles);
    const storeData = await storeDataModel.storeArray();
    console.log(storeData);

    //for tracking
    return articleListNormal;
  }

  async parseLinkArray(inputArray) {
    //loop through a tags and pull out hrefs
    const articleListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const listItem = inputArray[i];
      const articleListObj = await this.buildArticleListObj(listItem);

      articleListArray.push(articleListObj); //add to array
    }

    return articleListArray;
  }

  async buildArticleListObj(listItem) {
    const href = listItem.getAttribute("href");
    if (!href) return;

    //build full url
    const urlConstant = "http://www.kcna.kp";
    const url = urlConstant + href;

    //GET DATE
    const dateElement = listItem.querySelector(".publish-time");
    if (!dateElement) return;
    const dateText = dateElement.textContent.trim();
    const articleDate = await this.parseDateElement(dateText);

    //build obj
    const articleListObj = {
      url: url,
      date: articleDate,
    };

    return articleListObj;
  }

  //breaks out date parsing
  async parseDateElement(dateText) {
    //return null if empty
    if (!dateText) return null;

    const dateRaw = dateText.replace(/[\[\]]/g, "");

    // Convert the date string (YYYY.MM.DD) to a JavaScript Date object, then split to arr
    const dateArr = dateRaw.split(".");
    const year = parseInt(dateArr[0]);
    // JS months are 0-based (subtract 1 at end)
    const month = parseInt(dateArr[1]);
    const day = parseInt(dateArr[2]);

    // Validate the date; if fucked return null
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const articleDate = new Date(year, month - 1, day);
    return articleDate;
  }

  //--------------------------

  //FOR ARTICLE OBJ
  async buildArticleObjArray() {
    const inputArray = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    //loop (dont check if stored since inputArray based on mongo compare earlier)
    const articleObjArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const inputObj = inputArray[i];
      const articleObj = await this.buildArticleObj(inputObj);
      if (!articleObj) return null;

      articleObjArray.push(articleObj);
    }

    return articleObjArray;
  }

  async buildArticleObj(inputObj) {
    const htmlModel = new KCNA(inputObj);
    const articleHTML = await htmlModel.getHTML();
    if (!articleHTML) return null;

    const parseObj = await this.parseArticleHTML(articleHTML);
    if (!parseObj) return null;

    const articleObj = { ...inputObj, ...parseObj };
    const storeModel = new dbModel(articleObj, CONFIG.articleDownloaded);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);
    return articleObj;
  }

  async parseArticleHTML(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract the title - KCNA uses article-main-title class
    const titleElement = document.querySelector(".article-main-title");
    const articleTitle = titleElement?.textContent?.replace(/\s+/g, " ").trim();

    //break out content parsing
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
    const articlePicArray = await this.buildArticlePicArray(picPageURL);

    //add to object and return
    parseObj.picPageURL = picPageURL;
    parseObj.articlePicArray = articlePicArray;
    return parseObj;
  }

  async buildArticlePicArray(url) {
    //get the html, build dom
    const htmlModel = new KCNA(url);
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
      const imgItem = imgArray[i];
      const articlePicObj = await this.getArticlePicObj(imgItem);
      if (!articlePicObj) return null;

      articlePicArray.push(articlePicObj);
    }

    return articlePicArray;
  }

  async getArticlePicObj(imgItem) {
    if (!imgItem) return null;

    const imgSrc = imgItem.getAttribute("src");
    const picObjModel = new Pic(imgSrc);
    const articlePicObj = await picObjModel.buildArticlePicObj();
    return articlePicObj;
  }

  //-----------------

  async parseArticleText(inputArray) {
    const paragraphArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      paragraphArray.push(inputArray[i].textContent.trim());
    }

    // Join paragraphs with double newlines for better readability
    const articleText = paragraphArray.join("\n\n");
    return articleText;
  }
}

export default Article;
