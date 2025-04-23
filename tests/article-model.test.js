// scrape-tests.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { scrapeKCNA, scrapeEach, getNewListData, getNewContentData, getNewMediaData } from "../src/scrape.js";

// Mock the dependencies
vi.mock("../models/kcna-model.js", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getNewListHTML: vi.fn().mockResolvedValue("<div>mock html</div>"),
      getContentToDownloadArray: vi.fn().mockResolvedValue(["item1", "item2"]),
      getMediaToDownloadArray: vi.fn().mockResolvedValue(["media1", "media2"]),
    })),
  };
});

vi.mock("./articles.js", () => ({
  buildArticleList: vi.fn().mockResolvedValue(["article1", "article2"]),
  buildArticleContent: vi.fn().mockResolvedValue(["articleContent1", "articleContent2"]),
}));

vi.mock("./pics.js", () => ({
  buildPicSetList: vi.fn().mockResolvedValue(["picSet1", "picSet2"]),
  buildPicSetContent: vi.fn().mockResolvedValue(["picSetContent1", "picSetContent2"]),
  getPicDataArray: vi.fn().mockResolvedValue(["picData1", "picData2"]),
}));

vi.mock("./vids.js", () => ({
  buildVidList: vi.fn().mockResolvedValue(["vid1", "vid2"]),
  buildVidPageContent: vi.fn().mockResolvedValue(["vidContent1", "vidContent2"]),
  getVidDataArray: vi.fn().mockResolvedValue(["vidData1", "vidData2"]),
}));

// Mock CONFIG
vi.mock("../config/scrape-config.js", () => ({
  default: {
    typeArr: ["articles", "pics", "vids"],
  },
}));

describe("KCNA Scraper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNewListData", () => {
    it("should return article list data when type is articles", async () => {
      const result = await getNewListData("articles");
      expect(result).toEqual(["article1", "article2"]);
    });

    it("should return picSet list data when type is pics", async () => {
      const result = await getNewListData("pics");
      expect(result).toEqual(["picSet1", "picSet2"]);
    });

    it("should return video list data when type is vids", async () => {
      const result = await getNewListData("vids");
      expect(result).toEqual(["vid1", "vid2"]);
    });

    it("should return null when HTML is not available", async () => {
      // Override the mock for this specific test
      const KCNA = (await import("../models/kcna-model.js")).default;
      KCNA.mockImplementationOnce(() => ({
        getNewListHTML: vi.fn().mockResolvedValue(null),
      }));

      const result = await getNewListData("articles");
      expect(result).toBeNull();
    });
  });

  describe("getNewContentData", () => {
    it("should return article content data when type is articles", async () => {
      const result = await getNewContentData("articles");
      expect(result).toEqual(["articleContent1", "articleContent2"]);
    });

    it("should return picSet content when type is pics", async () => {
      const result = await getNewContentData("pics");
      expect(result).toEqual(["picSetContent1", "picSetContent2"]);
    });

    it("should return message when nothing to download", async () => {
      // Override the mock for this specific test
      const KCNA = (await import("../models/kcna-model.js")).default;
      KCNA.mockImplementationOnce(() => ({
        getContentToDownloadArray: vi.fn().mockResolvedValue(null),
      }));

      const result = await getNewContentData("articles");
      expect(result).toBe("NOTHING NEW TO DOWNLOAD");
    });
  });

  describe("getNewMediaData", () => {
    it("should return null for articles type", async () => {
      const result = await getNewMediaData("articles");
      expect(result).toBeNull();
    });

    it("should return pic data for pics type", async () => {
      const result = await getNewMediaData("pics");
      expect(result).toEqual(["picData1", "picData2"]);
    });

    it("should return vid data for vids type", async () => {
      const result = await getNewMediaData("vids");
      expect(result).toEqual(["vidData1", "vidData2"]);
    });
  });

  describe("scrapeEach", () => {
    it("should process each type and return length of listArray", async () => {
      const result = await scrapeEach("articles");
      expect(result).toBe(2); // Length of the mock array ['article1', 'article2']
    });
  });

  describe("scrapeKCNA", () => {
    it("should process all types and return success message", async () => {
      const result = await scrapeKCNA();
      expect(result).toBe("FINISHED SCRAPING NEW DATA");
    });
  });
});
