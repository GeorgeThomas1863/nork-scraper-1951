import { describe, it, expect, vi, beforeEach } from "vitest";
import UTIL from "../models/util-model.js";
import dbModel from "../models/db-model.js";
import CONFIG from "../config/scrape-config.js";

// Mock dependencies
vi.mock("../models/db-model.js");
vi.mock("../config/scrape-config.js", () => {
  return {
    default: {
      articles: "articles-collection",
      pics: "pics-collection",
      currentId: 1000000,
    },
  };
});

describe("UTIL Model", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  // Basic constructor test
  it("should store dataObject in constructor", () => {
    const testData = { test: "data" };
    const util = new UTIL(testData);
    expect(util.dataObject).toBe(testData);
  });

  // Test sortArrayByDate method
  it("should sort array by date from oldest to newest", async () => {
    // Setup
    const inputArray = [
      { title: "Article 2", date: "2023-02-15" },
      { title: "Article 1", date: "2023-01-01" },
      { title: "Article 3", date: "2023-03-30" },
    ];

    const util = new UTIL(inputArray);

    // Act
    const result = await util.sortArrayByDate();

    // Assert
    expect(result[0].title).toBe("Article 1"); // Oldest first
    expect(result[1].title).toBe("Article 2");
    expect(result[2].title).toBe("Article 3"); // Newest last
  });

  it("should return null from sortArrayByDate when input array is empty", async () => {
    // Setup
    const util = new UTIL([]);

    // Act
    const result = await util.sortArrayByDate();

    // Assert
    expect(result).toBeNull();
  });

  // Test addListId method
  it("should add article IDs to each object in the array", async () => {
    // Setup
    const inputArray = [
      { title: "Article 1", date: "2023-01-01" },
      { title: "Article 2", date: "2023-02-15" },
    ];

    // Mock getArticleId to return a starting ID
    const mockStartId = 10;
    const util = new UTIL(inputArray);
    util.getArticleId = vi.fn().mockResolvedValue(mockStartId);

    // Act
    const result = await util.addListId("articles-collection", "articleId");

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].articleId).toBe(10); // mockStartId + 0
    expect(result[1].articleId).toBe(11); // mockStartId + 1
    expect(util.getArticleId).toHaveBeenCalledWith("articles-collection");
  });

  it("should return null from addListId when input array is empty", async () => {
    // Setup
    const util = new UTIL([]);

    // Act
    const result = await util.addListId("articles-collection", "articleId");

    // Assert
    expect(result).toBeNull();
  });

  // Test getArticleId method
  it("should get next article ID based on maximum stored ID", async () => {
    // Setup
    const mockMaxId = 42;
    dbModel.mockImplementation(() => ({
      findMaxId: vi.fn().mockResolvedValue(mockMaxId),
    }));

    const util = new UTIL({});

    // Act
    const result = await util.getArticleId("articles-collection");

    // Assert
    expect(result).toBe(43); // mockMaxId + 1
    expect(dbModel).toHaveBeenCalledWith({ keyToLookup: "articleId" }, "articles-collection");
  });

  it("should return 0 from getArticleId when no articles exist yet", async () => {
    // Setup
    dbModel.mockImplementation(() => ({
      findMaxId: vi.fn().mockResolvedValue(null),
    }));

    const util = new UTIL({});

    // Act
    const result = await util.getArticleId("articles-collection");

    // Assert
    expect(result).toBe(0);
  });

  // Test getDateArray method
  it("should generate an array of month-year combinations", async () => {
    // Setup - mock the date
    const mockDate = new Date("2023-05-15");
    const realDate = global.Date;
    global.Date = vi.fn(() => mockDate);
    global.Date.prototype = realDate.prototype;

    const util = new UTIL({});

    // Act
    const result = await util.getDateArray();

    // Assert
    expect(result.length).toBe(3);
    // Should include previous, current, and next month
    expect(result).toContain("202304"); // April
    expect(result).toContain("202305"); // May
    expect(result).toContain("202306"); // June

    // Restore original Date
    global.Date = realDate;
  });

  // Test getCurrentKCNAId method
  it("should use CONFIG.currentId when no records exist or CONFIG id is higher", async () => {
    // Setup
    dbModel.mockImplementation(() => ({
      findMaxId: vi.fn().mockResolvedValue(null),
    }));

    const util = new UTIL({});

    // Act
    const result = await util.getCurrentKCNAId();

    // Assert
    expect(result).toBe(CONFIG.currentId); // From our mock config
    expect(dbModel).toHaveBeenCalledWith({}, CONFIG.pics);
  });

  it("should use database max ID when it exists and is higher than CONFIG id", async () => {
    // Setup
    const mockMaxId = 2000000; // Higher than our mock CONFIG.currentId
    dbModel.mockImplementation(() => ({
      findMaxId: vi.fn().mockResolvedValue(mockMaxId),
    }));

    const util = new UTIL({});

    // Act
    const result = await util.getCurrentKCNAId();

    // Assert
    expect(result).toBe(mockMaxId);
  });

  // Test parseDateElement method
  it("should parse date text in the format [YYYY.MM.DD]", async () => {
    // Setup
    const dateText = "[2023.05.15]";
    const util = new UTIL({dateText: dateText});

    // Act
    const result = await util.parseDateElement();

    // Assert
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(4); // Zero-based, so 4 = May
    expect(result.getDate()).toBe(15);
  });

  it("should return null when date text is invalid", async () => {
    // Setup
    const util = new UTIL("[invalid.date.format]");

    // Act
    const result = await util.parseDateElement();

    // Assert
    expect(result).toBeNull();
  });

  it("should return null when date text is empty", async () => {
    // Setup
    const util = new UTIL("");

    // Act
    const result = await util.parseDateElement();

    // Assert
    expect(result).toBeNull();
  });
});
