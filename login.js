javascript:(async function() {
  // Debug mode (set to true to see network details)
  const DEBUG_MODE = true;
  
  // 1. Prompt for credentials
  const username = prompt("Edpuzzle Email:", "neel_ss@hotmail.com");
  if (!username) return;
  
  const password = prompt("Edpuzzle Password:", "");
  if (!password) return;

  // 2. Generate fresh cookies (matching your working example)
  function generateCookies() {
    const randomCSRF = "gen_" + Math.random().toString(36).slice(2, 10);
    const wafToken = "cafd6c8f-623f-468e-babb-a7f289153dec:CAoAi+GeUnokAAAA:" + 
                    btoa(Math.random().toString(36)).slice(0, 100) + "==";
    
    document.cookie = `edpuzzleCSRF=${randomCSRF}; domain=.edpuzzle.com; path=/; secure`;
    document.cookie = `aws-waf-token=${wafToken}; domain=.edpuzzle.com; path=/`;
    
    return {
      edpuzzleCSRF: randomCSRF,
      awsWaf: wafToken,
      dd_s: `rum=0&expire=${Date.now() + 3600000}&logs=0`
    };
  }

  // 3. Get CSRF token (matching your headers)
  async function getCSRFToken() {
    const response = await fetch("https://edpuzzle.com/api/v3/csrf", {
      credentials: "include",
      headers: {
        "x-edpuzzle-web-version": "7.40.25.9a0061136034295",
        "accept": "application/json"
      }
    });
    
    if (!response.ok) throw new Error("CSRF fetch failed");
    return await response.json();
  }

  // 4. Main login function
  async function login() {
    try {
      // Generate fresh cookies
      const cookies = generateCookies();
      if (DEBUG_MODE) console.log("Generated cookies:", cookies);

      // Get CSRF token
      const csrfData = await getCSRFToken();
      const csrfToken = csrfData.CSRFToken;
      if (DEBUG_MODE) console.log("CSRF token:", csrfToken);

      // Prepare headers (exactly matching your working example)
      const headers = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
        "x-edpuzzle-web-version": "7.40.25.9a0061136034295",
        "x-edpuzzle-referrer": "https://edpuzzle.com/",
        "cookie": `edpuzzleCSRF=${cookies.edpuzzleCSRF}; aws-waf-token=${cookies.awsWaf}; _dd_s=${cookies.dd_s}`
      };

      // Make the login request
      const response = await fetch("https://edpuzzle.com/api/v3/users/login", {
        method: "POST",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({
          username: username,
          password: password,
          role: "teacher"
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Logged in as ${username}`);
        if (DEBUG_MODE) console.log("Full response:", data);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      if (DEBUG_MODE) console.error("Debug info:", {
        error: error,
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Run login flow
  if (location.host.includes("edpuzzle.com")) {
    await login();
  } else {
    alert("Please run this on edpuzzle.com");
  }
})();
