import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import TgReq from "../models/tg-model.js";
import tokenArray from "../config/tg-bot.js";

// Mock the dependencies
vi.mock("fs");
vi.mock("axios");
vi.mock("form-data");
vi.mock("../config/tg-bot.js", () => {
  return {
    default: ["token1", "token2", "token3"],
  };
});

// Mock global fetch
global.fetch = vi.fn();

describe("TgReq Model", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  // Basic constructor test
  it("should store dataObject in constructor", () => {
    const testData = { chatId: "123456" };
    const tgReq = new TgReq(testData);
    expect(tgReq.dataObject).toBe(testData);
  });

  // Test tgGet method
  it("should make a GET request to the Telegram API", async () => {
    // Setup
    const mockOffset = 10;
    const mockResponse = { ok: true, result: [] };

    // Mock fetch response
    global.fetch.mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const tgReq = new TgReq({ offset: mockOffset });

    // Act
    const result = await tgReq.tgGet(0);

    // Assert
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(`https://api.telegram.org/bot${tokenArray[0]}/getUpdates?offset=${mockOffset}`);
  });

  // Test tgPost method
  it("should make a POST request to the Telegram API", async () => {
    // Setup
    const mockData = { chat_id: "123456", text: "Hello, world!" };
    const mockResponse = { ok: true, result: { message_id: 42 } };

    // Mock fetch response
    global.fetch.mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const tgReq = new TgReq(mockData);

    // Act
    const result = await tgReq.tgPost("sendMessage", 1);

    // Assert
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(`https://api.telegram.org/bot${tokenArray[1]}/sendMessage`, {
      method: "POST",
      body: JSON.stringify(mockData),
      headers: { "Content-Type": "application/json" },
    });
  });

  // Test tgPicFS method
  it("should upload a photo to Telegram", async () => {
    // Setup
    const mockData = {
      chatId: "123456",
      picPath: "/path/to/pic.jpg",
    };
    const mockResponse = { ok: true, result: { message_id: 42 } };

    // Mock FormData
    const mockForm = {
      append: vi.fn(),
      getHeaders: vi.fn().mockReturnValue({ "mock-header": "value" }),
    };
    FormData.mockImplementation(() => mockForm);

    // Mock fs
    const mockReadStream = { pipe: vi.fn() };
    fs.createReadStream.mockReturnValue(mockReadStream);

    // Mock axios
    axios.post.mockResolvedValue({ data: mockResponse });

    const tgReq = new TgReq(mockData);

    // Act
    const result = await tgReq.tgPicFS(2);

    // Assert
    expect(result).toEqual(mockResponse);
    expect(mockForm.append).toHaveBeenCalledWith("chat_id", mockData.chatId);
    expect(mockForm.append).toHaveBeenCalledWith("photo", mockReadStream);
    expect(axios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${tokenArray[2]}/sendPhoto`, mockForm, { headers: { "mock-header": "value" } });
  });

  it("should handle errors when uploading photos", async () => {
    // Setup
    const mockData = {
      chatId: "123456",
      picPath: "/path/to/pic.jpg",
    };
    const mockError = {
      response: {
        data: { ok: false, error_code: 400, description: "Bad Request" },
      },
    };

    // Mock FormData
    const mockForm = {
      append: vi.fn(),
      getHeaders: vi.fn().mockReturnValue({}),
    };
    FormData.mockImplementation(() => mockForm);

    // Mock axios to throw an error
    axios.post.mockRejectedValue(mockError);

    const tgReq = new TgReq(mockData);

    // Act
    const result = await tgReq.tgPicFS(0);

    // Assert
    expect(result).toEqual(mockError.response.data);
    expect(console.log).toHaveBeenCalledWith("UPLOAD FUCKED");
  });

  // Test checkToken method
  it("should rotate token when 429 error is received", async () => {
    // Setup - capture the original tokenIndex
    const originalTokenIndex = tokenIndex; // This is the module-level variable

    // Create an error response with 429 code
    const errorData = { ok: false, error_code: 429, description: "Too Many Requests" };

    const tgReq = new TgReq({});

    // Act
    await tgReq.checkToken(errorData);

    // Assert
    expect(tokenIndex).toBe((originalTokenIndex + 1) % tokenArray.length);
    expect(console.log).toHaveBeenCalledWith(`GOT 429 ERROR, TRYING NEW FUCKING BOT. TOKEN INDEX: ${tokenIndex}`);
  });

  it("should not rotate token when response is successful", async () => {
    // Setup - capture the original tokenIndex
    const originalTokenIndex = tokenIndex;

    // Create a success response
    const successData = { ok: true, result: [] };

    const tgReq = new TgReq({});

    // Act
    const result = await tgReq.checkToken(successData);

    // Assert
    expect(result).toBeNull();
    expect(tokenIndex).toBe(originalTokenIndex); // Token index should not change
  });

  // Test sendMessageChunkTG method
  it("should send a message and handle token rotation if needed", async () => {
    // Setup
    const mockData = { chat_id: "123456", text: "Test message" };
    const successResponse = { ok: true, result: { message_id: 42 } };

    // Create a spy for tgPost method
    const tgPostSpy = vi.spyOn(TgReq.prototype, "tgPost").mockResolvedValue(successResponse);

    // Create a spy for checkToken method
    const checkTokenSpy = vi.spyOn(TgReq.prototype, "checkToken").mockResolvedValue(null); // No token rotation needed

    const tgReq = new TgReq(mockData);

    // Act
    const result = await tgReq.sendMessageChunkTG();

    // Assert
    expect(result).toEqual(successResponse);
    expect(tgPostSpy).toHaveBeenCalledWith("sendMessage", expect.any(Number));
    expect(checkTokenSpy).toHaveBeenCalledWith(successResponse);
  });

  // Test editCaptionTG method
  it("should edit a message caption", async () => {
    // Setup
    const mockData = {
      result: {
        chat: { id: "123456" },
        message_id: 42,
      },
    };
    const newCaption = "Updated caption";
    const successResponse = { ok: true };

    // Create a spy for tgPost method
    const tgPostSpy = vi.spyOn(TgReq.prototype, "tgPost").mockResolvedValue(successResponse);

    // Create a spy for checkToken method
    const checkTokenSpy = vi.spyOn(TgReq.prototype, "checkToken").mockResolvedValue(null); // No token rotation needed

    const tgReq = new TgReq(mockData);

    // Act
    const result = await tgReq.editCaptionTG(newCaption);

    // Assert
    expect(result).toEqual(successResponse);
    expect(tgPostSpy).toHaveBeenCalledWith("editMessageCaption", expect.any(Number));

    // Check that the parameters were constructed correctly
    const expectedParams = {
      chat_id: "123456",
      message_id: 42,
      caption: newCaption,
    };
    expect(TgReq).toHaveBeenCalledWith(expectedParams);
  });
});
