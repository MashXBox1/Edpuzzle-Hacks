(async function () {
  function getAssignmentId() {
    let assignmentId = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/)?.[1];
    if (!assignmentId) {
      assignmentId = prompt("Enter Edpuzzle assignment ID:");
      if (!assignmentId) {
        return null;
      }
    }
    return assignmentId;
  }

  async function fetchAssignment(assignmentId) {
    try {
      const response = await fetch("https://edpuzzle.com/api/v3/assignments/" + assignmentId, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch assignment (Status: " + response.status + ')');
      }
      return await response.json();
    } catch (error) {
      console.error("Assignment fetch error:", error);
      return null;
    }
  }

  async function fetchMedia(mediaId, token) {
    try {
      const response = await fetch("https://edpuzzle.com/api/v3/media/" + mediaId, {
        headers: {
          Authorization: "Bearer " + token,
          'Content-Type': "application/json"
        },
        credentials: "omit"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch media (Status: " + response.status + ')');
      }
      return await response.json();
    } catch (error) {
      console.error("Media fetch error:", error);
      return null;
    }
  }

  async function generateAnswer(questionText, answerElement, provider = "deepinfra") {
    try {
      answerElement.innerHTML = "<em>Generating answer with " + provider + "...</em>";
      let response;
      
      switch (provider) {
        case "deepinfra":
          response = await fetch("https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              Authorization: "Bearer x8i4xUCxtNs4EZMMiO2ifmyxnxZD8WYl"
            },
            body: JSON.stringify({
              input: "Answer this Edpuzzle question concisely and accurately: " + questionText,
              max_new_tokens: 200,
              temperature: 0.7
            })
          });
          if (response.status === 429) {
            throw new Error("DeepInfra rate limit - try again later");
          }
          if (response.status === 403) {
            throw new Error("Invalid API key - check your DeepInfra key");
          }
          break;
          
        case "huggingface":
          response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1", {
            method: "POST",
            headers: {
              Authorization: "Bearer YOUR_HF_TOKEN_HERE",
              'Content-Type': "application/json"
            },
            body: JSON.stringify({
              inputs: "Answer this Edpuzzle question: " + questionText,
              parameters: {
                max_new_tokens: 150
              }
            })
          });
          break;
          
        case 'pawan':
          response = await fetch('https://api.pawan.krd/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': "application/json",
              Authorization: "Bearer pk-this-is-a-free-free-key-6445d31b64a9407d8093c563a8ac9125"
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{
                role: "user",
                content: "Answer this Edpuzzle question: " + questionText
              }],
              max_tokens: 150
            })
          });
          break;
          
        default:
          response = await fetch("https://chatgpt-api.shn.hk/v1/", {
            method: 'POST',
            headers: {
              'Content-Type': "application/json"
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{
                role: 'user',
                content: "Answer this: " + questionText
              }]
            })
          });
      }
      
      const responseData = await response.json();
      let answerText;
      
      if (provider === "deepinfra") {
        answerText = responseData.results?.[0]?.["generated_text"] || "No answer generated";
      } else if (provider === "huggingface") {
        answerText = responseData[0]?.['generated_text'] || "No answer generated";
      } else {
        answerText = responseData.choices?.[0]?.["message"]?.['content'] || "No answer generated";
      }
      
      answerText = answerText.replace(/Answer this Edpuzzle question.*?:/, '').trim();
      answerElement.innerHTML = "<div class=\"ai-answer\">🤖 <strong>" + provider + "</strong>: " + answerText + '</div>';
    } catch (error) {
      console.error("Error with " + provider + ':', error);
      const providers = ['deepinfra', "huggingface", "pawan", "default"];
      const nextProvider = providers[providers.indexOf(provider) + 1];
      
      if (nextProvider) {
        answerElement.innerHTML = "<em>" + error.message + ". Retrying with " + nextProvider + "...</em>";
        setTimeout(() => generateAnswer(questionText, answerElement, nextProvider), 1500);
      } else {
        answerElement.innerHTML = "<div class=\"ai-answer error\">⚠ All providers failed. Try again later.</div>";
      }
    }
  }

  function showAnswersUI(assignmentData) {
    let htmlContent = `
      <style>
        body {
          background: linear-gradient(to right, #ffecd2, #fcb69f);
          font-family: 'Poppins', sans-serif;
        }
        .container {
          max-width: 900px;
          margin: 40px auto;
          padding: 30px;
          background: #ffffffcc;
          backdrop-filter: blur(8px);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        h1 {
          text-align: center;
          color: #ff5722;
          margin-bottom: 30px;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .controls button {
          background: #ff5722;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 150px;
        }
        .controls button:hover {
          background: #e64a19;
          transform: translateY(-2px);
        }
        .question-card {
          border-left: 6px solid #00b894;
          background: #fafafa;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }
        .question-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .question-text {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 10px;
          color: #333;
        }
        .question-time {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
        }
        .correct-answer {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 12px;
          border-radius: 10px;
          margin: 8px 0;
          border-left: 4px solid #4caf50;
        }
        .no-answer {
          color: #c62828;
          font-weight: bold;
          margin-bottom: 15px;
          padding: 10px;
          background: #ffebee;
          border-radius: 8px;
        }
        .generate-answer-btn {
          background: #4CAF50;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          margin: 10px 5px 5px 0;
          transition: all 0.3s;
        }
        .generate-answer-btn:hover {
          background: #388e3c;
          transform: translateY(-2px);
        }
        .ai-answer {
          background: #e3f2fd;
          border-left: 6px solid #2196F3;
          padding: 15px;
          margin-top: 15px;
          border-radius: 8px;
          animation: fadeIn 0.5s;
        }
        .ai-answer.error {
          border-left-color: #f44336;
          background: #ffebee;
        }
        .provider-selector {
          margin: 15px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .provider-selector select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: white;
          font-size: 14px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .status {
          text-align: center;
          margin: 20px 0;
          font-style: italic;
          color: #666;
        }
      </style>
      <div class="container">
        <h1>🚀 Edpuzzle Answer Assistant</h1>
        <div class="status">Using your DeepInfra API key for best results</div>
        <div class="controls">
          <button id="skipBtn">⏭ Skip Video</button>
          <button id="answerBtn">🧠 Auto Answer</button>
        </div>
    `;

    assignmentData.questions?.forEach((question, index) => {
      const questionText = question.body?.[0]?.["html"]?.replace(/<[^>]*>/g, '') || "No question text";
      const questionTime = question.time ? "(at " + question.time.toFixed(2) + 's)' : '';
      const correctAnswers = question.choices?.filter(choice => choice.isCorrect) || [];

      htmlContent += `<div class="question-card" id="q${index}">
        <div class="question-text">Q${index + 1}: ${questionText}</div>
        <div class="question-time">${questionTime}</div>
      `;

      if (correctAnswers.length > 0) {
        correctAnswers.forEach(answer => {
          const answerText = answer.body?.[0]?.["html"]?.replace(/<[^>]*>/g, '') || "No answer text";
          htmlContent += `<div class="correct-answer">✔ ${answerText}</div>`;
        });
      } else {
        htmlContent += `<div class="no-answer">⚠ Open-Ended Question</div>
          <div class="provider-selector">
            <span>AI Provider:</span>
            <select id="provider${index}">
              <option value="deepinfra" selected>DeepInfra (Best)</option>
              <option value="huggingface">Hugging Face</option>
              <option value="pawan">Pawan</option>
              <option value="default">Fallback</option>
            </select>
          </div>
          <button class="generate-answer-btn" data-qid="${index}">Generate Answer</button>
          <div class="ai-display" id="ai${index}"></div>
        `;
      }
      htmlContent += "</div>";
    });

    htmlContent += "</div>";
    const answersWindow = window.open('', "_blank", 'width=900,height=900,scrollbars=yes,resizable=yes');
    answersWindow.document.write(htmlContent);
    answersWindow.document.title = "Edpuzzle Answers";

    answersWindow.document.getElementById('skipBtn').onclick = function () {
      const video = document.querySelector("video");
      if (video) {
        video.currentTime = video.duration;
      }
      const skipButton = document.querySelector(".skip-btn");
      if (skipButton) {
        skipButton.click();
      }
    };

    answersWindow.document.getElementById("answerBtn").onclick = function () {
      if (!assignmentData.questions) {
        return;
      }

      const answerQuestions = (index) => {
        if (index >= assignmentData.questions.length) {
          return;
        }
        
        const question = assignmentData.questions[index];
        const questionElement = document.querySelectorAll(".question-container")[index];
        
        if (!questionElement) {
          return setTimeout(() => answerQuestions(index + 1), 1000);
        }
        
        const correctChoices = question.choices?.filter(choice => choice.isCorrect) || [];
        const answerElements = questionElement.querySelectorAll(".answer-item");
        
        correctChoices.forEach(correctChoice => {
          const choiceIndex = question.choices.indexOf(correctChoice);
          if (answerElements[choiceIndex]) {
            answerElements[choiceIndex].click();
          }
        });
        
        const checkButton = questionElement.querySelector('.check-answer');
        if (checkButton) {
          checkButton.click();
          setTimeout(() => {
            const skipButton = questionElement.querySelector(".skip-btn") || document.querySelector('.skip-btn');
            if (skipButton) {
              skipButton.click();
            }
            setTimeout(() => answerQuestions(index + 1), 1000);
          }, 1000);
        } else {
          setTimeout(() => answerQuestions(index + 1), 1000);
        }
      };
      
      answerQuestions(0);
    };

    answersWindow.document.querySelectorAll('.generate-answer-btn').forEach(button => {
      button.onclick = function () {
        const questionId = button.getAttribute("data-qid");
        const questionText = assignmentData.questions[questionId].body?.[0]?.["html"]?.replace(/<[^>]*>/g, '') || '';
        const answerElement = answersWindow.document.getElementById('ai' + questionId);
        const providerSelect = answersWindow.document.getElementById("provider" + questionId);
        const selectedProvider = providerSelect ? providerSelect.value : "deepinfra";
        generateAnswer(questionText, answerElement, selectedProvider);
      };
    });

    answersWindow.document.close();
  }

  async function main() {
    const assignmentId = getAssignmentId();
    if (!assignmentId) {
      return;
    }

    try {
      const assignment = await fetchAssignment(assignmentId);
      const mediaId = assignment?.['teacherAssignments']?.[0]?.["contentId"];
      
      if (!mediaId) {
        throw new Error("Could not get media ID");
      }
      
      const mediaData = await fetchMedia(mediaId, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODE2YzgwMmY4MTg1M2M5NDA2Y2RkZWUiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NjMyMzQ1OCwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzOTU4MjgsImV4cCI6MTc0NzAwMDYyOCwianRpIjoiNjgxN2UyYjRkNmMzZTFiNDhmMWQ4Zjc4In0.8YCPPaJz8H1IQAsJplH17Ny4Sae1JtzmbRBLNQgsDJ0");
      
      if (!mediaData) {
        throw new Error("Failed to fetch questions");
      }
      
      showAnswersUI(mediaData);
    } catch (error) {
      alert("Error: " + error.message + "\n\nCheck:\n- Assignment ID\n- Token validity\n- Edpuzzle page context");
    }
  }

  main();
})();
