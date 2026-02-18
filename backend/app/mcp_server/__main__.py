"""Allow running the MCP server via: python -m app.mcp_server"""

from app.mcp_server.task_tools import mcp

mcp.run(transport="stdio")
