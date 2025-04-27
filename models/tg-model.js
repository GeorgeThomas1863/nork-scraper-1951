//PROB SHOULD SWITCH EVERYTHING TO AXIOS RATHER THAN FETCH

/**
 * @fileoverview Self build TG API request handler
 * Has GET, POST [Edit Caption / Send Message], POST Pic, handles TG bot rate limiting
 * @module models/TgReq
 */

//import mods
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import tokenArray from "../config/tg-bot.js";

let tokenIndex = 0;

class TgReq {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Sends a GET request to the Telegram API to fetch updates
   * @function tgGet
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgGet() {
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.dataObject.offset}`;

    //send data
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Sends a POST request to the Telegram API with the specified command
   * @function tgPost
   * @params command (command to send to tg); tokenIndex
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPost(command) {
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/${command}`;

    //send data
    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(this.dataObject),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Uploads and sends a photo to a Telegram chat using the Telegram API
   * @function tgPicFS
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPicFS() {
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    //build form
    const form = new FormData();
    form.append("chat_id", this.dataObject.chatId), form.append("photo", fs.createReadStream(this.dataObject.picPath));

    //upload Pic
    try {
      const response = await axios.post(url, form, {
        headers: form.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.log("UPLOAD FUCKED");
      if (error && error.response && error.response.data) {
        console.log(error.response.data);
        return error.response.data;
      } else {
        return error;
      }
    }
  }

  //----------------------------

  /**
   * Handles TG rate limiting by checking response looking for error code 429) and rotates to NEXT bot / token
   * if error code present
   * @function checkToken
   * @param {Object} data - Response data from Telegram API
   * @returns {number|null} New token index if rotated, null if no rotation needed
   */
  async checkToken(data) {
    //429 bot fucked error
    if (!data || (data && data.ok) || (data && !data.ok && data.error_code !== 429)) return null;

    tokenIndex++;
    if (tokenIndex > 11) tokenIndex = 0;

    console.log("GOT 429 ERROR, TRYING NEW FUCKING BOT. TOKEN INDEX: " + tokenIndex);
    return tokenIndex;
  }

  //----------------------------

  //below specific methods prob not necessary, but keeping for now

  //PROB NOT NECESSARY
  /**
   * TG sendMessage API, sends message chunk to TG (chunk before using) with auto token rotation
   * @function sendMessageChunkTG
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Response data from Telegram API
   */
  async sendMessageChunkTG() {
    const tgModel = new TgReq(this.dataObject);

    //check token
    let data = await tgModel.tgPost("sendMessage", tokenIndex);
    const checkData = this.checkToken(data);
    if (checkData) data = await tgModel.tgPost("sendMessage", tokenIndex); //run again

    return data;
  }

  //MIGHT WANT TO CHANGE HOW BELOW HAPPENS
  /**
   * TG editMessageCaption API; edits the caption of a previously pic / message
   * @function editCaptionTG
   * @param {Object} inputObj - Response object from a previous sendPhoto API call, custom caption
   * @returns {Promise<Object>} Response data from Telegram API
   */
  async editCaptionTG(caption) {
    //build params
    const params = {
      chat_id: this.dataObject.result.chat.id,
      message_id: this.dataObject.result.message_id,
      caption: caption,
    };

    const tgModel = new TgReq(params);

    let data = await tgModel.tgPost("editMessageCaption", tokenIndex);
    const checkData = this.checkToken(data);
    if (checkData) data = await tgModel.tgPost("editMessageCaption", tokenIndex); //if fucked run again

    return data;
  }

  //PROB NOT NECESSARY
  /**
   * TG sendPhoto API, posts images to TG channel / user, with auto token rotation
   * @function uploadPicsTG
   * @param {Object} params - Upload parameters
   * @returns {Promise<Object>} Response data from Telegram API
   */
  async uploadPicsTG() {
    const tgModel = new TgReq(this.dataObject);

    //check token
    let data = await tgModel.tgPicFS(tokenIndex);
    const checkData = this.checkToken(data);
    if (checkData) data = await tgModel.tgPicFS(tokenIndex); //run again

    return data;
  }
}

export default TgReq;
