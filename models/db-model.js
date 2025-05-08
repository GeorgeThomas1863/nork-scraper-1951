//import mongo
import * as db from "../data/db.js";

//connect to db AGAIN here just to be safe
await db.dbConnect();

//IF HATE SELF REFACTOR INTO EXTENDED CLASSES (one for each functionality)
/**
 * @class dbModel
 * @description Handles MongoDB database operations across various collections
 */
class dbModel {
  constructor(dataObject, collection) {
    this.dataObject = dataObject;
    this.collection = collection;
  }

  //STORE STUFF

  async storeAny() {
    // await db.dbConnect();
    const storeData = await db.dbGet().collection(this.collection).insertOne(this.dataObject);
    return storeData;
  }

  async storeUniqueURL() {
    // await db.dbConnect();
    await this.urlNewCheck(); //check if new

    const storeData = await this.storeAny();
    return storeData;
  }

  async storeArray() {
    //return null on blank input
    const storeArray = [];
    const inputArray = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    // loop through input array (of OBJs) adding articleId identifier
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const inputObj = inputArray[i];

        //throws error if not unique
        //(claude claims i can instantiate a new instance from within this class)
        const storeModel = new dbModel(inputObj, this.collection);
        const storeData = await storeModel.storeUniqueURL();
        console.log(storeData);
        storeArray.push(storeData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //just for tracking, not necessary
    return storeArray;
  }

  //-----------

  //UPDATES STUFF

  async updateScrapeId() {
    const { scrapeId, endTime, startTime } = this.dataObject;
    const scrapeTime = endTime - startTime;
    const updateData = await db.dbGet().collection(this.collection).updateMany({ _id: scrapeId }, { $set: { endTime: endTime, scrapeTime: scrapeTime } }); //prettier-ignore
    console.log("UPDATE DATA");
    console.log(updateData);
    return updateData;
  }

  //--------------

  //GETS STUFF

  /**
   * Retrieves all documents from the specified collection
   * @function getAll (!!!CHANGED NAMED FROM findAny)
   * @returns {Promise<Array<Object>>} Array of all documents in the collection
   */
  async getAll() {
    // await db.dbConnect();
    const arrayData = await db.dbGet().collection(this.collection).find().toArray();
    return arrayData;
  }

  async getUniqueItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const dataArray = await db.dbGet().collection(this.collection).findOne({ [keyToLookup]: itemValue }); //prettier-ignore
    return dataArray;
  }

  /**
   * Retrieves the most recent items from a collection based on a specified key
   * @function getLastItemsArray
   * @returns {Promise<Array<Object>>} Array of the most recent documents
   */
  async getLastItemsArray() {
    const keyToLookup = this.dataObject.keyToLookup;
    const howMany = +this.dataObject.howMany;

    //get data
    const dataArray = await db.dbGet().collection(this.collection).find().sort({ [keyToLookup]: -1 }).limit(howMany).toArray(); //prettier-ignore

    return dataArray;
  }

  //-------------

  //CHECK STUFF

  /**
   * Checks if URL already exists in the collection (throws error if it does);
   * NOTE CHANGED NAME TO REMOVE dataObject key input
   * @function urlNewCheck
   * @returns {Promise<boolean>} True if the URL is new (not in the collection)
   */
  async urlNewCheck() {
    const alreadyStored = await db.dbGet().collection(this.collection).findOne({ url: this.dataObject.url });

    if (alreadyStored) {
      const error = new Error("URL ALREADY STORED");
      error.url = this.dataObject.url;
      error.function = "Store Unique URL";
      throw error;
    }

    //otherwise return trun
    return true;
  }

  /**
   * Finds URLs in collection1 that don't exist in collection2
   * @function findNewURLs
   * @returns {Promise<Array<Object>>} Array of documents with unique URLs
   */
  async findNewURLs() {
    // await db.dbConnect();
    //putting collections in dataObject for no reason, if hate self refactor rest of project like this
    const collection1 = this.dataObject.collection1; //OLD THING (compare against)
    const collection2 = this.dataObject.collection2; //NEW THING (process you are currently doing / handling)

    //run check
    const distinctURLs = await db.dbGet().collection(collection2).distinct("url");
    const newURLsArray = await db.dbGet().collection(collection1).find({ ["url"]: { $nin: distinctURLs } }).toArray(); //prettier-ignore
    return newURLsArray;
  }

  /**
   * Finds items in collection1 that either don't exist in collection2
   * or have a larger size in collection1 than in collection2 (pics that didnt properly download)
   * @function findNewURLs
   * @returns {Promise<Array<Object>>} Array of documents with unique URLs
   */
  async findNewPicsBySize() {
    const collection1 = this.dataObject.collection1; //OLD THING (compare against)
    const collection2 = this.dataObject.collection2; //NEW THING (process you are currently doing / handling)

    // Get all docs from collection1
    const collection1Data = await db.dbGet().collection(collection1).find().toArray();

    // Create an array to store the matching results
    const docArray = [];

    // Process each document in collection1
    for (const doc of collection1Data) {
      // Check if this URL exists in collection2
      const matchingDoc = await db.dbGet().collection(collection2).findOne({ url: doc.url });

      // Add to results if: The URL doesn't exist in collection2, or picSize in collection1 is larger than in collection2
      if (!matchingDoc || doc.picSize > matchingDoc.picSize) {
        docArray.push(doc);
      }
    }

    return docArray;
  }

  /**
   * Finds / returns the maximum value of a specified key in the collection
   * @function findMaxId
   * @returns {Promise<number|null>} The maximum value found, or null if collection is empty
   */
  async findMaxId() {
    const keyToLookup = this.dataObject.keyToLookup;
    const dataObj = await db.dbGet().collection(this.collection).find().sort({ [keyToLookup]: -1 }).limit(1).toArray(); //prettier-ignore

    if (!dataObj || !dataObj[0]) return null;

    return +dataObj[0][keyToLookup];
  }
}

export default dbModel;
