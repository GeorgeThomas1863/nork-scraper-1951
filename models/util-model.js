import CONFIG from "../config/scrape-config.js";
import dbModel from "./db-model.js";

/**
 * @class UTIL
 * @description does utility shit
 */
class UTIL {
  /**
   * @constructor
   * @param {Object} dataObject - The data object with request parameters
   */
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Function that sorts an array of article OBJECTS by DATE
   * @function sortArrayByDate
   * @param {} inputArray
   * @returns sorted Array of article OBJECTS (sorted by date oldest to newest)
   */
  async sortArrayByKcnaId() {
    const { inputArray } = this.dataObject;
    //return null on blank input
    if (!inputArray || !inputArray.length) return null;

    // Create a copy of the array to avoid modifying the original
    const sortArray = [...inputArray];

    //sort input array by DATE OLDEST to NEWEST
    sortArray.sort((a, b) => {
      // Convert datetime strings to Date objects if needed
      const kcnaA = a.kcnaId;
      const kcnaB = b.kcnaId;

      return kcnaA - kcnaB;
    });

    return sortArray;
  }

  /**
   * Function that sorts an array of article OBJECTS by DATE
   * @function sortArrayByDate
   * @param {} inputArray
   * @returns sorted Array of article OBJECTS (sorted by date oldest to newest)
   */
  async sortArrayByDate() {
    const { inputArray } = this.dataObject;
    //return null on blank input
    if (!inputArray || !inputArray.length) return null;

    // Create a copy of the array to avoid modifying the original
    const sortArray = [...inputArray];

    //sort input array by DATE OLDEST to NEWEST
    sortArray.sort((a, b) => {
      // Convert datetime strings to Date objects if needed
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      return dateA - dateB;
    });

    return sortArray;
  }

  /**
   * Adds current article Id to array (by looping through / getting current article ID)
   * @function addListId
   * @returns current article Id
   */
  async addListId(collection, inputType) {
    const { inputArray } = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    const currentItemId = await this.getArticleId(collection);

    const returnArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const inputObj = inputArray[i];
      const normalObj = { ...inputObj };

      //add in articleId
      normalObj[inputType] = i + currentItemId;

      // Add to the output array
      returnArray.push(normalObj);
    }

    return returnArray;
  }

  async getArticleId(collection) {
    const dataModel = new dbModel({ keyToLookup: "articleId" }, collection);
    const articleIdStored = await dataModel.findMaxId();

    //if doesnt exists
    if (!articleIdStored) return 0;

    //otherwise return stored value +1
    return articleIdStored + 1;
  }

  async getCurrentKCNAId() {
    const dataModel = new dbModel(this.dataObject, CONFIG.pics);
    const maxId = await dataModel.findMaxId();

    //no id on first lookup
    if (!maxId || CONFIG.currentId > maxId) return CONFIG.currentId;

    //otherwise calculate it
    return maxId;
  }

  async getDateArray() {
    const currentDate = new Date();
    const dateArray = [];

    for (let i = -1; i < 2; i++) {
      const date = new Date(currentDate);
      const currentMonth = date.getMonth();
      //plus 1 needed bc month 0 indexed
      const monthRaw = currentMonth + i + 1;

      // Pad month with leading zero if needed
      const month = monthRaw.toString().padStart(2, "0");

      // Get full year
      const year = date.getFullYear();

      // Add month+year string to result array
      dateArray.push(year + "" + month);
    }

    return dateArray;
  }

  /**
   * Parses date element for article list item format (MIGHT be able to use elsewhere; move to UTIL)
   * @function parseDateElement
   * @param {*} dateText raw date text from article list format
   * @returns date as standard JS date obj (for storing in Mongo)
   */
  async parseListDate() {
    const { inputItem } = this.dataObject;

    const dateElement = inputItem.querySelector(".publish-time");
    if (!dateElement) return null;

    //extract dateText
    const dateRaw = dateElement.textContent.trim();
    if (!dateRaw) return null;
    const dateText = dateRaw.replace(/[\[\]]/g, "");

    // Convert the date string (YYYY.MM.DD) to a JavaScript Date object, then split to arr
    const dateArr = dateText.split(".");
    const year = parseInt(dateArr[0]);
    // JS months are 0-based (subtract 1 at end)
    const month = parseInt(dateArr[1]);
    const day = parseInt(dateArr[2]);

    // Validate the date; if fucked return null
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const normalDate = new Date(year, month - 1, day);
    return normalDate;
  }

  //BELOW SHOULDNT BE NECESSARY
  /**
   * Parses date element for article list item format (MIGHT be able to use elsewhere; move to UTIL)
   * @function parseDateElement
   * @param {*} dateText raw date text from article list format
   * @returns date as standard JS date obj (for storing in Mongo)
   */
  async parseDateElement() {
    const { dateText } = this.dataObject;
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

    const normalDate = new Date(year, month - 1, day);
    return normalDate;
  }

  /**
   * Normalizes article data for telegram posting format
   * @function normalizeInputsTG
   * @params inputObj wiht raw article data
   * @returns Normalized object with telegram-friendly formatting
   */
  async normalizeInputsTG() {
    const { inputObj } = this.dataObject;
    const { url, date, title } = inputObj;

    const normalObj = { ...inputObj };

    //normalize
    normalObj.urlNormal = url.replace(/\./g, "[.]").replace(/:/g, "[:]");
    normalObj.dateNormal = new Date(date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    normalObj.titleNormal = "<b><h1>" + title + "</h1></b>";

    return normalObj;
  }
}

export default UTIL;

// const outputObj = {
//   url: urlNormal,
//   date: dateNormal,
//   title: titleNormal,
//   text: inputObj.text,
// };
