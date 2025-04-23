// scraper.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

import { scrapeKCNA, scrapeEach, getNewListData, getNewContentData, getNewMediaData } from "../src/scrape.js";

// --- MOCKING Dependencies ---
// We need to tell Vitest to replace the actual imported modules with mocks.

// Mock the config file
vi.mock("../config/scrape-config.js", () => ({
  default: {
    typeArr: ["articles", "pics", "vids"], // Provide controlled test data
  },
}));

// Mock the KCNA model - This is crucial!
// We mock the constructor and the methods it's expected to have.
const mockKCNAInstance = {
  getNewListHTML: vi.fn(),
  getContentToDownloadArray: vi.fn(),
  getMediaToDownloadArray: vi.fn(),
};
vi.mock("../models/kcna-model.js", () => ({
  // Mock the default export (which is the class)
  default: vi.fn(() => mockKCNAInstance), // When 'new KCNA()' is called, return our mock instance
}));

// Mock the specific scraping functions for each type
const mockArticles = {
  buildArticleList: vi.fn(),
  buildArticleContent: vi.fn(),
};
vi.mock("./articles.js", () => mockArticles);

const mockPics = {
  buildPicSetList: vi.fn(),
  buildPicSetContent: vi.fn(),
  getPicDataArray: vi.fn(),
};
vi.mock("./pics.js", () => mockPics);

const mockVids = {
  buildVidList: vi.fn(),
  buildVidPageContent: vi.fn(),
  getVidDataArray: vi.fn(),
};
vi.mock("./vids.js", () => mockVids); // Adjust the path if your file name is different

// --- Import the functions to test ---
// Important: Do this *after* setting up the mocks!
// --- Reset mocks before each test ---
// Good practice to ensure tests don't interfere with each other
beforeEach(() => {
  vi.clearAllMocks(); // Resets call counts, etc.

  // Reset mock return values if needed for specific tests below
  // For basic tests, often just clearing is enough.
  // Example: mockKCNAInstance.getNewListHTML.mockResolvedValue('mock html');
});

// --- TESTS ---

