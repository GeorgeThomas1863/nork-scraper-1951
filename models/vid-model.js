/**
 * @class Vid
 * @description Does shit with KCNA Vid (gets them, parses html)
 */
class Vid {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //------------
  //PARSE DATA

  //FOR ARTICLE LIST PAGE SECTION

  /**
   * Extracts articleListPage data items, sorts / normalizes them, then stores them
   * @function parseVidList
   * @returns {array} ARRAY of sorted OBJECTs (for tracking)
   */
  async parseVidList() {
    // Parse the HTML using JSDOM
    console.log("BUILD FUCKER");
  }
}

export default Vid;
