import CONFIG from "../config/config.js";
import dbModel from "./db-model.js";

class UTIL {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

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

  async sortArrayByArticleId() {
    const { inputArray } = this.dataObject;
    //return null on blank input
    if (!inputArray || !inputArray.length) return null;

    // Create a copy of the array to avoid modifying the original
    const sortArray = [...inputArray];

    //sort input array by DATE OLDEST to NEWEST
    sortArray.sort((a, b) => {
      // Convert datetime strings to Date objects if needed
      const idA = a.articleId;
      const idB = b.articleId;

      return idA - idB;
    });

    return sortArray;
  }

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

  async normalizeInputsTG() {
    const { inputObj } = this.dataObject;
    const { url, date, title } = inputObj;

    const normalObj = { ...inputObj };

    //normalize
    normalObj.urlNormal = url.replace(/\./g, "[.]").replace(/:/g, "[:]");
    normalObj.dateNormal = new Date(date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    // normalObj.titleNormal = `<b>${title}</b>`;
    normalObj.titleNormal = "<b>" + title + "</b>";

    return normalObj;
  }

  async showScrapeTime() {
    const { startTime, endTime } = this.dataObject;

    //in milliseconds convert to seconds
    const scrapeSeconds = (endTime - startTime) / 1000;

    //if short
    if (scrapeSeconds < 120) {
      return console.log("FINISHED SCRAPE FOR NEW DATA, SCRAPE TOOK " + scrapeSeconds + " seconds");
    }

    //otherwise return in minutes
    const scrapeMinutes = scrapeSeconds / 60 + " minutes";
    return console.log("FINISHED SCRAPE FOR NEW DATA, SCRAPE TOOK " + scrapeMinutes + " minutes");
  }
}

export default UTIL;
