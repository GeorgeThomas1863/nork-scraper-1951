/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class KCNA {
  /**
   * @constructor
   * @param {Object} dataObject - The data object with request parameters
   */
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Fetches HTML content from the specified URL (works for any url), returns as text
   * @function getHTML
   * @returns {Promise<string>} The HTML content as text
   * @throws {Error} Logs the error to console if the request fails
   */
  async getHTML() {
    try {
      const res = await fetch(this.dataObject.url);
      // console.log(res);
      const data = await res.text();
      return data;
    } catch (error) {
      console.log(error);
    }
  }
}

export default KCNA;
