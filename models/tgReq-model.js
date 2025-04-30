//SWITCH EVERYTING TO AXIOS NOT FETCH

/**
 * @fileoverview Self build TG API request handler / library
 * @module models/TgReq
 */

//import mods
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import CONFIG from "../config/scrape-config.js";
import tokenArray from "../config/tg-bot.js";
import dbModel from "./db-model.js";

class TgReq {
  static tokenIndex = 0;

  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async checkToken() {
    const { data } = this.dataObject;

    //429 bot fucked error
    if (!data || (data && data.ok) || (data && !data.ok && data.error_code !== 429)) return null;

    console.log("AHHHHHHHHHH");

    TgReq.tokenIndex++;
    if (TgReq.tokenIndex > 11) TgReq.tokenIndex = 0;

    console.log("GOT 429 ERROR, TRYING NEW FUCKING BOT. TOKEN INDEX: " + TgReq.tokenIndex);
    return TgReq.tokenIndex;
  }

  /**
   * Sends a GET request to the Telegram API to fetch updates
   * @function tgGet
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgGet(tokenIndex) {
    const { offset } = this.dataObject;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}`;

    //NO TRY CATCH (fucks up tokenIndex)
    const res = await fetch(url);
    const data = await res.json();

    //check token
    const checkModel = new TgReq({ data: data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgGet(TgReq.tokenIndex);
      return retryData;
    }

    return data;
  }

  /**
   * Sends a POST request to the Telegram API with the specified command
   * @function tgPost
   * @params command (command to send to tg); tokenIndex
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPost(tokenIndex) {
    const { inputObj } = this.dataObject;
    const { command, params } = inputObj;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/${command}`;

    //send data (NO TRY CATCH, fucks up token Index, IF YOU DONT FUCKING RETURN IT)
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    //check token
    const checkModel = new TgReq({ data: data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgPost(TgReq.tokenIndex);
      return retryData;
    }
    return data;
  }

  /**
   * Uploads and sends a photo to a Telegram chat using the Telegram API
   * @function tgPicFS
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPicFS(tokenIndex) {
    const { chatId, picPath } = this.dataObject;

    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;

    //build form
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream(picPath));

    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
      });
      return res.data;
    } catch (e) {
      if (e.response && e.response.data) {
        //check token
        const checkModel = new TgReq({ data: e.response.data });
        const checkData = await checkModel.checkToken();

        if (checkData) {
          const inputData = this.dataObject;
          const retryModel = new TgReq(inputData);
          const retryData = await retryModel.tgPicFS(TgReq.tokenIndex);
          return retryData;
        }
      } else {
        return e;
      }
    }
  }

  //--------------------------

  async postArticleTitleTG() {
    const { inputObj } = this.dataObject;
    if (!inputObj) return null;
    const { titleNormal, dateNormal, tgUploadId } = inputObj;

    const titleText = "--------------" + "\n\n" + titleNormal + "\n" + "<i>" + dateNormal + "</i>" + "\n\n" + "--------------";

    const params = {
      chat_id: tgUploadId,
      text: titleText,
      parse_mode: "HTML",
    };

    const postObj = {
      command: "sendMessage",
      params: params,
    };

    const tgModel = new TgReq({ inputObj: postObj });
    const data = await tgModel.tgPost(TgReq.tokenIndex);

    return data;
  }

  async postPicTG() {
    const { inputObj } = this.dataObject;
    const { kcnaId, savePath, dateNormal, tgUploadId } = inputObj;

    //post pic
    const postParams = {
      chatId: tgUploadId,
      picPath: savePath,
    };

    const postModel = new TgReq(postParams);
    const postData = await postModel.tgPicFS(TgReq.tokenIndex);
    if (!postData || !postData.result) return null;

    const caption = "<b>PIC: " + kcnaId + ".jpg</b>" + "\n" + "<i>" + dateNormal + "</i>";

    //build edit caption params
    const editParams = {
      chat_id: postData.result.chat.id,
      message_id: postData.result.message_id,
      caption: caption,
      parse_mode: "HTML",
    };

    const paramObj = {
      params: editParams,
      command: "editMessageCaption",
    };

    //EDIT PIC CAPTION
    const editModel = new TgReq({ inputObj: paramObj });
    await editModel.tgPost(TgReq.tokenIndex);

    //store pic Posted
    const storeObj = { ...inputObj, ...postData.result };
    const storeModel = new dbModel(storeObj, CONFIG.picsUploaded);
    await storeModel.storeUniqueURL();

    return storeObj;
  }

  async postArticleContentTG() {
    //destructure everything
    const { inputObj } = this.dataObject;
    const { url, date, title, tgUploadId } = inputObj;
    const { tgMaxLength } = CONFIG;

    //GET TEXT ARRAY
    const textModel = new TgReq({ inputObj: inputObj });
    const textArray = await textModel.buildTextArrayTG();

    console.log("TEXT ARRAY YOU FUCKING FAGGOIT");
    console.log(textArray);

    // const maxLength = tgMaxLength - title.length - date.length - url.length - 100;
    // const chunkTotal = Math.ceil(textInput.length / maxLength);
    // let chunkCount = 0;

    // //define paramsObj
    // const paramsObj = {
    //   command: "sendMessage",
    // };

    // //set  base params
    // const params = {
    //   chat_id: tgUploadId,
    //   parse_mode: "HTML",
    // };

    // console.log("PARAMS");
    // console.log(params);

    // //if short enough send normally
    // if (textInput.length < maxLength) {
    //   params.text = title + "\n" + date + "\n\n" + textInput + "\n\n" + url;
    // }

    // //otherwise send in chunks
    // for (let i = 0; i < textInput.length; i += maxLength) {
    //   chunkCount++;
    //   const chunk = textInput.substring(i, i + maxLength);

    //   console.log("CHUNK COUNT");
    //   console.log(chunkCount);

    //   //set text based on chunkCount
    //   switch (chunkCount) {
    //     case 1:
    //       params.text = title + "\n" + date + "\n\n" + chunk;
    //       break;

    //     case chunkTotal:
    //       params.text = chunk + "\n\n" + url;
    //       break;

    //     default:
    //       params.text = chunk;
    //   }

    //   paramsObj.params = params;

    //   const postModel = new TgReq({ inputObj: paramsObj });
    //   const postData = await postModel.tgPost();
    //   console.log("POST DATA!!!");
    //   console.log(postData);
    // }

    // return textInput.length;
  }

  async buildTextArrayTG() {
    const { inputObj } = this.dataObject;
    const { url, date, title, urlNormal } = inputObj;
    const { tgMaxLength } = CONFIG;

    //import as textInput to avoid confusion
    const textInput = inputObj.text;

    //define chunks
    const maxLength = tgMaxLength - title.length - date.length - url.length - 100;
    const chunkTotal = Math.ceil(textInput.length / maxLength);

    console.log("STATS!!!!!!!!!!!");
    console.log(textInput.length);
    console.log(maxLength);
    console.log(chunkTotal);

    //if short return one array item
    if (textInput.length < maxLength) {
      const shortArray = [];
      const shortText = title + "\n" + date + "\n\n" + textInput + "\n\n" + urlNormal;
      shortArray.push(shortText);
      return shortArray;
    }

    //otherwise build text array
    let chunkCount = 0;
    const textArray = [];
    for (let i = 0; i < textInput.length; i += maxLength) {
      chunkCount++;
      const chunk = textInput.substring(i, i + maxLength);

      //build params
      const chunkObj = {
        chunkCount: chunkCount,
        chunk: chunk,
        chunkTotal: chunkTotal,
      };

      const chunkParams = { ...chunkObj, ...inputObj };

      //get chunk text
      const chunkModel = new TgReq(chunkParams);
      const chunkText = await chunkModel.getChunkText();
      if (!chunkText) continue;

      textArray.push(chunkText);
    }

    return textArray;
  }

  async getChunkText() {
    const { chunk, chunkCount, chunkTotal, title, dateNormal, urlNormal } = this.dataObject;

    switch (chunkCount) {
      case 1:
        return title + "\n" + dateNormal + "\n\n" + chunk;

      case chunkTotal:
        return chunk + "\n\n" + urlNormal;

      default:
        return chunk;
    }
  }
}

export default TgReq;
