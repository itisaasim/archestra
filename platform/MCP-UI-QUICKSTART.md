# MCP UI Quick Start Guide

Get started building interactive MCP servers with UI support for Archestra Chat.

## 5-Minute Setup

### Step 1: Install Dependencies

For a TypeScript MCP server:

```bash
npm install @mcp-ui/server @modelcontextprotocol/sdk
# or
pnpm add @mcp-ui/server @modelcontextprotocol/sdk
```

### Step 2: Create Your First UI Resource

```typescript
import { createUIResource } from '@mcp-ui/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'my-ui-server',
  version: '1.0.0'
});

// Define a tool that returns UI
server.tool(
  'show_dashboard',
  'Display an interactive dashboard',
  {},
  async () => {
    const uiResource = createUIResource({
      uri: 'ui://dashboard/1',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="padding: 20px;">
            <h1>Welcome!</h1>
            <p>This is your interactive dashboard.</p>
            <button onclick="alert('Button clicked!')">Click me</button>
          </div>
        `
      },
      encoding: 'text'
    });

    return {
      content: [{
        type: 'resource',
        resource: uiResource
      }]
    };
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
```

### Step 3: Test in Archestra Chat

1. Install your MCP server in Archestra
2. Enable the tool in chat
3. Call the tool and see the UI render!

## Common Patterns

### Interactive Form with Tool Call

```typescript
const formResource = createUIResource({
  uri: 'ui://form/submit',
  content: {
    type: 'rawHtml',
    htmlString: `
      <form style="padding: 20px;">
        <input type="text" id="userInput" placeholder="Enter text">
        <button type="button" onclick="
          const input = document.getElementById('userInput');
          window.parent.postMessage({
            type: 'tool',
            payload: {
              toolName: 'process_input',
              params: { text: input.value }
            }
          }, '*');
        ">Submit</button>
      </form>
    `
  },
  encoding: 'text'
});
```

### Data Visualization with Chart.js

```typescript
const chartResource = createUIResource({
  uri: 'ui://chart/sales',
  content: {
    type: 'rawHtml',
    htmlString: `
      <div style="padding: 20px;">
        <h2>Sales Chart</h2>
        <canvas id="myChart"></canvas>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          const ctx = document.getElementById('myChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar'],
              datasets: [{
                label: 'Sales',
                data: [100, 200, 150]
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

### Send Prompt Back to AI

```typescript
const promptButton = createUIResource({
  uri: 'ui://prompt/action',
  content: {
    type: 'rawHtml',
    htmlString: `
      <button onclick="
        window.parent.postMessage({
          type: 'prompt',
          payload: { prompt: 'Tell me more about this result' }
        }, '*');
      " style="padding: 10px 20px; cursor: pointer;">
        Learn More
      </button>
    `
  },
  encoding: 'text'
});
```

### External Website Embed

```typescript
const externalResource = createUIResource({
  uri: 'ui://external/website',
  content: {
    type: 'externalUrl',
    iframeUrl: 'https://example.com'
  },
  encoding: 'text'
});
```

## UI Action Types

### 1. Tool Call
Trigger another MCP tool:
```javascript
window.parent.postMessage({
  type: 'tool',
  payload: {
    toolName: 'my_tool',
    params: { key: 'value' }
  }
}, '*');
```

### 2. Prompt
Send a prompt to the AI:
```javascript
window.parent.postMessage({
  type: 'prompt',
  payload: { prompt: 'Your prompt here' }
}, '*');
```

### 3. Notification
Show a toast:
```javascript
window.parent.postMessage({
  type: 'notify',
  payload: { message: 'Action completed!' }
}, '*');
```

### 4. Link
Open a URL:
```javascript
window.parent.postMessage({
  type: 'link',
  payload: { url: 'https://example.com' }
}, '*');
```

## Tips & Tricks

### Responsive Design
```html
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui; margin: 0; padding: 20px; }
  @media (max-width: 600px) {
    /* Mobile styles */
  }
</style>
```

### Dark Mode Support
```html
<script>
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.style.backgroundColor = isDark ? '#1e1e1e' : '#fff';
  document.body.style.color = isDark ? '#fff' : '#000';
</script>
```

### Auto-resize Parent Container
The Archestra Chat UI automatically resizes the iframe to fit content height.

### Styling Constraints
- Avoid `position: fixed` - use absolute within container
- Limited to iframe sandbox permissions
- No access to parent DOM or localStorage
- No cross-origin access

## Debugging

### Check Browser Console
```javascript
// In iframe console
console.log('Current state:', window.location.href);
// Should show something like: blob:http://localhost:3000/...
```

### Verify postMessage
```javascript
// Test if postMessage works
window.parent.postMessage({ test: 'message' }, '*');
// Check parent console for messages
```

### Inspect Resources
In Archestra Chat, open browser DevTools and check:
1. Network tab - ensure resources load
2. Console tab - check for errors
3. Elements - inspect iframe structure

## Troubleshooting

### Resource Not Showing
- Verify `uri`, `mimeType`, and content are present
- Check CORS headers for external URLs
- Ensure HTML is valid and well-formed

### Buttons Not Working
- Verify `postMessage` target is `*` or the correct origin
- Check action payload structure (must have `type` and `payload`)
- Ensure parent is listening for messages

### Styling Not Applied
- CSS works normally inside iframe
- External stylesheets must have CORS headers
- Inline styles work best for reliability

## Python Example

Using `mcp-ui-server`:

```python
from mcp.server import Server
from mcp_ui_server import create_ui_resource

server = Server("my-ui-server")

@server.tool()
def show_chart(query: str) -> dict:
    """Show an interactive chart based on query"""
    
    resource = create_ui_resource({
        "uri": "ui://chart/query",
        "content": {
            "type": "rawHtml",
            "htmlString": f"""
                <h2>{query}</h2>
                <p>Chart would go here</p>
            """
        },
        "encoding": "text"
    })
    
    return {
        "content": [{
            "type": "resource",
            "resource": resource
        }]
    }
```

## Ruby Example

Using `mcp_ui_server`:

```ruby
require 'mcp'
require 'mcp_ui_server'

server = MCP::Server.new('my-ui-server')

server.define_tool(
  name: 'show_message',
  description: 'Show an interactive message',
  inputSchema: {}
) do |_params|
  resource = McpUiServer.create_ui_resource(
    uri: 'ui://message/1',
    content: {
      type: :raw_html,
      htmlString: '<h1>Hello from Ruby!</h1>'
    },
    encoding: :text
  )

  {
    content: [{
      type: 'resource',
      resource: resource
    }]
  }
end

server.run
```

## Next Steps

1. Read the [MCP UI Specification](https://mcpui.dev/)
2. Check [Archestra MCP Support Guide](MCP-UI-SUPPORT.md)
3. Review examples in the [MCP UI GitHub](https://github.com/MCP-UI-Org/mcp-ui)
4. Join the [MCP Discord](https://discord.gg/CEAG4KW7ZH)

## Support

- 📖 [MCP UI Docs](https://mcpui.dev/)
- 🐙 [GitHub Issues](https://github.com/MCP-UI-Org/mcp-ui/issues)
- 💬 [Discord Community](https://discord.gg/CEAG4KW7ZH)
- 📧 [Archestra Support](https://archestra.ai)

Happy building! 🚀
