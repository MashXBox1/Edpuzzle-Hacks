javascript:(function(){
  // Get assignment ID from URL or prompt
  const pathMatch = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/);
  const assignmentId = pathMatch ? pathMatch[1] : prompt('Enter Edpuzzle Assignment ID:');
  if (!assignmentId) return;

  // Create new window
  const popupWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  popupWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Edpuzzle Answer Generator</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .media-link {
            word-break: break-all;
            color: #0078d7;
            margin-bottom: 15px;
          }
          #jsonInput {
            width: 100%;
            height: 200px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            margin-bottom: 15px;
          }
          #processBtn {
            width: 100%;
            padding: 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 15px;
          }
          #status {
            color: #666;
            margin-bottom: 15px;
          }
          .question-card {
            border-left: 4px solid #0078d7;
            background: #f9f9f9;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .question-text {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .correct-answer {
            background: #e8f5e9;
            padding: 8px;
            border-radius: 4px;
            margin: 5px 0;
          }
          .no-answer {
            color: #d32f2f;
            font-style: italic;
          }
          .generate-btn {
            background: #4caf50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px 0;
          }
          .ai-answer {
            background: #e3f2fd;
            padding: 8px;
            border-radius: 4px;
            margin: 5px 0;
            border-left: 3px solid #2196f3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Edpuzzle Answer Generator</h2>
          <button onclick="window.close()">×</button>
        </div>
        <div id="loading">Fetching assignment data...</div>
        <div id="content" style="display: none;">
          <a id="mediaLink" class="media-link" target="_blank"></a>
          <div>Paste JSON Data:</div>
          <textarea id="jsonInput" placeholder="Paste the full JSON data here..."></textarea>
          <button id="processBtn">Generate Answers</button>
          <div id="status"></div>
          <div id="results"></div>
        </div>
      </body>
    </html>
  `);

  // First fetch assignment data to get media ID
  fetch(`https://edpuzzle.com/api/v3/assignments/${assignmentId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to fetch assignment');
    return response.json();
  })
  .then(assignmentData => {
    const mediaId = assignmentData?.teacherAssignments?.[0]?.contentId;
    if (!mediaId) throw new Error('No media ID found in assignment');

    // Show input form with media link
    popupWindow.document.getElementById('loading').style.display = 'none';
    popupWindow.document.getElementById('content').style.display = 'block';
    const mediaLink = popupWindow.document.getElementById('mediaLink');
    mediaLink.href = `https://edpuzzle.com/api/v3/media/${mediaId}`;
    mediaLink.textContent = `Media API: https://edpuzzle.com/api/v3/media/${mediaId}`;

    // Process button click handler
    popupWindow.document.getElementById('processBtn').onclick = function() {
      try {
        const jsonData = popupWindow.document.getElementById('jsonInput').value.trim();
        if (!jsonData) throw new Error('Please paste the JSON data');

        const mediaData = JSON.parse(jsonData);
        if (!mediaData.questions) throw new Error('Invalid JSON - missing questions');

        // Hide input, show results
        popupWindow.document.getElementById('jsonInput').style.display = 'none';
        popupWindow.document.getElementById('processBtn').style.display = 'none';
        popupWindow.document.getElementById('status').style.display = 'none';
        
        const resultsDiv = popupWindow.document.getElementById('results');
        processQuestions(mediaData, resultsDiv, popupWindow);
      } catch (error) {
        popupWindow.document.getElementById('status').textContent = `Error: ${error.message}`;
      }
    };
  })
  .catch(error => {
    popupWindow.document.getElementById('loading').innerHTML = `
      <div style="color: #d32f2f;">Error: ${error.message}</div>
      <button onclick="window.close()" style="padding: 8px 15px; margin-top: 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">
        Close
      </button>
    `;
  });

  // Question processing function
  function processQuestions(mediaData, container, win) {
    // Process each question
    mediaData.questions.forEach((question, index) => {
      const questionCard = win.document.createElement('div');
      questionCard.className = 'question-card';

      const questionText = question.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
      const questionTime = question.time ? `(at ${question.time.toFixed(2)}s)` : '';

      questionCard.innerHTML = `
        <div class="question-text">Q${index + 1}: ${questionText} ${questionTime}</div>
      `;

      const correctAnswers = question.choices?.filter(choice => choice.isCorrect) || [];
      if (correctAnswers.length > 0) {
        correctAnswers.forEach(answer => {
          const answerText = answer.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No answer text';
          questionCard.innerHTML += `
            <div class="correct-answer">✔ ${answerText}</div>
          `;
        });
      } else {
        questionCard.innerHTML += `
          <div class="no-answer">Open-ended question</div>
          <button class="generate-btn" data-question="${encodeURIComponent(questionText)}">Generate AI Answer</button>
          <div class="ai-answer" id="ai-${index}"></div>
        `;
      }

      container.appendChild(questionCard);
    });

    // Add AI answer generation
    container.querySelectorAll('.generate-btn').forEach(btn => {
      btn.onclick = async function() {
        const questionText = decodeURIComponent(this.getAttribute('data-question'));
        const answerContainer = this.nextElementSibling;
        answerContainer.innerHTML = 'Generating answer...';

        try {
          // Using DeepInfra API
          const response = await fetch("https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1", {
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
          
          const data = await response.json();
          const answer = data.results?.[0]?.generated_text || "No answer generated";
          answerContainer.innerHTML = `<strong>AI Answer:</strong> ${answer.replace(/Answer this Edpuzzle question.*?:/, '').trim()}`;
        } catch (error) {
          answerContainer.innerHTML = `<strong>Error:</strong> ${error.message}`;
        }
      };
    });
  }
})();
