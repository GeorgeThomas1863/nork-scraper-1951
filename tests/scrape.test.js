//UNFUCK

// import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import { scrapeKCNA, getNewContentKCNA, getNewMediaKCNA } from "../src/scrape.js";
// import KCNA from "../models/kcna-model.js";
// import CONFIG from "../config/scrape-config.js";

// // Mock dependencies
// vi.mock("../models/kcna-model.js");
// vi.mock("../config/scrape-config.js", () => {
//   return {
//     default: {
//       typeArr: ["articles", "pics", "vids"],
//     },
//   };
// });

// describe("Main Scrape Functions", () => {
//   beforeEach(() => {
//     // Reset mocks before each test
//     vi.clearAllMocks();

//     // Mock console.log to reduce test output clutter
//     vi.spyOn(console, "log").mockImplementation(() => {});
//   });

//   afterEach(() => {
//     // Restore console.log
//     vi.restoreAllMocks();
//   });

//   // Test scrapeKCNA function
//   it("should call getNewContentKCNA and getNewMediaKCNA", async () => {
//     // Setup
//     const mockContentResult = "FINISHED GETTING NEW CONTENT CONTENT";
//     const mockMediaResult = "FINISHED GETTING NEW MEDIA";

//     // Creating spy functions that we can track
//     const getContentSpy = vi.fn().mockResolvedValue(mockContentResult);
//     const getMediaSpy = vi.fn().mockResolvedValue(mockMediaResult);

//     // Replace the actual functions with our spies
//     const originalGetContent = getNewContentKCNA;
//     const originalGetMedia = getNewMediaKCNA;

//     global.getNewContentKCNA = getContentSpy;
//     global.getNewMediaKCNA = getMediaSpy;

//     // Act
//     await scrapeKCNA();

//     // Assert
//     expect(getContentSpy).toHaveBeenCalledTimes(1);
//     expect(getMediaSpy).toHaveBeenCalledTimes(1);

//     // Restore original functions
//     global.getNewContentKCNA = originalGetContent;
//     global.getNewMediaKCNA = originalGetMedia;
//   });

//   // Test getNewContentKCNA function //prob disable
//   it('should return "FETCH FUCKED" if newListArray is null', async () => {
//     // Setup
//     KCNA.mockImplementation(() => ({
//       getNewListData: vi.fn().mockResolvedValue(null),
//       getNewContentData: vi.fn(),
//     }));

//     // Act
//     const result = await getNewContentKCNA();

//     // Assert
//     expect(result).toBe("FETCH FUCKED");
//     expect(KCNA.prototype.getNewContentData).not.toHaveBeenCalled();
//   });

//   it("should process all types in typeArr for getNewContentKCNA", async () => {
//     // Setup
//     const mockListArray = ["item1", "item2"];
//     const mockContentArray = ["content1", "content2"];

//     KCNA.mockImplementation(() => ({
//       getNewListData: vi.fn().mockResolvedValue(mockListArray),
//       getNewContentData: vi.fn().mockResolvedValue(mockContentArray),
//     }));

//     // Act
//     const result = await getNewContentKCNA();

//     // Assert
//     expect(result).toBe("FINISHED GETTING NEW CONTENT CONTENT");

//     // Should have called KCNA constructor once for each type
//     expect(KCNA).toHaveBeenCalledTimes(3);
//     expect(KCNA).toHaveBeenCalledWith("articles");
//     expect(KCNA).toHaveBeenCalledWith("pics");
//     expect(KCNA).toHaveBeenCalledWith("vids");

//     // Should have called getNewListData and getNewContentData for each type
//     expect(KCNA.prototype.getNewListData).toHaveBeenCalledTimes(3);
//     expect(KCNA.prototype.getNewContentData).toHaveBeenCalledTimes(3);
//   });

//   it("should skip processing that TYPE when newListArray is null moving on to next types", async () => {
//     // Setup - first call succeeds, second fails, third succeeds
//     let callCount = 0;

//     KCNA.mockImplementation(() => ({
//       getNewListData: vi.fn().mockImplementation(() => {
//         callCount++;
//         // Return null for the second call only
//         return callCount === 2 ? null : ["item1", "item2"];
//       }),
//       getNewContentData: vi.fn().mockResolvedValue(["content1", "content2"]),
//     }));

//     // Act
//     const result = await getNewContentKCNA();

//     // Assert
//     expect(result).toBe("FINISHED GETTING NEW CONTENT");

//     // Should have called KCNA constructor for all three types
//     expect(KCNA).toHaveBeenCalledTimes(3);
//     expect(KCNA).toHaveBeenCalledWith("articles");
//     expect(KCNA).toHaveBeenCalledWith("pics");
//     expect(KCNA).toHaveBeenCalledWith("vids");

//     // Should have called getNewListData for all three types
//     expect(KCNA.prototype.getNewListData).toHaveBeenCalledTimes(3);

//     // Should have called getNewContentData only for the first and third types (where newListArray is not null)
//     expect(KCNA.prototype.getNewContentData).toHaveBeenCalledTimes(2);
//   });

//   // Test getNewMediaKCNA function
//   it("should only process non-article types in getNewMediaKCNA", async () => {
//     // Setup
//     const mockMediaArray = ["media1", "media2"];
//     const mockDownloadData = { downloaded: 2 };

//     KCNA.mockImplementation(() => ({
//       getNewMediaData: vi.fn().mockResolvedValue(mockMediaArray),
//       downloadNewMedia: vi.fn().mockResolvedValue(mockDownloadData),
//     }));

//     // Act
//     const result = await getNewMediaKCNA();

//     // Assert
//     expect(result).toBe("FINISHED GETTING NEW MEDIA");

//     // Should have called KCNA constructor only for non-article types
//     expect(KCNA).toHaveBeenCalledTimes(2); // 'pics' and 'vids'
//     expect(KCNA).toHaveBeenCalledWith("pics");
//     expect(KCNA).toHaveBeenCalledWith("vids");
//     expect(KCNA).not.toHaveBeenCalledWith("articles");

//     // Should have called methods for each non-article type
//     expect(KCNA.prototype.getNewMediaData).toHaveBeenCalledTimes(2);
//     expect(KCNA.prototype.downloadNewMedia).toHaveBeenCalledTimes(2);
//   });

//   it("should handle errors gracefully in getNewMediaKCNA", async () => {
//     // Setup - second type causes an error
//     let callCount = 0;

//     KCNA.mockImplementation(() => ({
//       getNewMediaData: vi.fn().mockImplementation(() => {
//         callCount++;
//         if (callCount === 2) {
//           throw new Error("Network error");
//         }
//         return ["media1", "media2"];
//       }),
//       downloadNewMedia: vi.fn().mockResolvedValue({ downloaded: 2 }),
//     }));

//     // Act & Assert
//     await expect(getNewMediaKCNA()).rejects.toThrow("Network error");

//     // Should have called KCNA constructor for both non-article typess
//     expect(KCNA).toHaveBeenCalledTimes(2);
//     expect(KCNA).toHaveBeenCalledWith("pics");
//     expect(KCNA).toHaveBeenCalledWith("vids");

//     // Should have called getNewMediaData twice but downloadNewMedia only once
//     expect(KCNA.prototype.getNewMediaData).toHaveBeenCalledTimes(2);
//     expect(KCNA.prototype.downloadNewMedia).toHaveBeenCalledTimes(1);
//   });
// });
