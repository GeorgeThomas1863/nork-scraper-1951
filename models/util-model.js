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
  async addArticleId() {
    const inputArray = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    const currentArticleId = await this.getArticleId();

    const returnArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const inputObj = inputArray[i];
      const normalObj = { ...inputObj };

      //add in articleId
      normalObj.articleId = i + currentArticleId;

      // Add to the output array
      returnArray.push(normalObj);
    }

    return returnArray;
  }

  async getArticleId() {
    const dataModel = new dbModel({ keyToLookup: "articleId" }, CONFIG.articles);
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
}

export default UTIL;
