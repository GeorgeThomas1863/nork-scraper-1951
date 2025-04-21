import { describe, it, expect, vi, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import Article from "../models/article-model.js";

// Mock JSDOM
vi.mock("jsdom", () => {
  return {
    JSDOM: vi.fn(),
  };
});

describe("Article", () => {
  // Basic existence tests
  it("should be defined", () => {
    expect(Article).toBeDefined();
  });

  it("should store dataObject in constructor", () => {
    const testData = "<html><body>Test HTML</body></html>";
    const article = new Article(testData);
    expect(article.dataObject).toBe(testData);
  });

  // Test for null handling in buildArticleList
  it("should return null from buildArticleList when no article links found", async () => {
    // Setup
    const mockDocument = {
      querySelector: vi.fn().mockReturnValue(null),
    };

    JSDOM.mockImplementation(() => ({
      window: {
        document: mockDocument,
      },
    }));

    const article = new Article("<html><body>No article links</body></html>");

    // Act
    const result = await article.buildArticleList();

    // Assert
    expect(result).toBeNull();
  });

  // Test for empty array handling in buildArticleContent
  it("should return null from buildArticleContent when input array is empty", async () => {
    // Setup
    const article = new Article([]);

    // Act
    const result = await article.buildArticleContent();

    // Assert
    expect(result).toBeNull();
  });

  // Test parseArticleText function with simple input
  it("should correctly join paragraphs in parseArticleText", async () => {
    // Setup
    const article = new Article();
    const mockParagraphs = [
      { textContent: "Paragraph 1" },
      { textContent: "  Paragraph 2  " }, // With whitespace to trim
      { textContent: "Paragraph 3" },
    ];

    // Act
    const result = await article.parseArticleText(mockParagraphs);

    // Assert
    expect(result).toBe("Paragraph 1\n\nParagraph 2\n\nParagraph 3");
  });

  // Test getArticlePicURL function
  it("should correctly build article pic URL", async () => {
    // Setup
    const article = new Article();
    const mockImgItem = {
      getAttribute: vi.fn().mockReturnValue("/some/image/path.jpg"),
    };

    // Act
    const result = await article.getArticlePicURL(mockImgItem);

    // Assert
    expect(result).toBe("http://www.kcna.kp/some/image/path.jpg");
  });

  // Test getArticlePicURL with null input
  it("should return null from getArticlePicURL when img item is null", async () => {
    // Setup
    const article = new Article();

    // Act
    const result = await article.getArticlePicURL(null);

    // Assert
    expect(result).toBeNull();
  });
});
