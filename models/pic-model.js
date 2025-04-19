// import CONFIG from "../config/scrape-config.js";
// import dbModel from "./db-model.js";

class Pic {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async buildPicObj() {
    //call picURL here to avoid confusion
    const { url, kcnaId, dateString } = this.dataObject;

    const res = await fetch(url);

    //if URL doesnt exist / return headers throw error
    if (!res || !res.headers) {
      const error = new Error("URL DOESNT EXIST");
      error.url = url;
      error.function = "getPicData KCNA MODEL";
      throw error;
    }

    //get pic headers
    const headerData = res.headers;
    const dataType = headerData.get("content-type");

    //if not pic RETURN NULL [KEY FOR PROPER DATE ARRAY ITERATION]
    if (!dataType || dataType !== "image/jpeg") return null;

    //otherwise get data about pic and add to obj //TEST
    const picSize = headerData.get("content-length");
    const serverData = headerData.get("server");
    const eTag = headerData.get("etag");
    const picEditDate = new Date(headerData.get("last-modified"));

    const picObj = {
      url: url,
      kcnaId: kcnaId,
      dateString: dateString,
      scrapeDate: new Date(),
      dataType: dataType,
      serverData: serverData,
      eTag: eTag,
      picSize: picSize,
      picEditDate: picEditDate,
    };

    return picObj;
  }

  async buildArticlePicObj() {
    const imgSrc = this.dataObject;
    if (!imgSrc) return null;

    //extract picURL
    const picURL = "http://www.kcna.kp" + imgSrc;

    //extract kcnaId
    const picPathNum = imgSrc.substring(imgSrc.length - 11, imgSrc.length - 4);
    if (!picPathNum) return null;
    const kcnaId = String(Number(picPathNum));

    //extract out stupid date string
    const dateString = imgSrc.substring(imgSrc.indexOf("/photo/") + "/photo/".length, imgSrc.indexOf("/PIC", imgSrc.indexOf("/photo/")));

    const picParams = {
      url: picURL,
      kcnaId: kcnaId,
      dateString: dateString,
    };

    //build pic OBJ from PIC URL file (checks if new AND stores it)
    const picObjModel = new Pic(picParams);
    const picObj = await picObjModel.buildPicObj();

    console.log("ARTICLE PIC OBJECT");
    console.log(picObj);

    return picObj;
  }
}

export default Pic;
