import { JSDOM } from "jsdom";

//FOR VID LIST PAGE SECTION

/**
 * Extracts articleListPage data items, sorts / normalizes them, then stores them
 * @function parseVidList
 * @returns {array} ARRAY of sorted OBJECTs (for tracking)
 */
export const buildVidList = async (html) => {
  // Parse the HTML using JSDOM
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Select all the elements that contain individual video data
  const vidWrapperArray = document.querySelectorAll(".video-wrapper");
  if (!vidWrapperArray || !vidWrapperArray.length) return null;

  const vidListArray = await this.parseWrapperArray(vidWrapperArray);
  return vidListArray;
};

//VID OBJ SECTION
export const buildVidContent = async (inputArray) => {
  const vidPageArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const vidPageObj = inputArray[i];
      const vidURL = await this.getVidURL(vidPageObj);
      vidPageObj.vidURL = vidURL;

      //store it
      const storeVidPageModel = new dbModel(vidPageObj, CONFIG.vidPagesDownloaded);
      const storeVidPage = await storeVidPageModel.storeUniqueURL();
      console.log(storeVidPage);

      //add to array
      vidPageArray.push(vidPageObj);

      //store to vidURLs
      const vidURLModel = new dbModel({ url: vidURL }, CONFIG.vidURLs);
      await vidURLModel.storeUniqueURL();
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //return for tracking
  return vidPageArray;
};

//IN PROGRESS
export const getVidDataArray = async (inputArray) => {
  for (let i = 0; i < inputArray.length; i++) {
    const vidItem = inputArray[i];
    console.log("VID ITEM FAGGOT");
    console.log(vidItem);
  }
};
