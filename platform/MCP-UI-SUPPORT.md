# MCP UI Support in Archestra Chat

## Overview

Archestra Chat now supports the **MCP UI specification**, enabling MCP servers to deliver rich, interactive user interfaces directly within the chat experience. This integration allows developers to create dynamic, visually appealing responses that go beyond plain text.

## What is MCP UI?

**MCP UI** is an open specification for delivering interactive web components through the Model Context Protocol. It allows MCP servers to return UI resources alongside tool responses, which are then rendered by the client application.

For more information, see the [MCP UI GitHub Repository](https://github.com/MCP-UI-Org/mcp-ui).

## Supported Content Types

Archestra Chat supports the following MCP UI resource types:

### 1. HTML Resources (`text/html`)
Render inline HTML content in an iframe sandbox.

```json
{
  "uri": "ui://component/id",
  "mimeType": "text/html",
  "text": "<h1>Hello</h1><p>This is HTML content</p>"
}
```

### 2. External URL Resources (`text/uri-list`)
Render external websites in an iframe.

```json
{
  "uri": "ui://component/url",
  "mimeType": "text/uri-list",
  "text": "https://example.com"
}
```

### 3. Remote DOM Resources (`application/vnd.mcp-ui.remote-dom`)
Advanced interactive components using Shopify's remote-dom technology.

```json
{
  "uri": "ui://component/remote-dom",
  "mimeType": "application/vnd.mcp-ui.remote-dom",
  "text": "const button = document.createElement('button'); ...",
  "blob": "..."
}
```

## How to Implement MCP UI in Your MCP Server

### TypeScript/JavaScript

Use the `@mcp-ui/server` package:

```typescript
import { createUIResource } from '@mcp-ui/server';

// Create an HTML resource
const htmlResource = createUIResource({
  uri: 'ui://greeting/1',
  content: {
    type: 'rawHtml',
    htmlString: '<h1>Welcome!</h1><p>This is a rich interface</p>'
  },
  encoding: 'text',
});

// Return from your tool
return {
  content: [{
    type: 'resource',
    resource: htmlResource
  }]
};
```

### Python

Use the `mcp-ui-server` package:

```python
from mcp_ui_server import create_ui_resource

html_resource = create_ui_resource({
  "uri": "ui://greeting/1",
  "content": {"type": "rawHtml", "htmlString": "<h1>Welcome!</h1>"},
  "encoding": "text",
})
```

### Ruby

Use the `mcp_ui_server` gem:

```ruby
require 'mcp_ui_server'

html_resource = McpUiServer.create_ui_resource(
  uri: 'ui://greeting/1',
  content: { type: :raw_html, htmlString: '<h1>Welcome!</h1>' },
  encoding: :text
)
```

## UI Actions and Interactivity

MCP UI resources can trigger actions when users interact with them:

### Supported Actions

1. **Tool Calls** - Trigger execution of MCP tools
2. **Prompts** - Send prompts back to the AI agent
3. **Intents** - Send structured intent messages
4. **Notifications** - Display toast messages to the user
5. **Links** - Open URLs in new tabs

### Handling Tool Calls from UI

When users interact with UI elements that trigger tool calls:

```html
<button onclick="window.parent.postMessage({
  type: 'tool',
  payload: {
    toolName: 'myTool',
    params: { action: 'button-click' }
  }
}, '*')">Click me</button>
```

### Handling Prompts from UI

Send a prompt back to the AI agent:

```html
<button onclick="window.parent.postMessage({
  type: 'prompt',
  payload: { prompt: 'Tell me more about this' }
}, '*')">Learn More</button>
```

## Integration in Archestra Chat

### How It Works

1. An MCP server returns a `UIResource` as part of a tool response
2. Archestra Chat detects the resource using the `isMCPUIResource()` type guard
3. The `MCPUIResourceComponent` renders the resource using the `UIResourceRenderer` from `@mcp-ui/client`
4. User interactions (clicks, form submissions) trigger the `onUIAction` callback
5. Actions are handled appropriately (tool calls, notifications, etc.)

### Resource Detection

Archestra Chat automatically detects MCP UI resources in tool responses. Resources can be returned in several formats:

```typescript
// Direct resource
return {
  content: [{
    type: 'resource',
    resource: {
      uri: 'ui://...',
      mimeType: 'text/html',
      text: '...'
    }
  }]
};

// JSON string
return {
  content: [{ type: 'text', text: JSON.stringify(resource) }]
};

// Nested in object
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      data: { ui: resource }
    })
  }]
};
```

## Security Considerations

- All HTML content is rendered in a **sandboxed iframe** for security
- External URLs are also loaded in sandboxed iframes
- Remote-DOM resources execute in a secure sandbox with controlled access
- User input is not automatically serialized or executed

## Styling and Theming

MCP UI resources are rendered with automatic iframe resizing. The iframe automatically adjusts to fit the content height.

### Custom Styling

Pass custom styles to the `htmlProps`:

```tsx
<MCPUIResourceComponent
  resource={resource}
  toolName="myTool"
  onUIAction={(action) => handleAction(action)}
  htmlProps={{
    style: {
      minHeight: "300px",
      maxHeight: "600px"
    }
  }}
/>
```

## Examples

### Example 1: Interactive Data Visualization

```typescript
const dataVizResource = createUIResource({
  uri: 'ui://dataviz/sales',
  content: {
    type: 'rawHtml',
    htmlString: `
      <div>
        <h2>Monthly Sales</h2>
        <canvas id="chart"></canvas>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          const ctx = document.getElementById('chart').getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Jan', 'Feb', 'Mar'],
              datasets: [{
                label: 'Sales',
                data: [100, 150, 200]
              }]
            }
          });
        </script>
      </div>
    `
  },
  encoding: 'text'
});
```

