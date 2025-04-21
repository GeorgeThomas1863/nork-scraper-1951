//PICSET LIST
export const buildPicSetList = async () => {
  const dom = new JSDOM(this.dataObject);
  const document = dom.window.document;

  const photoWrapperArray = document.querySelectorAll(".photo-wrapper");
  if (!photoWrapperArray || !photoWrapperArray.length) return null;

  const picSetListArray = await this.parsePhotoWrapperArray(photoWrapperArray);

  //sort the array
  const sortModel = new UTIL(picSetListArray);
  const picSetListSort = await sortModel.sortArrayByDate();

  //add picSetId ID
  const idModel = new UTIL(picSetListSort);
  const picSetListNormal = await idModel.addArticleId(CONFIG.picSets, "picSetId");

  const storeDataModel = new dbModel(picSetListNormal, CONFIG.picSets);
  const storeData = await storeDataModel.storeArray();
  console.log(storeData);

  return picSetListNormal;
};

export const buildPicSetContent = async () => {
  const downloadArray = this.dataObject;

  const picSetArray = [];
  for (let i = 0; i < downloadArray.length; i++) {
    try {
      const picSetObj = await this.getPicSetObj(downloadArray[i]);

      picSetArray.push(picSetObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //for tracking
  return picSetArray;
};
