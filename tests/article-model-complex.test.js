// import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import { JSDOM } from "jsdom";
// import UTIL from "../models/util-model.js"; // Update the path
// import dbModel from "../models/db-model.js"; // Update the path
// import CONFIG from "../config/scrape-config.js"; // Update the path
// import YourClass from "../models/article-model.js"; // Update the path with the actual class that contains buildArticleList

// // Mock dependencies
// vi.mock("jsdom", () => {
//   return {
//     JSDOM: vi.fn(),
//   };
// });

// vi.mock("./util-model.js");
// vi.mock("./dbModel.js");
// vi.mock("../config/scrape-config.js", () => {
//   return {
//     CONFIG: {
//       articles: "articles",
//     },
//   };
// });

// //FOR buildArticleList
// describe("buildArticleList", () => {
//   let instance;
//   let mockDocument;
//   let mockQuerySelector;
//   let mockQuerySelectorAll;
//   let mockParseLinkArray;
//   let mockSortArrayByDate;
//   let mockAddArticleId;
//   let mockStoreArray;

//   beforeEach(() => {
//     // Set up mocks
//     mockQuerySelector = vi.fn();
//     mockQuerySelectorAll = vi.fn();
//     mockDocument = {
//       querySelector: mockQuerySelector,
//     };

//     // Set up JSDOM mock
//     JSDOM.mockImplementation(() => ({
//       window: {
//         document: mockDocument,
//       },
//     }));

//     // Mock the parseLinkArray method that should exist on the instance
//     mockParseLinkArray = vi.fn();

//     // Create instance of the class and set test properties
//     instance = new YourClass();
//     instance.dataObject = '<html><body><div class="article-link"><a href="/article1">Article 1</a></div></body></html>';
//     instance.parseLinkArray = mockParseLinkArray;

//     // Mock UTIL methods
//     mockSortArrayByDate = vi.fn();
//     mockAddArticleId = vi.fn();
//     UTIL.prototype.sortArrayByDate = mockSortArrayByDate;
//     UTIL.prototype.addArticleId = mockAddArticleId;

//     // Mock dbModel method
//     mockStoreArray = vi.fn();
//     dbModel.prototype.storeArray = mockStoreArray;
//   });

//   afterEach(() => {
//     vi.clearAllMocks();
//   });

//   it("should parse HTML and extract articles correctly", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = ["link1", "link2", "link3"];
//     const parsedArticles = [
//       { title: "Article 1", date: "2023-01-01" },
//       { title: "Article 2", date: "2023-01-02" },
//       { title: "Article 3", date: "2023-01-03" },
//     ];
//     const sortedArticles = [
//       { title: "Article 3", date: "2023-01-03" },
//       { title: "Article 2", date: "2023-01-02" },
//       { title: "Article 1", date: "2023-01-01" },
//     ];
//     const normalizedArticles = [
//       { title: "Article 3", date: "2023-01-03", articleId: "a1" },
//       { title: "Article 2", date: "2023-01-02", articleId: "a2" },
//       { title: "Article 1", date: "2023-01-01", articleId: "a3" },
//     ];

//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockResolvedValue(parsedArticles);
//     mockSortArrayByDate.mockResolvedValue(sortedArticles);
//     mockAddArticleId.mockResolvedValue(normalizedArticles);
//     mockStoreArray.mockResolvedValue(true);

//     // Act
//     const result = await instance.buildArticleList();

//     // Assert
//     expect(JSDOM).toHaveBeenCalledWith(instance.dataObject);
//     expect(mockQuerySelector).toHaveBeenCalledWith(".article-link");
//     expect(mockQuerySelectorAll).toHaveBeenCalledWith("a");
//     expect(mockParseLinkArray).toHaveBeenCalledWith(mockLinkElements);
//     expect(UTIL).toHaveBeenCalledWith(parsedArticles);
//     expect(mockSortArrayByDate).toHaveBeenCalled();
//     expect(UTIL).toHaveBeenCalledWith(sortedArticles);
//     expect(mockAddArticleId).toHaveBeenCalledWith(CONFIG.articles, "articleId");
//     expect(dbModel).toHaveBeenCalledWith(normalizedArticles, CONFIG.articles);
//     expect(mockStoreArray).toHaveBeenCalled();
//     expect(result).toEqual(normalizedArticles);
//   });

//   it("should return null if no article link element is found", async () => {
//     // Setup
//     mockQuerySelector.mockReturnValue(null);

//     // Act
//     const result = await instance.buildArticleList();

//     // Assert
//     expect(result).toBeNull();
//     expect(mockParseLinkArray).not.toHaveBeenCalled();
//   });

//   it("should handle empty article array", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = [];
//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockResolvedValue([]);
//     mockSortArrayByDate.mockResolvedValue([]);
//     mockAddArticleId.mockResolvedValue([]);
//     mockStoreArray.mockResolvedValue(true);

//     // Act
//     const result = await instance.buildArticleList();

