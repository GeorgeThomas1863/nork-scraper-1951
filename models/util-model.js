import CONFIG from "../config/config.js";
import dbModel from "./db-model.js";
import { scrapeState } from "../src/scrape-state.js";

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

  async addListId() {
    const { inputArray, inputType } = this.dataObject;
    const { articleList, picSetList, vidPageList } = CONFIG;
    if (!inputArray || !inputArray.length || !inputType) return null;

    let collection = "";
    switch (inputType) {
      case "articleId":
        collection = articleList;
        break;

      case "picSetId":
        collection = picSetList;
        break;

      case "vidPageId":
        collection = vidPageList;
        break;

      default:
        return null;
    }

    const maxModel = new UTIL({ inputType: inputType, collection: collection });
    const currentId = await maxModel.getCurrentId();

    const returnArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const normalObj = { ...inputArray[i] };
      normalObj[inputType] = currentId + i;

      returnArray.push(normalObj);
    }

    return returnArray;
  }

  async getCurrentId() {
    const { inputType, collection } = this.dataObject;
    const dataModel = new dbModel({ keyToLookup: inputType }, collection);
    const currentId = await dataModel.findMaxId();

    //if doesnt exists
    if (!currentId) return 0;

    //otherwise return stored value +1
    return currentId + 1;
  }

  async getNextId() {
    const { type } = this.dataObject;
    if (!type) return null;

    let dataModel = "";
    switch (type) {
      case "pics":
        dataModel = new dbModel({ keyToLookup: "picId" }, CONFIG.pics);
        break;

      case "vids":
        dataModel = new dbModel({ keyToLookup: "vidId" }, CONFIG.vids);
        break;

      default:
        return null;
    }

    const maxId = await dataModel.findMaxId();

    if (!maxId) return 1;

    return maxId + 1;
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

  //ADD TIME based on scrape start here
  async parseListDate() {
    const { inputItem } = this.dataObject;
    const { scrapeStartTime } = scrapeState;

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

    //if no startTime return just date
    if (!scrapeStartTime) return normalDate;

    const scrapeHour = scrapeStartTime.getHours();
    const scrapeMinute = scrapeStartTime.getMinutes();

    normalDate.setHours(scrapeHour);
    normalDate.setMinutes(scrapeMinute);

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
}

export default UTIL;
