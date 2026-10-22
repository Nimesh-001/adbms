package com.supermart.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String homeHtml() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SuperMart ADBMS - Backend Status</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background: #0f172a;
                        color: #f8fafc;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .card {
                        background: #1e293b;
                        border: 1px solid #334155;
                        border-radius: 16px;
                        padding: 40px;
                        max-width: 600px;
                        width: 100%;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }
                    .badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: #065f46;
                        color: #34d399;
                        padding: 6px 12px;
                        border-radius: 9999px;
                        font-weight: 600;
                        font-size: 0.85rem;
                        margin-bottom: 16px;
                    }
                    .badge-dot {
                        width: 8px;
                        height: 8px;
                        background: #34d399;
                        border-radius: 50%;
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: .5; }
                    }
                    h1 {
                        margin: 0 0 12px 0;
                        font-size: 1.75rem;
                        color: #ffffff;
                    }
                    p {
                        color: #94a3b8;
                        line-height: 1.6;
                        margin: 0 0 24px 0;
                    }
                    .btn-primary {
                        display: block;
                        text-align: center;
                        background: #10b981;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        transition: background 0.2s;
                    }
                    .btn-primary:hover {
                        background: #059669;
                    }
                    .endpoints {
                        background: #0f172a;
                        padding: 16px;
                        border-radius: 8px;
                        border: 1px solid #334155;
                        font-size: 0.9rem;
                    }
                    .endpoints div {
                        padding: 4px 0;
                        color: #cbd5e1;
                    }
                    .endpoints a {
                        color: #38bdf8;
                        text-decoration: none;
                    }
                    .endpoints a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">
                        <span class="badge-dot"></span>
                        Backend API Online (Port 8080)
                    </div>
                    <h1>SuperMart REST API Server</h1>
                    <p>
                        The backend Spring Boot service and MySQL Database connection are up and running properly!
                        This service provides REST endpoints consumed by the React Frontend.
                    </p>

                    <a href="http://localhost:5173" class="btn-primary">
                        Open Web Application (Frontend) &rarr;
                    </a>

                    <div style="margin-top: 24px;">
                        <p style="margin-bottom: 8px; font-weight: 600; color: #cbd5e1;">Available API Endpoints:</p>
                        <div class="endpoints">
                            <div>GET <a href="/api/products" target="_blank">/api/products</a> - Active Product Catalog View</div>
                            <div>GET <a href="/api/products/categories" target="_blank">/api/products/categories</a> - Product Categories</div>
                            <div>GET <a href="/api/products/brands" target="_blank">/api/products/brands</a> - Product Brands</div>
                            <div>POST <a href="#">/api/auth/login</a> - User Authentication</div>
                            <div>GET <a href="#">/api/admin/analytics</a> - Super Admin Analytics View</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    @GetMapping(value = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> apiStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("success", true);
        status.put("service", "SuperMart Backend REST API");
        status.put("status", "UP");
        status.put("port", 8080);
        status.put("frontendUrl", "http://localhost:5173");
        return ResponseEntity.ok(status);
    }
}