describe("scraper.js", () => {
  // Test the main orchestrator function
  describe("scrapeKCNA", () => {
    it("should loop through types and call scrapeEach for each", async () => {
      // Since scrapeEach is complex, we mock its *internals* for the scrapeKCNA test
      // (or we could mock scrapeEach itself if we wanted to be even simpler)
      // Let's stick to mocking the internals as done above.
      // We just want to see if scrapeKCNA tries to run the process.

      // Arrange: Mock scrapeEach's dependencies to return basic values
      mockKCNAInstance.getNewListHTML.mockResolvedValue("fake-html");
      mockArticles.buildArticleList.mockResolvedValue(["article1"]); // Need length for scrapeEach return
      mockPics.buildPicSetList.mockResolvedValue(["pic1"]);
      mockVids.buildVidList.mockResolvedValue(["vid1"]);
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(["item-to-download"]);
      mockArticles.buildArticleContent.mockResolvedValue(["article-content1"]);
      mockPics.buildPicSetContent.mockResolvedValue(["pic-content1"]);
      mockVids.buildVidPageContent.mockResolvedValue(["vid-content1"]);
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue(["media-to-download"]);
      mockPics.getPicDataArray.mockResolvedValue(["pic-media1"]);
      mockVids.getVidDataArray.mockResolvedValue(["vid-media1"]);

      // Act
      const result = await scrapeKCNA();

      // Assert
      // Check if the KCNA model was instantiated for each type (6 times: list+content for 3 types)
      // Note: This depends on how scrapeEach is implemented. Let's simplify and just check the result.
      // A more detailed test would check if scrapeEach was called 3 times.
      // For EXTREME simplicity, let's just check the final return value.
      expect(result).toBe("FINISHED SCRAPING NEW DATA");

      // Optional: A slightly more complex check: Did we try to get list data for each type?
      expect(mockKCNAInstance.getNewListHTML).toHaveBeenCalledTimes(3);
    });
  });

  // Test the function that handles one type
  describe("scrapeEach", () => {
    it("should call data fetching functions for a given type", async () => {
      // Arrange
      const testType = "pics";
      // Make mocks return *something* simple so the code doesn't crash
      mockKCNAInstance.getNewListHTML.mockResolvedValue("mock-html");
      mockPics.buildPicSetList.mockResolvedValue(["pic1", "pic2"]); // Array with length 2
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(["download-item1"]);
      mockPics.buildPicSetContent.mockResolvedValue(["pic-content1"]);
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue(["media-item1"]);
      mockPics.getPicDataArray.mockResolvedValue(["pic-media-data1"]);

      // Act
      const result = await scrapeEach(testType);

      // Assert
      // Just check if the underlying functions were called *at all* with the correct type
      // We don't need to check call order for extreme simplicity.
      expect(getNewListData).toBeCalledWith(testType); // Checks if the wrapper was called
      expect(getNewContentData).toBeCalledWith(testType);
      expect(getNewMediaData).toBeCalledWith(testType);
      expect(downloadNewMedia).toBeCalledWith(testType);

      // Check the return value (based on the mocked list data length)
      expect(result).toBe(2); // Because mockPics.buildPicSetList returned an array of length 2
    });
  });

  // Test getting the list of items
  describe("getNewListData", () => {
    it('should call the correct "build" function for "articles"', async () => {
      // Arrange
      const mockHtml = "<html>article list</html>";
      mockKCNAInstance.getNewListHTML.mockResolvedValue(mockHtml);
      mockArticles.buildArticleList.mockResolvedValue(["article1_data"]);

      // Act
      const result = await getNewListData("articles");

      // Assert
      expect(mockKCNAInstance.getNewListHTML).toHaveBeenCalled();
      expect(mockArticles.buildArticleList).toHaveBeenCalledWith(mockHtml);
      expect(result).toEqual(["article1_data"]);
    });

    it('should call the correct "build" function for "pics"', async () => {
      // Arrange
      const mockHtml = "<html>pic list</html>";
      mockKCNAInstance.getNewListHTML.mockResolvedValue(mockHtml);
      mockPics.buildPicSetList.mockResolvedValue(["pic1_data"]);

      // Act
      const result = await getNewListData("pics");

      // Assert
      expect(mockKCNAInstance.getNewListHTML).toHaveBeenCalled();
      expect(mockPics.buildPicSetList).toHaveBeenCalledWith(mockHtml);
      expect(result).toEqual(["pic1_data"]);
    });

    it('should call the correct "build" function for "vids"', async () => {
      // Arrange
      const mockHtml = "<html>vid list</html>";
      mockKCNAInstance.getNewListHTML.mockResolvedValue(mockHtml);
      mockVids.buildVidList.mockResolvedValue(["vid1_data"]);

      // Act
      const result = await getNewListData("vids");

      // Assert
      expect(mockKCNAInstance.getNewListHTML).toHaveBeenCalled();
      expect(mockVids.buildVidList).toHaveBeenCalledWith(mockHtml);
      expect(result).toEqual(["vid1_data"]);
    });

    it("should return null if getNewListHTML returns null", async () => {
      // Arrange
      mockKCNAInstance.getNewListHTML.mockResolvedValue(null);

      // Act
      const result = await getNewListData("articles");

      // Assert
      expect(mockKCNAInstance.getNewListHTML).toHaveBeenCalled();
      expect(mockArticles.buildArticleList).not.toHaveBeenCalled(); // Ensure it didn't proceed
      expect(result).toBeNull();
    });
  });

  // Test getting the content of items
  describe("getNewContentData", () => {
    it('should call the correct "build" function for "articles"', async () => {
      // Arrange
      const mockDownloadArray = [{ id: "a1", url: "..." }];
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(mockDownloadArray);
      mockArticles.buildArticleContent.mockResolvedValue(["article_content"]);

      // Act
      const result = await getNewContentData("articles");

      // Assert
      expect(mockKCNAInstance.getContentToDownloadArray).toHaveBeenCalled();
      expect(mockArticles.buildArticleContent).toHaveBeenCalledWith(mockDownloadArray);
      expect(result).toEqual(["article_content"]);
    });

    it('should call the correct "build" function for "pics"', async () => {
      // Arrange
      const mockDownloadArray = [{ id: "p1", url: "..." }];
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(mockDownloadArray);
      mockPics.buildPicSetContent.mockResolvedValue(["pic_content"]);

      // Act
      const result = await getNewContentData("pics");

      // Assert
      expect(mockKCNAInstance.getContentToDownloadArray).toHaveBeenCalled();
      expect(mockPics.buildPicSetContent).toHaveBeenCalledWith(mockDownloadArray);
      expect(result).toEqual(["pic_content"]);
    });

    it('should call the correct "build" function for "vids"', async () => {
      // Arrange
      const mockDownloadArray = [{ id: "v1", url: "..." }];
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(mockDownloadArray);
      mockVids.buildVidPageContent.mockResolvedValue(["vid_content"]);

      // Act
      const result = await getNewContentData("vids");

      // Assert
      expect(mockKCNAInstance.getContentToDownloadArray).toHaveBeenCalled();
      expect(mockVids.buildVidPageContent).toHaveBeenCalledWith(mockDownloadArray);
      expect(result).toEqual(["vid_content"]);
    });

    it('should return "NOTHING NEW TO DOWNLOAD" if array is empty or null', async () => {
      // Arrange
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue([]); // Test empty array

      // Act
      let result = await getNewContentData("articles");

      // Assert
      expect(result).toBe("NOTHING NEW TO DOWNLOAD");
      expect(mockArticles.buildArticleContent).not.toHaveBeenCalled();

      // Arrange
      mockKCNAInstance.getContentToDownloadArray.mockResolvedValue(null); // Test null

      // Act
      result = await getNewContentData("articles");

      // Assert
      expect(result).toBe("NOTHING NEW TO DOWNLOAD");
      expect(mockArticles.buildArticleContent).not.toHaveBeenCalled();
    });
  });

  // Test getting media URLs
  describe("getNewMediaData", () => {
    it('should return null for "articles"', async () => {
      // Act
      const result = await getNewMediaData("articles");
      // Assert
      expect(result).toBeNull();
      expect(mockKCNAInstance.getMediaToDownloadArray).not.toHaveBeenCalled();
    });

    it('should call the correct "get" function for "pics"', async () => {
      // Arrange
      const mockDownloadArray = [{ id: "p1", contentUrl: "..." }];
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue(mockDownloadArray);
      mockPics.getPicDataArray.mockResolvedValue(["pic_media_data"]);

      // Act
      const result = await getNewMediaData("pics");

      // Assert
      expect(mockKCNAInstance.getMediaToDownloadArray).toHaveBeenCalled();
      expect(mockPics.getPicDataArray).toHaveBeenCalledWith(mockDownloadArray);
      expect(result).toEqual(["pic_media_data"]);
    });

    it('should call the correct "get" function for "vids"', async () => {
      // Arrange
      const mockDownloadArray = [{ id: "v1", contentUrl: "..." }];
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue(mockDownloadArray);
      mockVids.getVidDataArray.mockResolvedValue(["vid_media_data"]);

      // Act
      const result = await getNewMediaData("vids");

      // Assert
      expect(mockKCNAInstance.getMediaToDownloadArray).toHaveBeenCalled();
      expect(mockVids.getVidDataArray).toHaveBeenCalledWith(mockDownloadArray);
      expect(result).toEqual(["vid_media_data"]);
    });

    it('should handle empty/null download array for "pics"/"vids"', async () => {
      // Arrange
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue([]); // Test empty

      // Act
      let result = await getNewMediaData("pics");

      // Assert
      // It depends on how getPicDataArray handles empty arrays, let's assume it returns []
      mockPics.getPicDataArray.mockResolvedValue([]);
      expect(mockPics.getPicDataArray).toHaveBeenCalledWith([]);
      // We might not know the exact return value without testing the underlying function,
      // so just checking the call might be enough for 'simple'.
      // Or expect(result).toEqual([]); assuming the mocked function returns it.

      // Arrange
      mockKCNAInstance.getMediaToDownloadArray.mockResolvedValue(null); // Test null

      // Act
      result = await getNewMediaData("vids");

      // Assert
      // It depends on how getVidDataArray handles null, let's assume it returns []
      mockVids.getVidDataArray.mockResolvedValue([]);
      expect(mockVids.getVidDataArray).toHaveBeenCalledWith(null);
      // expect(result).toEqual([]);
    });
  });
});
