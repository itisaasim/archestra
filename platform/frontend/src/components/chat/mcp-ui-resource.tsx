"use client";

import type { UIActionResult } from "@mcp-ui/client";
import { UIResourceRenderer } from "@mcp-ui/client";
import { useCallback } from "react";
import { toast } from "sonner";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";

/**
 * MCP UI Resource type as returned by MCP tools
 * This is the interface expected from MCP servers implementing the MCP UI spec
 */
export interface MCPUIResource {
  uri: string;
  mimeType:
    | "text/html"
    | "text/uri-list"
    | "application/pdf"
    | "application/vnd.mcp-ui.remote-dom"
    | string;
  text?: string;
  blob?: string;
}

export interface MCPUIResourceProps {
  resource: MCPUIResource;
  toolName: string;
  onUIAction?: (action: UIActionResult) => Promise<unknown>;
}

/**
 * Component to render PDF resources
 * Displays PDF files in an iframe using the browser's native PDF viewer
 */
function PDFViewer({ resource }: { resource: MCPUIResource }) {
  const pdfUrl = resource.text;

  if (!pdfUrl) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No PDF URL provided
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full border-0 rounded"
      style={{ minHeight: "600px" }}
      title="PDF Viewer"
    />
  );
}

/**
 * Component to render MCP UI resources returned by MCP tools
 * Integrates MCP UI's UIResourceRenderer with Archestra chat UI
 */
export function MCPUIResourceComponent({
  resource,
  toolName,
  onUIAction,
}: MCPUIResourceProps) {
  const handleUIAction = useCallback(
    async (action: UIActionResult): Promise<unknown> => {
      // Handle different action types
      switch (action.type) {
        case "tool": {
          // Tool call action - this would be handled by the parent chat component
          if (onUIAction) {
            return await onUIAction(action);
          }
          break;
        }

        case "prompt": {
          // Prompt action - triggered when UI sends a prompt
          const promptPayload = action.payload as { prompt: string };
          toast.info(promptPayload.prompt);
          if (onUIAction) {
            return await onUIAction(action);
          }
          break;
        }

        case "intent": {
          // Intent action
          const intentPayload = action.payload as {
            intent: string;
            params?: Record<string, unknown>;
          };
          toast.info(intentPayload.intent);
          if (onUIAction) {
            return await onUIAction(action);
          }
          break;
        }

        case "notify": {
          // Notification action
          const notifyPayload = action.payload as { message: string };
          toast.info(notifyPayload.message);
          break;
        }

        case "link": {
          // Link action - open URL
          const linkPayload = action.payload as { url: string };
          if (linkPayload.url) {
            window.open(linkPayload.url, "_blank");
          }
          break;
        }

        default: {
          break;
        }
      }
      return undefined;
    },
    [onUIAction],
  );

  // Handle PDF resources with native PDF viewer
  if (resource.mimeType === "application/pdf") {
    return (
      <Tool className="cursor-default">
        <ToolHeader
          type={`tool-${toolName}`}
          state="output-available"
          isCollapsible={false}
        />
        <ToolContent>
          <div className="w-full bg-background rounded-md border border-border overflow-hidden">
            <PDFViewer resource={resource} />
          </div>
        </ToolContent>
      </Tool>
    );
  }

  return (
    <Tool className="cursor-default">
      <ToolHeader
        type={`tool-${toolName}`}
        state="output-available"
        isCollapsible={false}
      />
      <ToolContent>
        <div className="w-full bg-background rounded-md border border-border">
          <UIResourceRenderer
            resource={resource}
            onUIAction={handleUIAction}
            htmlProps={{
              autoResizeIframe: true,
              style: {
                minHeight: "300px",
              },
            }}
          />
        </div>
      </ToolContent>
    </Tool>
  );
}

/**
 * Type guard to check if an object is a valid MCP UI resource
 */
export function isMCPUIResource(obj: unknown): obj is MCPUIResource {
  if (typeof obj !== "object" || obj === null) return false;

  const resource = obj as Record<string, unknown>;

  // Check required properties
  if (typeof resource.uri !== "string") return false;
  if (typeof resource.mimeType !== "string") return false;

  // Check for MCP UI specific MIME types
  const validMimeTypes = [
    "text/html",
    "text/uri-list",
    "application/pdf",
    "application/vnd.mcp-ui.remote-dom",
  ];

  const isMCPUIMimeType =
    validMimeTypes.includes(resource.mimeType) ||
    resource.mimeType.startsWith("application/vnd.mcp-ui");

  if (!isMCPUIMimeType) return false;

  // At least one content source should be present
  const hasContent = !!resource.text || !!resource.blob;

  return hasContent;
}

/**
 * Extract MCP UI resources from tool output
 * Tool output can be various formats, we need to find and extract UIResource objects
 */
export function extractMCPUIResources(output: unknown): MCPUIResource[] {
  const resources: MCPUIResource[] = [];
  const visited = new WeakSet<object>();

  function extractRecursive(obj: unknown): void {
    if (!obj) return;
    if (typeof obj !== "object") return;

    // Prevent infinite recursion with circular references
    if (visited.has(obj)) return;
    visited.add(obj);

    // Check if this object itself is a UIResource
    if (isMCPUIResource(obj)) {
      resources.push(obj);
      return;
    }

    // Search in object values
    if (!Array.isArray(obj)) {
      for (const value of Object.values(obj)) {
        extractRecursive(value);
      }
      return;
    }

    // Search in array items
    for (const item of obj) {
      extractRecursive(item);
    }
  }

  // If output is a string, try to parse as JSON first
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      extractRecursive(parsed);
      return resources;
    } catch {
      // Not valid JSON, ignore
      return resources;
    }
  }

  extractRecursive(output);
  return resources;
}
