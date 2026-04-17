const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { analyzeJobText } = require("./utils/analyzer");

const PORT = process.env.PORT || 5000;
const REPORTS_FILE = path.join(__dirname, "data", "reports.json");
const COMPANIES_FILE = path.join(__dirname, "data", "companies.json");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

async function readJson(filePath, fallback = []) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function sendFile(res, filePath, contentType = "text/html") {
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function getDomainFromText(text) {
  const match = text.match(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/i);
  return match ? match[1].toLowerCase() : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  try {
    if (req.method === "GET" && pathname === "/api") {
      return sendJson(res, 200, {
        success: true,
        message: "HireSight Pro backend is running",
        endpoints: ["POST /api/analyze", "GET /api/company/:name", "POST /api/report", "GET /api/reports", "GET /api/stats"]
      });
    }

    if (req.method === "POST" && pathname === "/api/analyze") {
      const { jobText } = await parseBody(req);
      if (!jobText || !jobText.trim()) {
        return sendJson(res, 400, { success: false, error: "Job text is required." });
      }

      const analysis = analyzeJobText(jobText);
      const companies = await readJson(COMPANIES_FILE, []);
      const detectedDomain = getDomainFromText(jobText);
      let companyHint = null;

      if (detectedDomain) {
        const matchedCompany = companies.find((company) => company.domain !== "-" && company.domain.toLowerCase() === detectedDomain);
        companyHint = matchedCompany
          ? { name: matchedCompany.name, status: matchedCompany.status, domain: matchedCompany.domain, note: matchedCompany.note }
          : { name: detectedDomain, status: "Unverified domain", domain: detectedDomain, note: "The email domain does not match any company in the built-in list." };
      }

      return sendJson(res, 200, { success: true, ...analysis, detectedDomain, companyHint });
    }

    if (req.method === "GET" && pathname.startsWith("/api/company/")) {
      const name = pathname.replace("/api/company/", "").trim().toLowerCase();
      const companies = await readJson(COMPANIES_FILE, []);
      const company = companies.find((item) => item.name.toLowerCase() === name);

      return sendJson(res, 200, {
        success: true,
        company: company || {
          name: pathname.replace("/api/company/", ""),
          status: "Unknown",
          domain: "Not available",
          note: "This company is not present in the local verification dataset yet."
        }
      });
    }

    if (req.method === "POST" && pathname === "/api/report") {
      const { jobTitle, companyName, description, evidence = "", reporterEmail = "" } = await parseBody(req);
      if (!jobTitle?.trim() || !companyName?.trim() || !description?.trim()) {
        return sendJson(res, 400, { success: false, error: "jobTitle, companyName, and description are required." });
      }

      const reports = await readJson(REPORTS_FILE, []);
      const report = {
        id: crypto.randomUUID(),
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        description: description.trim(),
        evidence: evidence.trim(),
        reporterEmail: reporterEmail.trim(),
        status: "Pending Review",
        createdAt: new Date().toISOString()
      };

      reports.unshift(report);
      await writeJson(REPORTS_FILE, reports);
      return sendJson(res, 201, { success: true, message: "Scam report submitted successfully.", report });
    }

    if (req.method === "GET" && pathname === "/api/reports") {
      const reports = await readJson(REPORTS_FILE, []);
      return sendJson(res, 200, { success: true, count: reports.length, reports });
    }

    if (req.method === "GET" && pathname === "/api/stats") {
      const reports = await readJson(REPORTS_FILE, []);
      const companies = await readJson(COMPANIES_FILE, []);
      const today = new Date().toISOString().slice(0, 10);
      const reportsToday = reports.filter((report) => report.createdAt.startsWith(today)).length;
      return sendJson(res, 200, {
        success: true,
        stats: {
          totalReports: reports.length,
          reportsToday,
          supportedCompanies: companies.length,
          coreFeatures: 6
        }
      });
    }

    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      return sendFile(res, path.join(FRONTEND_DIR, "index.html"), "text/html; charset=utf-8");
    }

    return sendFile(res, path.join(FRONTEND_DIR, "index.html"), "text/html; charset=utf-8");
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`HireSight Pro running on http://localhost:${PORT}`);
});
