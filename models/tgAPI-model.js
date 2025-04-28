import CONFIG from "../config/scrape-config.js";
import TgReq from "./tgReq-model.js";
import dbModel from "./db-model.js";

class TgAPI {
  static tokenIndex = 0;

  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async postArticleTitleTG() {
    const { inputObj } = this.dataObject;

    if (!inputObj) return null;

    const { title, date } = inputObj;
    const titleText = title + "\n" + "<i>" + date + "</i>";

    const params = {
      chat_id: CONFIG.tgUploadId,
      text: titleText,
      parse_mode: "HTML",
    };

    const postObj = {
      command: "sendMessage",
      params: params,
    };

    const tgModel = new TgReq({ inputObj: postObj });
    let data = await tgModel.tgPost(TgAPI.tokenIndex);

    //check token
    const checkData = await this.checkToken(data);
    if (checkData) {
      data = await tgModel.tgPost(TgAPI.tokenIndex);
    }

    return data;
  }

  async postPicTG() {
    const { inputObj } = this.dataObject;
    const { savePath } = inputObj;

    const params = {
      chatId: CONFIG.tgUploadId,
      picPath: savePath,
    };

    const tgModel = new TgReq(params);
    let data = await tgModel.tgPicFS(TgAPI.tokenIndex);

    //check token
    const checkData = await this.checkToken(data);

    if (checkData) {
      console.log("AHHHHHHHHHHHHHHHHHHHHH");
      data = await tgModel.tgPicFS(TgAPI.tokenIndex);
      console.log(TgAPI.tokenIndex);
    }

    // console.log("DATA HERE");
    // console.log(data);

    // if (!data) return null;

    //EDIT PIC CAPTION

    //STORE PIC AS UPLOADED

    //store pic Posted
    const storeObj = { ...inputObj, ...data.result };
    const storeModel = new dbModel(storeObj, CONFIG.picsUploaded);
    await storeModel.storeUniqueURL;

    return storeObj;
  }

  // export const postPicTG = async (inputObj) => {

  // };

  async checkToken(data) {
    //429 bot fucked error
    if (!data || (data && data.ok) || (data && !data.ok && data.error_code !== 429)) return null;

    console.log("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");

    TgAPI.tokenIndex++;
    if (TgAPI.tokenIndex > 11) TgAPI.tokenIndex = 0;

    console.log("GOT 429 ERROR, TRYING NEW FUCKING BOT. TOKEN INDEX: " + TgAPI.tokenIndex);
    return TgAPI.tokenIndex;
  }
}

export default TgAPI;
