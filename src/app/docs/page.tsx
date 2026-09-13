"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Topbar, Footer } from "../components/SiteShell";
import { openApiSpec, OpenApiOperation, OpenApiParameter } from "../lib/openapi";

type ParsedEndpoint = {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  params: OpenApiParameter[];
  responses: Record<string, any>;
};

const API_BASE_URL = "https://results-nith.vercel.app";

export default function DocsPage() {
  const baseUrl = API_BASE_URL;


  // Dynamically parse endpoints from the single source of truth openApiSpec
  const endpoints: ParsedEndpoint[] = useMemo(() => {
    const list: ParsedEndpoint[] = [];
    for (const [path, methods] of Object.entries(openApiSpec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        list.push({
          id: op.operationId || `${method}-${path}`,
          method: method.toUpperCase(),
          path,
          summary: op.summary,
          description: op.description,
          tags: op.tags || [],
          params: op.parameters || [],
          responses: op.responses || {},
        });
      }
    }
    return list;
  }, []);

  // Initialize parameter values from schema examples
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const [path, methods] of Object.entries(openApiSpec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        const id = op.operationId || `${method}-${path}`;
        initial[id] = {};
        for (const p of op.parameters || []) {
          const defaultVal =
            p.schema?.example !== undefined
              ? String(p.schema.example)
              : p.schema?.default !== undefined
              ? String(p.schema.default)
              : "";
          initial[id][p.name] = defaultVal;
        }
      }
    }
    return initial;
  });

  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, "curl" | "js" | "py">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [responseMap, setResponseMap] = useState<
    Record<string, { status: number; duration: number; data: any }>
  >({});

  const handleParamChange = (epId: string, paramName: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [epId]: {
        ...prev[epId],
        [paramName]: value,
      },
    }));
  };

  const copySnippet = (epId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(epId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Helper to build resolved path & query params from current user inputs
  const resolveUrl = (ep: ParsedEndpoint, currentP: Record<string, string>) => {
    let resolvedPath = ep.path;
    const q = new URLSearchParams();

    for (const p of ep.params) {
      const val = currentP[p.name] ?? (p.schema?.example ? String(p.schema.example) : "");
      if (p.in === "path") {
        resolvedPath = resolvedPath.replace(`{${p.name}}`, encodeURIComponent(val || ""));
      } else if (p.in === "query" && val) {
        q.append(p.name, val);
      }
    }

    const qs = q.toString();
    return {
      relativePath: `${resolvedPath}${qs ? `?${qs}` : ""}`,
      fullUrl: `${baseUrl}${resolvedPath}${qs ? `?${qs}` : ""}`,
      queryParams: Object.fromEntries(q.entries()),
    };
  };

  const generateCurl = (ep: ParsedEndpoint) => {
    const p = paramValues[ep.id] || {};
    const { fullUrl } = resolveUrl(ep, p);
    return `curl -X ${ep.method} "${fullUrl}"`;
  };

  const generateJs = (ep: ParsedEndpoint) => {
    const p = paramValues[ep.id] || {};
    const { relativePath } = resolveUrl(ep, p);
    return `fetch("${relativePath}")\n  .then(res => res.json())\n  .then(data => console.log(data));`;
  };

  const generatePython = (ep: ParsedEndpoint) => {
    const p = paramValues[ep.id] || {};
    const { fullUrl, queryParams } = resolveUrl(ep, p);

    if (Object.keys(queryParams).length > 0) {
      const urlWithoutQuery = fullUrl.split("?")[0];
      return `import requests\n\nparams = ${JSON.stringify(queryParams, null, 2)}\nresponse = requests.get("${urlWithoutQuery}", params=params)\nprint(response.json())`;
    }
    return `import requests\n\nresponse = requests.get("${fullUrl}")\nprint(response.json())`;
  };

  const executeRequest = async (ep: ParsedEndpoint) => {
    setLoadingMap((prev) => ({ ...prev, [ep.id]: true }));
    const p = paramValues[ep.id] || {};
    const { relativePath } = resolveUrl(ep, p);

    const start = performance.now();
    try {
      const res = await fetch(relativePath);
      const data = await res.json();
      const duration = Math.round(performance.now() - start);
      setResponseMap((prev) => ({
        ...prev,
        [ep.id]: { status: res.status, duration, data },
      }));
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setResponseMap((prev) => ({
        ...prev,
        [ep.id]: {
          status: 500,
          duration,
          data: { error: "Network or client request error", message: err?.message },
        },
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [ep.id]: false }));
    }
  };

  return (
    <main className="wrap">
      <Topbar />

      <header className="hero docs-hero">
        <div className="docs-badge-row">
          <span className="openapi-badge">
            <svg
              className="openapi-badge-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.2a9.78 9.78 0 0 1 8.86 5.62l-3.32 1.92a6 6 0 0 0-5.54-3.74c-3.31 0-6 2.69-6 6 0 1.25.39 2.41 1.05 3.37L3.93 17.5A9.76 9.76 0 0 1 2.2 12c0-5.41 4.39-9.8 9.8-9.8zm6.46 9.8c0 3.31-2.69 6-6 6a5.98 5.98 0 0 1-4.24-1.76l-2.92 2.92A9.77 9.77 0 0 0 12 21.8c5.41 0 9.8-4.39 9.8-9.8 0-.96-.14-1.89-.4-2.77l-3.5 2.02c.36.85.56 1.77.56 2.75z" />
            </svg>
            <span>OpenAPI {openApiSpec.openapi} Spec</span>
          </span>
          <span className="docs-version-pill">v{openApiSpec.info.version}</span>
        </div>

        <h1 className="docs-title">
          NITH Results <em>API Docs</em>
        </h1>
        <p className="docs-sub">
          {openApiSpec.info.description}
        </p>

        <div className="docs-cta-row">
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="pgbtn"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>OpenAPI JSON Schema</span>
          </a>

          <div
            className="docs-host-pill"
            title="Base URL used for API requests"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid rgb(var(--card-border-rgb))",
              background: "var(--surface)",
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ opacity: 0.55 }}>Base URL:</span>
            <strong>{baseUrl}</strong>
          </div>

          <Link
            href="/"
            className="pgbtn"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back to Leaderboard</span>
          </Link>
        </div>
      </header>

      <section className="docs-endpoints">
        <h2 className="docs-sec-title">Endpoints ({endpoints.length})</h2>

        {endpoints.map((ep) => {
          const currentParams = paramValues[ep.id] || {};
          const currentTab = activeSnippetTab[ep.id] || "curl";
          const snippet =
            currentTab === "curl"
              ? generateCurl(ep)
              : currentTab === "js"
              ? generateJs(ep)
              : generatePython(ep);

          const response = responseMap[ep.id];
          const isLoading = loadingMap[ep.id];

          return (
            <article key={ep.id} className="api-card" id={ep.id}>
              <div className="api-card-header">
                <span className={`http-badge ${ep.method.toLowerCase()}`}>
                  {ep.method}
                </span>
                <span className="api-card-path">{ep.path}</span>
                <span className="api-card-summary">{ep.summary}</span>
              </div>

              <p className="api-card-desc">{ep.description}</p>

              {ep.params.length > 0 && (
                <div className="api-params-block">
                  <h4 className="api-block-title">Parameters</h4>
                  <div className="api-param-list">
                    {ep.params.map((param) => (
                      <div key={param.name} className="api-param-row">
                        <div className="api-param-meta">
                          <strong className="param-name">{param.name}</strong>
                          {param.schema?.type && (
                            <span className="param-type">{param.schema.type}</span>
                          )}
                          <span className="param-in">in {param.in}</span>
                          {param.required && (
                            <span className="param-required">required</span>
                          )}
                        </div>
                        <div className="api-param-desc">
                          {param.description || "No description provided."}
                        </div>
                        <div className="api-param-input-wrap">
                          <input
                            type="text"
                            className="api-param-input"
                            value={currentParams[param.name] ?? ""}
                            onChange={(e) =>
                              handleParamChange(ep.id, param.name, e.target.value)
                            }
                            placeholder={
                              param.schema?.example !== undefined
                                ? String(param.schema.example)
                                : param.name
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Snippet Tabs */}
              <div className="api-snippet-block">
                <div className="snippet-tabs-bar">
                  <div className="snippet-tabs">
                    <button
                      type="button"
                      className={`snippet-tab ${currentTab === "curl" ? "active" : ""}`}
                      onClick={() =>
                        setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "curl" }))
                      }
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      className={`snippet-tab ${currentTab === "js" ? "active" : ""}`}
                      onClick={() =>
                        setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "js" }))
                      }
                    >
                      JavaScript
                    </button>
                    <button
                      type="button"
                      className={`snippet-tab ${currentTab === "py" ? "active" : ""}`}
                      onClick={() =>
                        setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "py" }))
                      }
                    >
                      Python
                    </button>
                  </div>

                  <div className="snippet-actions">
                    <button
                      type="button"
                      className="snippet-copy-btn"
                      onClick={() => copySnippet(ep.id, snippet)}
                    >
                      {copiedId === ep.id ? "✓ Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      className="api-try-btn"
                      disabled={isLoading}
                      onClick={() => executeRequest(ep)}
                    >
                      {isLoading ? (
                        <span>Testing…</span>
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Test Endpoint</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <pre className="snippet-code">
                  <code>{snippet}</code>
                </pre>
              </div>

              {/* Interactive Response Box */}
              {response && (
                <div className="api-response-block">
                  <div className="api-response-header">
                    <span
                      className={`response-status-pill ${
                        response.status >= 200 && response.status < 300
                          ? "status-ok"
                          : "status-err"
                      }`}
                    >
                      HTTP {response.status}
                    </span>
                    <span className="response-time-pill">
                      {response.duration} ms
                    </span>
                  </div>
                  <pre className="response-json">
                    <code>{JSON.stringify(response.data, null, 2)}</code>
                  </pre>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <Footer />
    </main>
  );
}
