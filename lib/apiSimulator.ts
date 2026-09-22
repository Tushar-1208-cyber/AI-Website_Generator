import { ProjectFilesMap } from "@/types/types";

export interface DiscoveredEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description?: string;
  sampleBody?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: unknown;
  timeMs: number;
  logs: string[];
}

/**
 * Auto-detects REST endpoints defined in server files (server.js, routes/*.js, db.json, etc.).
 */
export function discoverApiEndpoints(filesMap: ProjectFilesMap): DiscoveredEndpoint[] {
  const endpoints: DiscoveredEndpoint[] = [];
  const addedSet = new Set<string>();

  const addEndpoint = (method: "GET" | "POST" | "PUT" | "DELETE", path: string, description?: string, sampleBody?: string) => {
    const key = `${method}:${path}`;
    if (!addedSet.has(key)) {
      addedSet.add(key);
      endpoints.push({ method, path, description, sampleBody });
    }
  };

  // 1. Check if db.json exists
  const dbFileKey = Object.keys(filesMap).find((k) => k.endsWith("db.json"));
  if (dbFileKey && filesMap[dbFileKey]) {
    try {
      const parsedDb = JSON.parse(filesMap[dbFileKey]);
      if (typeof parsedDb === "object" && parsedDb !== null) {
        Object.keys(parsedDb).forEach((collection) => {
          const basePath = `/api/${collection}`;
          addEndpoint("GET", basePath, `Fetch list of ${collection}`);
          addEndpoint("POST", basePath, `Create new ${collection} item`, JSON.stringify({ name: `New ${collection} item` }, null, 2));
          addEndpoint("GET", `${basePath}/1`, `Fetch ${collection} item by ID`);
          addEndpoint("DELETE", `${basePath}/1`, `Delete ${collection} item by ID`);
        });
      }
    } catch {
      // Ignore JSON parse errors in db.json draft
    }
  }

  // 2. Scan server code for Express/Node route definitions
  const serverFiles = Object.keys(filesMap).filter((k) =>
    /\.(js|ts|mjs)$/i.test(k) && /server|app|route|api|controller|index/i.test(k)
  );

  const routeRegex = /(?:app|router)\.(get|post|put|delete)\s*\(\s*["']([^"']+)["']/gi;

  for (const fileKey of serverFiles) {
    const content = filesMap[fileKey];
    let match: RegExpExecArray | null;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as "GET" | "POST" | "PUT" | "DELETE";
      const path = match[2];
      const sampleBody = method === "POST" || method === "PUT" ? JSON.stringify({ name: "Sample Data" }, null, 2) : undefined;
      addEndpoint(method, path, `Endpoint from ${fileKey}`, sampleBody);
    }
  }

  // Fallback default endpoints if none found
  if (endpoints.length === 0) {
    addEndpoint("GET", "/api/health", "System health check");
    addEndpoint("GET", "/api/items", "Fetch list of items");
    addEndpoint("POST", "/api/items", "Create a new item", JSON.stringify({ name: "New Product", price: 49.99 }, null, 2));
  }

  return endpoints;
}

/**
 * Simulates REST API execution against the project's mock database/server files.
 */
export async function executeSimulatedApiCall(
  method: "GET" | "POST" | "PUT" | "DELETE",
  urlPath: string,
  requestBodyJson: string,
  filesMap: ProjectFilesMap
): Promise<ApiResponse> {
  const startTime = performance.now();
  const logs: string[] = [];

  logs.push(`[Server] ${new Date().toLocaleTimeString()} - Incoming ${method} request to ${urlPath}`);

  let parsedReqBody: unknown = null;
  if ((method === "POST" || method === "PUT") && requestBodyJson.trim()) {
    try {
      parsedReqBody = JSON.parse(requestBodyJson);
      logs.push(`[Server] Request body received: ${JSON.stringify(parsedReqBody)}`);
    } catch {
      const endTime = performance.now();
      return {
        status: 400,
        statusText: "Bad Request",
        data: { error: "Invalid JSON request body format" },
        timeMs: Math.round(endTime - startTime),
        logs: [...logs, "[Server] Error 400: Malformed JSON body"],
      };
    }
  }

  // Check db.json mock data
  const dbFileKey = Object.keys(filesMap).find((k) => k.endsWith("db.json"));
  let mockDb: Record<string, unknown> = {};
  if (dbFileKey && filesMap[dbFileKey]) {
    try {
      mockDb = JSON.parse(filesMap[dbFileKey]);
    } catch {
      mockDb = {};
    }
  }

  const cleanPath = urlPath.replace(/^\/api\//, "").replace(/^\//, "");
  const pathParts = cleanPath.split("/").filter(Boolean);
  const collectionName = pathParts[0] || "items";

  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 150));
  const endTime = performance.now();
  const timeMs = Math.round(endTime - startTime);

  if (urlPath === "/api/health" || urlPath === "/health") {
    logs.push("[Server] 200 OK - Health check passed");
    return {
      status: 200,
      statusText: "OK",
      data: { status: "healthy", timestamp: new Date().toISOString(), server: "AI Full-Stack Node.js Engine v1.0" },
      timeMs,
      logs,
    };
  }

  const collectionData = mockDb[collectionName] || [
    { id: 1, name: "Sample Item 1", status: "active", createdAt: new Date().toISOString() },
    { id: 2, name: "Sample Item 2", status: "pending", createdAt: new Date().toISOString() },
  ];

  if (method === "GET") {
    if (pathParts.length > 1) {
      const itemId = pathParts[1];
      const item = Array.isArray(collectionData)
        ? collectionData.find((i: Record<string, unknown>) => String(i.id) === itemId)
        : null;

      if (item) {
        logs.push(`[Server] 200 OK - Found record with ID ${itemId}`);
        return { status: 200, statusText: "OK", data: item, timeMs, logs };
      } else {
        logs.push(`[Server] 404 Not Found - Item ${itemId} not found in ${collectionName}`);
        return { status: 404, statusText: "Not Found", data: { error: `Item ${itemId} not found` }, timeMs, logs };
      }
    }

    logs.push(`[Server] 200 OK - Returning ${Array.isArray(collectionData) ? collectionData.length : 1} items`);
    return { status: 200, statusText: "OK", data: collectionData, timeMs, logs };
  }

  if (method === "POST") {
    const newItem = {
      id: Date.now(),
      ...(typeof parsedReqBody === "object" && parsedReqBody !== null ? parsedReqBody : { data: parsedReqBody }),
      createdAt: new Date().toISOString(),
    };
    logs.push(`[Server] 201 Created - Item created successfully with ID ${newItem.id}`);
    return { status: 201, statusText: "Created", data: { message: "Resource created successfully", item: newItem }, timeMs, logs };
  }

  if (method === "PUT") {
    logs.push(`[Server] 200 OK - Updated ${collectionName} item`);
    return { status: 200, statusText: "OK", data: { message: "Resource updated successfully", updated: parsedReqBody }, timeMs, logs };
  }

  if (method === "DELETE") {
    logs.push(`[Server] 200 OK - Deleted item from ${collectionName}`);
    return { status: 200, statusText: "OK", data: { message: "Resource deleted successfully" }, timeMs, logs };
  }

  logs.push(`[Server] 200 OK - Executed ${method} ${urlPath}`);
  return { status: 200, statusText: "OK", data: { message: `Executed ${method} ${urlPath}` }, timeMs, logs };
}
