// First, obtain a fresh CSRF token (required for the login request)
const getCSRFToken = async () => {
  const response = await fetch("https://edpuzzle.com/api/v3/csrf", {
    credentials: "include",
    headers: {
      "x-edpuzzle-web-version": "7.40.25.9a0061136119380",
      "accept": "application/json"
    }
  });
  return await response.json();
};

// Main login function
const loginToEdpuzzle = async () => {
  try {
    // 1. Get CSRF token
    const { CSRFToken } = await getCSRFToken();
    if (!CSRFToken) throw new Error("Failed to get CSRF token");

    // 2. Prepare the login request with realistic headers
    const response = await fetch("https://edpuzzle.com/api/v3/users/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-chrome-version": "125",
        "x-csrf-token": CSRFToken,
        "x-edpuzzle-preferred-language": "en",
        "x-edpuzzle-referrer": "https://edpuzzle.com/discover",
        "x-edpuzzle-web-version": "7.40.25.9a0061136119380",
        "Referer": "https://edpuzzle.com/",
        "Referrer-Policy": "strict-origin"
      },
      body: JSON.stringify({
        username: "neel_ss@hotmail.com",
        password: "Rsmhw1234",
        role: "teacher"
      })
    });

    // 3. Handle response
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    console.log("Login successful!", data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Execute the login
loginToEdpuzzle();