### Example 2: Interactive Form

```typescript
const formResource = createUIResource({
  uri: 'ui://form/feedback',
  content: {
    type: 'rawHtml',
    htmlString: `
      <form>
        <input type="text" placeholder="Enter feedback">
        <button type="button" onclick="window.parent.postMessage({
          type: 'prompt',
          payload: { prompt: 'User feedback: ' + this.parentElement[0].value }
        }, '*')">Submit</button>
      </form>
    `
  },
  encoding: 'text'
});
```

## Testing MCP UI Resources

Archestra includes comprehensive tests for MCP UI resource extraction and validation:

```bash
# Run MCP UI resource tests
pnpm -F @frontend test mcp-ui-resource.test.ts
```

### Test Coverage

- ✅ Valid resource detection (HTML, external URL, remote-dom)
- ✅ Resource extraction from various formats (objects, JSON strings, arrays, nested objects)
- ✅ Invalid resource filtering
- ✅ Error handling for malformed content

## Troubleshooting

### Resource Not Rendering

**Problem**: UI resource is not appearing in the chat

**Solutions**:
1. Verify the resource has valid `uri` and `mimeType` properties
2. Ensure content is provided in either `text` or `blob` field
3. Check browser console for CORS or sandbox errors
4. Use the `isMCPUIResource()` type guard to validate resources

### Actions Not Working

**Problem**: UI actions (buttons, forms) are not triggering

**Solutions**:
1. Verify the `postMessage` API is being used correctly
2. Ensure action payloads have correct structure (`type` and `payload` fields)
3. Check that the parent frame is properly listening for messages
4. Validate tool names exist in the MCP server

### Performance Issues

**Problem**: UI resources are slow to load

**Solutions**:
1. Use external URLs instead of embedding large HTML
2. Lazy-load scripts and resources
3. Minimize bundle size of HTML content
4. Use compression for large content

## Implementation Details

### Key Components

- **`MCPUIResourceComponent`** - Main component for rendering UI resources
- **`extractMCPUIResources()`** - Utility to extract resources from tool outputs
- **`isMCPUIResource()`** - Type guard to validate resources
- **`UIResourceRenderer`** - Core renderer from `@mcp-ui/client` library

### File Locations

- Component: [`frontend/src/components/chat/mcp-ui-resource.tsx`](frontend/src/components/chat/mcp-ui-resource.tsx)
- Chat Integration: [`frontend/src/components/chat/chat-messages.tsx`](frontend/src/components/chat/chat-messages.tsx)
- Tests: [`frontend/src/components/chat/mcp-ui-resource.test.ts`](frontend/src/components/chat/mcp-ui-resource.test.ts)

## Related Resources

- [MCP UI GitHub Repository](https://github.com/MCP-UI-Org/mcp-ui)
- [MCP UI Documentation](https://mcpui.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Archestra MCP Catalog](/chat?tab=mcp-catalog)

## Best Practices

1. **Always validate resources** - Use the `isMCPUIResource()` type guard
2. **Handle nested structures** - Resources can be nested in response objects
3. **Use sandboxed HTML** - Never inject untrusted HTML directly
4. **Provide fallbacks** - Include text descriptions for accessibility
5. **Test thoroughly** - Verify resources render correctly across different content types
6. **Keep resources lightweight** - Large resources can impact performance
7. **Follow MCP UI spec** - Refer to official documentation for latest standards

## Contributing

To contribute improvements to MCP UI support in Archestra:

1. Create tests in the appropriate test file
2. Update component documentation
3. Follow TypeScript and React best practices
4. Run type-checking: `pnpm -F @frontend type-check`
5. Run tests: `pnpm -F @frontend test`
6. Run linting: `pnpm lint`
