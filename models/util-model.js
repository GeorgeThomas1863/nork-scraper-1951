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
  async sortArrayByDate() {
    const inputArray = this.dataObject;
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
   * @function addArticleId
   * @returns current article Id
   */
  async addArticleId(collection, type) {
    const inputArray = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    const currentItemId = await this.getArticleId(collection);

    const returnArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const inputObj = inputArray[i];
      const normalObj = { ...inputObj };

      //add in articleId
      normalObj.type = i + currentItemId;

      console.log("ARTICLE LIST OBJ");
      console.log(normalObj);

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

  async getCurrentKCNAId() {
    const dataModel = new dbModel(this.dataObject, CONFIG.pics);
    const maxId = await dataModel.findMaxId();

    //no id on first lookup
    if (!maxId || CONFIG.currentId > maxId) return CONFIG.currentId;

    //otherwise calculate it
    return maxId;
  }

  /**
   * Parses date element for article list item format (MIGHT be able to use elsewhere; move to UTIL)
   * @function parseDateElement
   * @param {*} dateText raw date text from article list format
   * @returns date as standard JS date obj (for storing in Mongo)
   */
  async parseDateElement() {
    const dateText = this.dataObject
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
}

export default UTIL;
