import { describe, expect, it } from "vitest";
import {
  extractMCPUIResources,
  isMCPUIResource,
  type MCPUIResource,
} from "./mcp-ui-resource";

describe("MCP UI Resource Utilities", () => {
  describe("isMCPUIResource", () => {
    it("should return true for valid HTML resource", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "text/html",
        text: "<h1>Hello</h1>",
      };
      expect(isMCPUIResource(resource)).toBe(true);
    });

    it("should return true for valid external URL resource", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "text/uri-list",
        text: "https://example.com",
      };
      expect(isMCPUIResource(resource)).toBe(true);
    });

    it("should return true for valid remote-dom resource", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "application/vnd.mcp-ui.remote-dom",
        text: "const btn = document.createElement('button');",
      };
      expect(isMCPUIResource(resource)).toBe(true);
    });

    it("should return false for missing URI", () => {
      const resource = {
        mimeType: "text/html",
        text: "<h1>Hello</h1>",
      };
      expect(isMCPUIResource(resource)).toBe(false);
    });

    it("should return false for missing mimeType", () => {
      const resource = {
        uri: "ui://test/1",
        text: "<h1>Hello</h1>",
      };
      expect(isMCPUIResource(resource)).toBe(false);
    });

    it("should return false for missing content", () => {
      const resource = {
        uri: "ui://test/1",
        mimeType: "text/html",
      };
      expect(isMCPUIResource(resource)).toBe(false);
    });

    it("should return false for invalid mimeType", () => {
      const resource = {
        uri: "ui://test/1",
        mimeType: "application/json",
        text: "{}",
      };
      expect(isMCPUIResource(resource)).toBe(false);
    });
  });

  describe("extractMCPUIResources", () => {
    it("should extract single resource from object", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "text/html",
        text: "<h1>Hello</h1>",
      };
      const result = extractMCPUIResources(resource);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(resource);
    });

    it("should extract resources from JSON string", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "text/html",
        text: "<h1>Hello</h1>",
      };
      const jsonString = JSON.stringify(resource);
      const result = extractMCPUIResources(jsonString);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(resource);
    });

    it("should extract resources from array", () => {
      const resources: MCPUIResource[] = [
        {
          uri: "ui://test/1",
          mimeType: "text/html",
          text: "<h1>Hello</h1>",
        },
        {
          uri: "ui://test/2",
          mimeType: "text/uri-list",
          text: "https://example.com",
        },
      ];
      const result = extractMCPUIResources(resources);
      expect(result).toHaveLength(2);
      expect(result).toEqual(resources);
    });

    it("should extract resources from nested object", () => {
      const resource: MCPUIResource = {
        uri: "ui://test/1",
        mimeType: "text/html",
        text: "<h1>Hello</h1>",
      };
      const nested = {
        data: {
          ui: resource,
        },
      };
      const result = extractMCPUIResources(nested);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(resource);
    });

    it("should return empty array for null", () => {
      const result = extractMCPUIResources(null);
      expect(result).toHaveLength(0);
    });

    it("should return empty array for undefined", () => {
      const result = extractMCPUIResources(undefined);
      expect(result).toHaveLength(0);
    });

    it("should return empty array for invalid JSON string", () => {
      const result = extractMCPUIResources("not valid json");
      expect(result).toHaveLength(0);
    });

    it("should filter out invalid resources from array", () => {
      const mixed = [
        {
          uri: "ui://test/1",
          mimeType: "text/html",
          text: "<h1>Hello</h1>",
        },
        {
          mimeType: "text/html",
          // missing uri - invalid
          text: "<h1>Hello</h1>",
        },
        {
          uri: "ui://test/2",
          mimeType: "text/uri-list",
          text: "https://example.com",
        },
      ];
      const result = extractMCPUIResources(mixed);
      expect(result).toHaveLength(2);
    });
  });
});
