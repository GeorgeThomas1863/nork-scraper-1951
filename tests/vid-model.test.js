import { describe, it, expect, vi, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import Vid from "../models/vid-model.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";
import CONFIG from "../config/scrape-config.js";

// Mock dependencies
vi.mock("jsdom");
vi.mock("../models/kcna-model.js");
vi.mock("../models/db-model.js");
vi.mock("../models/util-model.js");
vi.mock("../config/scrape-config.js", () => {
  return {
    default: {
      vidPages: "vidPages",
      vidPagesDownloaded: "vidPagesDownloaded",
      picURLs: "picURLs",
      vidURLs: "vidURLs",
    },
  };
});

describe("Vid Model", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock console.log to reduce test output clutter
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  // Basic constructor test
  it("should store dataObject in constructor", () => {
    const testData = { url: "http://example.com/video.mp4" };
    const vid = new Vid(testData);
    expect(vid.dataObject).toBe(testData);
  });

  // Test buildVidList method
  it("should extract video list data from HTML", async () => {
    // Setup
    const mockHtml = '<html><body><div class="video-wrapper"></div></body></html>';
    const mockVideoWrappers = [{ nodeType: 1 }, { nodeType: 1 }];
    const mockVidListArray = [
      { url: "http://example.com/video1.mp4", title: "Video 1" },
      { url: "http://example.com/video2.mp4", title: "Video 2" },
    ];

    // Mock JSDOM
    const mockDocument = {
      querySelectorAll: vi.fn().mockReturnValue(mockVideoWrappers),
    };
    JSDOM.mockImplementation(() => ({
      window: {
        document: mockDocument,
      },
    }));

    // Mock parseWrapperArray method
    const vid = new Vid(mockHtml);
    vid.parseWrapperArray = vi.fn().mockResolvedValue(mockVidListArray);

    // Act
    const result = await vid.buildVidList();

    // Assert
    expect(result).toEqual(mockVidListArray);
    expect(JSDOM).toHaveBeenCalledWith(mockHtml);
    expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(".video-wrapper");
    expect(vid.parseWrapperArray).toHaveBeenCalledWith(mockVideoWrappers);
  });

  it("should return null from buildVidList when no video wrappers are found", async () => {
    // Setup
    const mockHtml = "<html><body></body></html>";

    // Mock JSDOM
    const mockDocument = {
      querySelectorAll: vi.fn().mockReturnValue([]),
    };
    JSDOM.mockImplementation(() => ({
      window: {
        document: mockDocument,
      },
    }));

    const vid = new Vid(mockHtml);

    // Act
    const result = await vid.buildVidList();

    // Assert
    expect(result).toBeNull();
  });

  // Test getVidListObj method
  it("should extract video information from a video element", async () => {
    // Setup
    const mockDate = new Date("2023-05-15");
    const mockVidElement = {
      querySelector: vi.fn().mockImplementation((selector) => {
        if (selector === ".img a") {
          return { getAttribute: () => "/video/page.html" };
        } else if (selector === ".img img") {
          return { getAttribute: () => "/siteFiles/video/kp/2023-05/V12345.jpg" };
        } else if (selector === ".publish-time") {
          return { textContent: "[2023.05.15]" };
        } else if (selector === ".title a") {
          return { textContent: "Test Video [2023.05.15]" };
        }
        return null;
      }),
    };

    // Mock UTIL.parseDateElement
    UTIL.mockImplementation(() => ({
      parseDateElement: vi.fn().mockResolvedValue(mockDate),
    }));

    // Mock dbModel.storeUniqueURL
    dbModel.mockImplementation(() => ({
      storeUniqueURL: vi.fn().mockResolvedValue({ acknowledged: true }),
    }));

    const vid = new Vid();
    // Mock storeVidThumbnail method
    vid.storeVidThumbnail = vi.fn().mockResolvedValue(true);

    // Act
    const result = await vid.getVidListObj(mockVidElement);

    // Assert
    expect(result).toMatchObject({
      url: "http://www.kcna.kp/video/page.html",
      thumbnail: "http://www.kcna.kp/siteFiles/video/kp/2023-05/V12345.jpg",
      kcnaId: 12345,
      dateString: "2023-05",
      date: mockDate,
      title: "Test Video",
    });
    expect(vid.storeVidThumbnail).toHaveBeenCalledWith("http://www.kcna.kp/siteFiles/video/kp/2023-05/V12345.jpg");
  });

  // Test extractVidStr method
  it("should extract video URL from HTML string", async () => {
    // Setup
    const mockHtml = "some text before '/siteFiles/video/path/to/video.mp4' some text after";
    const vid = new Vid();

    // Act
    const result = await vid.extractVidStr(mockHtml);

    // Assert
    expect(result).toBe("http://www.kcna.kp/siteFiles/video/path/to/video.mp4");
  });

  it("should return null from extractVidStr when no video URL is found", async () => {
    // Setup
    const mockHtml = "some text with no video URL";
    const vid = new Vid();

    // Act
    const result = await vid.extractVidStr(mockHtml);

    // Assert
    expect(result).toBeNull();
  });

  // Test getVidURL method
  it("should get video URL from video page HTML", async () => {
    // Setup
    const mockInputObj = { url: "http://example.com/video-page.html" };
    const mockHtml = "some text with '/siteFiles/video/path/to/video.mp4' embedded";
    const mockVidUrl = "http://www.kcna.kp/siteFiles/video/path/to/video.mp4";

    // Mock KCNA.getHTML
    KCNA.mockImplementation(() => ({
      getHTML: vi.fn().mockResolvedValue(mockHtml),
    }));

    const vid = new Vid();
    vid.extractVidStr = vi.fn().mockResolvedValue(mockVidUrl);

    // Act
    const result = await vid.getVidURL(mockInputObj);

    // Assert
    expect(result).toBe(mockVidUrl);
    expect(KCNA).toHaveBeenCalledWith(mockInputObj);
    expect(vid.extractVidStr).toHaveBeenCalledWith(mockHtml);
  });

  // Test buildVidContent method
  it("should process an array of video page objects", async () => {
    // Setup
    const mockDownloadArray = [{ url: "http://example.com/video1.html" }, { url: "http://example.com/video2.html" }];
    const mockVidUrls = ["http://www.kcna.kp/siteFiles/video/path/to/video1.mp4", "http://www.kcna.kp/siteFiles/video/path/to/video2.mp4"];

    const vid = new Vid(mockDownloadArray);
    vid.getVidURL = vi.fn().mockResolvedValueOnce(mockVidUrls[0]).mockResolvedValueOnce(mockVidUrls[1]);

    // Mock dbModel
    dbModel.mockImplementation(() => ({
      storeUniqueURL: vi.fn().mockResolvedValue({ acknowledged: true }),
    }));

    // Act
    const result = await vid.buildVidContent();

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].vidURL).toBe(mockVidUrls[0]);
    expect(result[1].vidURL).toBe(mockVidUrls[1]);
    expect(vid.getVidURL).toHaveBeenCalledTimes(2);
    expect(dbModel).toHaveBeenCalledWith(expect.objectContaining({ vidURL: mockVidUrls[0] }), CONFIG.vidPagesDownloaded);
    expect(dbModel).toHaveBeenCalledWith({ url: mockVidUrls[0] }, CONFIG.vidURLs);
  });
});