//     // Assert
//     expect(result).toEqual([]);
//     expect(mockParseLinkArray).toHaveBeenCalledWith(mockLinkElements);
//     expect(UTIL).toHaveBeenCalledWith([]);
//     expect(dbModel).toHaveBeenCalledWith([], CONFIG.articles);
//   });

//   it("should handle exceptions in parseLinkArray", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = ["link1", "link2"];
//     const parseLinkArrayError = new Error("Failed to parse links");

//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockRejectedValue(parseLinkArrayError);

//     // Act & Assert
//     await expect(instance.buildArticleList()).rejects.toThrow(parseLinkArrayError);
//   });

//   it("should handle exceptions in sortArrayByDate", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = ["link1", "link2"];
//     const parsedArticles = [
//       { title: "Article 1", date: "2023-01-01" },
//       { title: "Article 2", date: "2023-01-02" },
//     ];
//     const sortArrayError = new Error("Failed to sort array");

//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockResolvedValue(parsedArticles);
//     mockSortArrayByDate.mockRejectedValue(sortArrayError);

//     // Act & Assert
//     await expect(instance.buildArticleList()).rejects.toThrow(sortArrayError);
//   });

//   it("should handle exceptions in addArticleId", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = ["link1", "link2"];
//     const parsedArticles = [
//       { title: "Article 1", date: "2023-01-01" },
//       { title: "Article 2", date: "2023-01-02" },
//     ];
//     const sortedArticles = [
//       { title: "Article 2", date: "2023-01-02" },
//       { title: "Article 1", date: "2023-01-01" },
//     ];
//     const addArticleIdError = new Error("Failed to add article IDs");

//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockResolvedValue(parsedArticles);
//     mockSortArrayByDate.mockResolvedValue(sortedArticles);
//     mockAddArticleId.mockRejectedValue(addArticleIdError);

//     // Act & Assert
//     await expect(instance.buildArticleList()).rejects.toThrow(addArticleIdError);
//   });

//   it("should handle exceptions in storeArray", async () => {
//     // Setup
//     const mockArticleLink = {
//       querySelectorAll: mockQuerySelectorAll,
//     };
//     const mockLinkElements = ["link1", "link2"];
//     const parsedArticles = [
//       { title: "Article 1", date: "2023-01-01" },
//       { title: "Article 2", date: "2023-01-02" },
//     ];
//     const sortedArticles = [
//       { title: "Article 2", date: "2023-01-02" },
//       { title: "Article 1", date: "2023-01-01" },
//     ];
//     const normalizedArticles = [
//       { title: "Article 2", date: "2023-01-02", articleId: "a1" },
//       { title: "Article 1", date: "2023-01-01", articleId: "a2" },
//     ];
//     const storeArrayError = new Error("Failed to store array");

//     mockQuerySelector.mockReturnValue(mockArticleLink);
//     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//     mockParseLinkArray.mockResolvedValue(parsedArticles);
//     mockSortArrayByDate.mockResolvedValue(sortedArticles);
//     mockAddArticleId.mockResolvedValue(normalizedArticles);
//     mockStoreArray.mockRejectedValue(storeArrayError);

//     // Act & Assert
//     await expect(instance.buildArticleList()).rejects.toThrow(storeArrayError);
//   });

//   it("should handle invalid HTML data", async () => {
//     // Setup
//     instance.dataObject = "not valid html";
//     const jsdomError = new Error("Invalid HTML");
//     JSDOM.mockImplementation(() => {
//       throw jsdomError;
//     });

//     // Act & Assert
//     await expect(instance.buildArticleList()).rejects.toThrow(jsdomError);
//   });

//   //   it("should log the number of articles found", async () => {
//   //     // Setup
//   //     const consoleSpy = vi.spyOn(console, "log");
//   //     const mockArticleLink = {
//   //       querySelectorAll: mockQuerySelectorAll,
//   //     };
//   //     const mockLinkElements = ["link1", "link2", "link3"];
//   //     const parsedArticles = [
//   //       { title: "Article 1", date: "2023-01-01" },
//   //       { title: "Article 2", date: "2023-01-02" },
//   //       { title: "Article 3", date: "2023-01-03" },
//   //     ];

//   //     mockQuerySelector.mockReturnValue(mockArticleLink);
//   //     mockQuerySelectorAll.mockReturnValue(mockLinkElements);
//   //     mockParseLinkArray.mockResolvedValue(parsedArticles);
//   //     mockSortArrayByDate.mockResolvedValue(parsedArticles);
//   //     mockAddArticleId.mockResolvedValue(parsedArticles);
//   //     mockStoreArray.mockResolvedValue(true);

//   //     // Act
//   //     await instance.buildArticleList();

//   //     // Assert
//   //     expect(consoleSpy).toHaveBeenCalledWith("GOT 3 ARTICLES");
//   //     consoleSpy.mockRestore();
//   //   });
// });
