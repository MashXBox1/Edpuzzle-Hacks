javascript:(function(){
  // Get assignment ID from URL or prompt
  const pathMatch = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/);
  const assignmentId = pathMatch ? pathMatch[1] : prompt('Enter Edpuzzle Assignment ID:');
  if (!assignmentId) return;

  // Create new window
  const popupWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  
  // Write the popup content
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
          #submitBtn {
            width: 100%;
            padding: 12px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 15px;
            display: none;
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
          <button id="submitBtn">Submit Answers to Edpuzzle</button>
          <div id="status"></div>
          <div id="results"></div>
        </div>
        <script>
          // Auto Answers functionality
          class AutoAnswers {
            static async submitAnswers(questions) {
              const status = document.getElementById('status');
              const submitBtn = document.getElementById('submitBtn');
              
              submitBtn.disabled = true;
              status.textContent = "Starting answer submission...";
              
              try {
                // Get attempt data
                status.textContent = "Getting attempt data...";
                const attempt = await this.getAttempt();
                
                // Skip video
                status.textContent = "Skipping video...";
                await this.skipVideo(attempt);
                
                // Filter and submit answers
                const filteredQuestions = this.filterQuestions(questions);
                status.textContent = \`Submitting \${filteredQuestions.length} answers...\`;
                
                await this.postAnswers(attempt, filteredQuestions, (progress) => {
                  status.textContent = \`Submitting answers (\${progress+1}/\${filteredQuestions.length})...\`;
                });
                
                status.textContent = "Answers submitted successfully!";
                setTimeout(() => window.opener.location.reload(), 1500);
              } catch (error) {
                status.textContent = \`Error: \${error.message}\`;
                submitBtn.disabled = false;
              }
            }
            
            static async getAttempt() {
              const pathMatch = window.location.pathname.match(/\\/assignments\\/([a-f0-9]+)/);
              const assignmentId = pathMatch[1];
              const response = await fetch(\`https://edpuzzle.com/api/v3/assignments/\${assignmentId}/attempt\`, {
                credentials: 'include'
              });
              return await response.json();
            }
            
            static async skipVideo(attempt) {
              const attemptId = attempt._id;
              const url = \`https://edpuzzle.com/api/v4/media_attempts/\${attemptId}/watch\`;
              await fetch(url, {
                method: "POST",
                headers: await this.getHeaders(),
                body: JSON.stringify({"timeIntervalNumber": 10})
              });
            }
            
            static filterQuestions(questions) {
              let filtered = [];
              for (let i=0; i<questions.length; i++) {
                let q = questions[i];
                if (q.type != "multiple-choice") continue;
                
                if (filtered.length == 0) filtered.push([q]);
                else if (filtered[filtered.length-1][0].time == q.time) filtered[filtered.length-1].push(q);
                else filtered.push([q]);
              }
              return filtered;
            }
            
            static async postAnswers(attempt, questionGroups, progressCallback) {
              const attemptId = attempt._id;
              for (let i=0; i<questionGroups.length; i++) {
                await this.postAnswerGroup(attemptId, questionGroups[i]);
                if (progressCallback) progressCallback(i);
              }
            }
            
            static async postAnswerGroup(attemptId, questions) {
              const url = \`https://edpuzzle.com/api/v3/attempts/\${attemptId}/answers\`;
              const answers = questions.map(q => ({
                questionId: q._id,
                choices: q.choices.filter(c => c.isCorrect).map(c => c._id),
                type: "multiple-choice"
              }));
              
              await fetch(url, {
                method: "POST",
                headers: await this.getHeaders(),
                body: JSON.stringify({answers})
              });
            }
            
            static async getHeaders() {
              const csrf = await fetch("https://edpuzzle.com/api/v3/csrf", {credentials: 'include'})
                .then(r => r.json());
              return {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'x-csrf-token': csrf.CSRFToken,
                'x-edpuzzle-referrer': window.location.href
              };
            }
          }

          // Question processing function
          async function processQuestions(mediaData) {
            // Sort questions by timestamp (earliest first)
            const sortedQuestions = [...mediaData.questions].sort((a, b) => {
              const timeA = a.time || 0;
              const timeB = b.time || 0;
              return timeA - timeB;
            });

            const resultsDiv = document.getElementById('results');
            
            // Process each question in sorted order
            for (const [index, question] of sortedQuestions.entries()) {
              const questionCard = document.createElement('div');
              questionCard.className = 'question-card';

              const questionText = question.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
              const questionTime = question.time ? formatTime(question.time) : '';

              questionCard.innerHTML = \`
                <div class="timestamp">Timestamp: \${questionTime}</div>
                <div class="question-text">Q\${index + 1}: \${questionText}</div>
              \`;

              const correctAnswers = question.choices?.filter(choice => choice.isCorrect) || [];
              if (correctAnswers.length > 0) {
                correctAnswers.forEach(answer => {
                  const answerText = answer.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No answer text';
                  questionCard.innerHTML += \`
                    <div class="correct-answer">✔ \${answerText}</div>
                  \`;
                });
              } else {
                // Add loading indicator for AI answer
                questionCard.innerHTML += \`
                  <div class="no-answer">Open-ended question</div>
                  <div class="ai-answer" id="ai-\${index}">
                    <div class="loading-spinner"></div> Generating answer...
                  </div>
                \`;
              }

              resultsDiv.appendChild(questionCard);

              // Automatically generate AI answer for open-ended questions
              if (correctAnswers.length === 0) {
                await generateAIAnswer(questionText, document.getElementById(\`ai-\${index}\`));
              }
            }
          }

          // AI answer generation function
          async function generateAIAnswer(questionText, answerContainer) {
            try {
              // Detect if question is in Spanish
              const isSpanish = /[ÁÉÍÓÚáéíóúñÑ]/.test(questionText);
              const prompt = isSpanish 
                ? \`Responde esta pregunta de Edpuzzle en español: \${questionText}\`
                : \`Answer this Edpuzzle question for me: \${questionText}\`;

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
              
              answerContainer.innerHTML = \`<strong>\${isSpanish ? 'Respuesta IA:' : 'AI Answer:'}</strong> \${cleanAnswer}\`;
            } catch (error) {
              answerContainer.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
            }
          }

          // Helper function to format time (seconds to MM:SS format)
          function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
          }

          // Process button click handler
          document.getElementById('processBtn').onclick = async function() {
            try {
              const jsonData = document.getElementById('jsonInput').value.trim();
              if (!jsonData) throw new Error('Please paste the JSON data');

              const mediaData = JSON.parse(jsonData);
              if (!mediaData.questions) throw new Error('Invalid JSON - missing questions');

              // Hide input, show results
              document.getElementById('jsonInput').style.display = 'none';
              document.getElementById('processBtn').style.display = 'none';
              document.getElementById('status').style.display = 'none';
              
              await processQuestions(mediaData);

              // Show submit button after processing
              const submitBtn = document.getElementById('submitBtn');
              submitBtn.style.display = 'block';
              submitBtn.onclick = function() {
                AutoAnswers.submitAnswers(mediaData.questions);
              };
            } catch (error) {
              document.getElementById('status').textContent = \`Error: \${error.message}\`;
            }
          };
        </script>
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
  })
  .catch(error => {
    popupWindow.document.getElementById('loading').innerHTML = `
      <div style="color: #d32f2f;">Error: ${error.message}</div>
      <button onclick="window.close()" style="padding: 8px 15px; margin-top: 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">
        Close
      </button>
    `;
  });
})();
