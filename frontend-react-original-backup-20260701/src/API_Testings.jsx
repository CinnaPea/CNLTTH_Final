// ********************************************************************
// Copy the contents of this file into App.jsx to test the API enabler
// ********************************************************************
import { useEffect } from "react";
import { rubyAPI } from "./api/client";

function App() {
  useEffect(() => {
    // Test API Health and basic endpoints
    async function testApi() {
      try {
        const health = await rubyAPI.get("/health");
        console.log("Health:", health);

        const exams = await rubyAPI.get("/ky_thi");
        console.log("KyThi:", exams);

        const students = await rubyAPI.get("/sinh_vien");
        console.log("SinhVien:", students);

        const rooms = await rubyAPI.get("/phong_thi");
        console.log("PhongThi:", rooms);
      } catch (error) {
        console.error("API test failed:", error.message);
      }

    // Test existing endpoint with PATCH method
      try {
        const result = await rubyAPI.patch("/ky_thi/3/publish");
        console.log("Publish result:", result);
      } catch (error) {
        console.error("API Publish failed: " + error.message);
      }

    // Test non-existing endpoint to check error handling
      try {
        await rubyAPI.get("/not_real_endpoint");
      } catch (error) {
        console.log("Expected error:", error.message);
      }

    // Test all endpoints to check their status
      const endpoints = [
        "/health",
        "/mon_thi",
        "/sinh_vien",
        "/phong_thi",
        "/ky_thi",
        "/dang_ky_thi",
        "/phan_phong",
        "/xep_cho",
        "/diem_danh",
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await rubyAPI.get(endpoint);
          console.log("OK:", endpoint, data);
        } catch (error) {
          console.error("FAILED:", endpoint, error.message);
        }
      }
    }

    testApi();
  }, []);

  // Test creating a new subject and then fetching the list to verify
  useEffect(() => {
    async function testCreateSubject() {
      try {
        const createdSubject = await rubyAPI.post("/mon_thi", {
          mon_thi: {
            MaMon: `R${Date.now().toString().slice(-6)}`,
            TenMon: "React API Test Subject",
          },
        });

        console.log("POST OK: /mon_thi", createdSubject);

        const subjects = await rubyAPI.get("/mon_thi");
        console.log("Subjects after create:", subjects);
      } catch (error) {
        console.error("Create subject failed:", error.message);
      }
    }

    testCreateSubject();
  }, []);

  return (
    <main style={{ padding: "24px", fontFamily: "Arial" }}>
      <h1>Ruby API Client Test</h1>
      <p>Open browser console and check API results.</p>
    </main>
  );
}

export default App;