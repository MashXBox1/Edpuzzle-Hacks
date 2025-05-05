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
          .ai-answer {
            background: #e3f2fd;
            padding: 8px;
            border-radius: 4px;
            margin: 5px 0;
            border-left: 3px solid #2196f3;
          }
          .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
          }
          .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
    popupWindow.document.getElementById('processBtn').onclick = async function() {
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
        await processQuestions(mediaData, resultsDiv, popupWindow);
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
  async function processQuestions(mediaData, container, win) {
    // Sort questions by timestamp (earliest first)
    const sortedQuestions = [...mediaData.questions].sort((a, b) => {
      const timeA = a.time || 0;
      const timeB = b.time || 0;
      return timeA - timeB;
    });

    // Process each question in sorted order
    for (const [index, question] of sortedQuestions.entries()) {
      const questionCard = win.document.createElement('div');
      questionCard.className = 'question-card';

      const questionText = question.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
      const questionTime = question.time ? formatTime(question.time) : '';

      questionCard.innerHTML = `
        <div class="timestamp">Timestamp: ${questionTime}</div>
        <div class="question-text">Q${index + 1}: ${questionText}</div>
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
        // Add loading indicator for AI answer
        questionCard.innerHTML += `
          <div class="no-answer">Open-ended question</div>
          <div class="ai-answer" id="ai-${index}">
            <div class="loading-spinner"></div> Generating answer...
          </div>
        `;
      }

      container.appendChild(questionCard);

      // Automatically generate AI answer for open-ended questions
      if (correctAnswers.length === 0) {
        await generateAIAnswer(questionText, win.document.getElementById(`ai-${index}`));
      }
    }
  }

  // AI answer generation function
  async function generateAIAnswer(questionText, answerContainer) {
    try {
      // Detect if question is in Spanish
      const isSpanish = /[ÁÉÍÓÚáéíóúñÑ]/.test(questionText);
      const prompt = isSpanish 
        ? `Responde esta pregunta de Edpuzzle en español: ${questionText}`
        : `Answer this Edpuzzle question for me: ${questionText}`;

      // Using DeepInfra API
      const response = await fetch("https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: "Bearer x8i4xUCxtNs4EZMMiO2ifmyxnxZD8WYl"
        },
        body: JSON.stringify({
          input: prompt,
          max_new_tokens: 200,
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      const answer = data.results?.[0]?.generated_text || "No answer generated";
      
      // Clean up the response
      let cleanAnswer = answer;
      if (isSpanish) {
        cleanAnswer = answer.replace(/Responde esta pregunta de Edpuzzle en español:.*?/, '').trim();
      } else {
        cleanAnswer = answer.replace(/Answer this Edpuzzle question for me:.*?/, '').trim();
      }
      
      answerContainer.innerHTML = `<strong>${isSpanish ? 'Respuesta IA:' : 'AI Answer:'}</strong> ${cleanAnswer}`;
    } catch (error) {
      answerContainer.innerHTML = `<strong>Error:</strong> ${error.message}`;
    }
  }

  // Helper function to format time (seconds to MM:SS format)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
})();
