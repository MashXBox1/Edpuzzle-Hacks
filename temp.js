javascript:(function(){
  // Get assignment ID from URL or prompt
  const pathMatch = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/);
  const assignmentId = pathMatch ? pathMatch[1] : prompt('Enter Edpuzzle Assignment ID:');
  if (!assignmentId) return;

  // Create new window
  const popupWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  
  // Write the popup content with new UI
  popupWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Edpuzzle Answer Generator</title>
        <style>
          :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --background: #0f172a;
            --card-bg: #1e293b;
            --text: #f8fafc;
            --text-secondary: #94a3b8;
            --correct: #10b981;
            --ai-bubble: #334155;
            --user-bubble: #1e40af;
            --border-radius: 12px;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          
          body {
            background: var(--background);
            color: var(--text);
            height: 100vh;
            overflow: hidden;
            margin: 0;
          }
          
          #particles-js {
            position: fixed;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: var(--background);
          }
          
          .app-container {
            display: flex;
            height: 100vh;
          }
          
          .answers-section {
            width: 70%;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .control-section {
            width: 30%;
            background: rgba(30, 41, 59, 0.8);
            padding: 20px;
            border-left: 1px solid #334155;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .header {
            padding: 15px 0;
            margin-bottom: 20px;
            border-bottom: 1px solid #334155;
          }
          
          .header h2 {
            color: var(--primary);
            font-size: 1.5rem;
          }
          
          .media-info {
            background: var(--card-bg);
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
          }
          
          .media-link {
            word-break: break-all;
            color: var(--primary);
            text-decoration: none;
            font-size: 14px;
            display: block;
            margin-top: 5px;
          }
          
          .media-link:hover {
            text-decoration: underline;
          }
          
          .json-container {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
          }
          
          #jsonInput {
            width: 100%;
            flex-grow: 1;
            padding: 15px;
            border: 1px solid #334155;
            border-radius: var(--border-radius);
            background: rgba(15, 23, 42, 0.5);
            color: var(--text);
            resize: none;
            font-family: 'Fira Code', monospace;
            font-size: 13px;
            margin-bottom: 15px;
          }
          
          #jsonInput:focus {
            outline: none;
            border-color: var(--primary);
          }
          
          .btn {
            padding: 12px;
            border: none;
            border-radius: var(--border-radius);
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 10px;
          }
          
          #processBtn {
            background: var(--primary);
            color: white;
          }
          
          #processBtn:hover {
            background: var(--primary-dark);
          }
          
          #submitBtn {
            background: #10b981;
            color: white;
            display: none;
          }
          
          #submitBtn:hover {
            background: #059669;
          }
          
          #status {
            color: var(--text-secondary);
            font-size: 14px;
            text-align: center;
            min-height: 20px;
            margin-top: 10px;
          }
          
          .question-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: var(--border-radius);
            margin-bottom: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .question-text {
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--text);
            font-size: 1.1rem;
          }
          
          .answer-bubble {
            background: rgba(16, 185, 129, 0.2);
            padding: 12px 16px;
            border-radius: 18px;
            margin: 8px 0;
            border-left: 4px solid var(--correct);
            max-width: 80%;
            word-wrap: break-word;
          }
          
          .no-answer {
            color: #f87171;
            font-style: italic;
            margin: 8px 0;
          }
          
          .timestamp {
            color: var(--text-secondary);
            font-size: 0.85em;
            margin-bottom: 8px;
          }
          
          .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
          }
          
          .chat-container {
            margin-top: 15px;
            border-top: 1px solid #334155;
            padding-top: 15px;
          }
          
          .chat-messages {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 10px;
          }
          
          .ai-message {
            background: var(--ai-bubble);
            padding: 10px 15px;
            border-radius: 18px;
            align-self: flex-start;
            max-width: 80%;
          }
          
          .user-message {
            background: var(--user-bubble);
            padding: 10px 15px;
            border-radius: 18px;
            align-self: flex-end;
            color: white;
            max-width: 80%;
          }
          
          .chat-input-container {
            display: flex;
            gap: 10px;
          }
          
          .chat-input {
            flex-grow: 1;
            padding: 10px 15px;
            border-radius: 18px;
            border: 1px solid #334155;
            background: rgba(15, 23, 42, 0.5);
            color: var(--text);
          }
          
          .chat-send {
            padding: 10px 15px;
            border-radius: 18px;
            background: var(--primary);
            color: white;
            border: none;
            cursor: pointer;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1e293b;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        </style>
      </head>
      <body>
        <div id="particles-js"></div>
        <div class="app-container">
          <div class="answers-section" id="results"></div>
          
          <div class="control-section">
            <div class="header">
              <h2>Edpuzzle Answer Generator</h2>
            </div>
            
            <div class="media-info">
              <div>Media API Link:</div>
              <a id="mediaLink" class="media-link" target="_blank">Loading media link...</a>
            </div>
            
            <div class="json-container">
              <div>Paste JSON Data:</div>
              <textarea id="jsonInput" placeholder="Paste the full JSON data here..."></textarea>
              
              <button id="processBtn" class="btn">Generate Answers</button>
              <button id="submitBtn" class="btn">Submit Answers to Edpuzzle</button>
              
              <div id="status">Ready</div>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
        <script>
          // Initialize particles.js
          document.addEventListener('DOMContentLoaded', function() {
            if (typeof particlesJS === 'function') {
              particlesJS("particles-js", {
                "particles": {
                  "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                  "color": { "value": "#3b82f6" },
                  "shape": { "type": "circle" },
                  "opacity": { "value": 0.3, "random": true, "anim": { "enable": true, "speed": 1 } },
                  "size": { "value": 3, "random": true, "anim": { "enable": true, "speed": 2 } },
                  "line_linked": { "enable": true, "distance": 150, "color": "#3b82f6", "opacity": 0.2, "width": 1 },
                  "move": { "enable": true, "speed": 1, "direction": "none", "random": true }
                },
                "interactivity": {
                  "detect_on": "canvas",
                  "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                  }
                }
              });
            }

            // Fetch media link immediately when popup loads
            async function fetchMediaLink() {
              try {
                const pathMatch = window.location.pathname.match(/\\/assignments\\/([a-f0-9]+)/);
                const assignmentId = pathMatch ? pathMatch[1] : null;
                if (!assignmentId) throw new Error('No assignment ID found');
                
                const response = await fetch(
                  'https://edpuzzle.com/api/v3/assignments/' + assignmentId, 
                  { credentials: 'include' }
                );
                
                if (!response.ok) throw new Error('Failed to fetch assignment');
                const data = await response.json();
                
                const mediaId = data?.teacherAssignments?.[0]?.contentId;
                if (!mediaId) throw new Error('No media ID found');
                
                const mediaLink = document.getElementById('mediaLink');
                if (mediaLink) {
                  mediaLink.href = 'https://edpuzzle.com/api/v3/media/' + mediaId;
                  mediaLink.textContent = 'https://edpuzzle.com/api/v3/media/' + mediaId;
                }
                
                return mediaId;
              } catch (error) {
                const mediaLink = document.getElementById('mediaLink');
                if (mediaLink) {
                  mediaLink.textContent = 'Error: ' + error.message;
                }
                console.error('Error fetching media link:', error);
                return null;
              }
            }

            // Call it immediately
            fetchMediaLink();

            /* ALL ORIGINAL FUNCTIONALITY REMAINS THE SAME */
            /* Only UI has been changed - functions below are unchanged */
            
            // Auto Answers functionality
            class AutoAnswers {
              static async submitAnswers(questions) {
                const status = document.getElementById('status');
                const submitBtn = document.getElementById('submitBtn');
                
                submitBtn.disabled = true;
                status.textContent = "Starting answer submission...";
                
                try {
                  status.textContent = "Getting attempt data...";
                  const attempt = await this.getAttempt();
                  
                  status.textContent = "Skipping video...";
                  await this.skipVideo(attempt);
                  
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

            // Enhanced AI Chat functionality with follow-up
            class AIChat {
              constructor(container, questionText) {
                this.container = container;
                this.questionText = questionText;
                this.chatHistory = [];
                this.setupChatUI();
              }
              
              setupChatUI() {
                const chatContainer = document.createElement('div');
                chatContainer.className = 'chat-container';
                
                const chatMessages = document.createElement('div');
                chatMessages.className = 'chat-messages';
                
                const inputContainer = document.createElement('div');
                inputContainer.className = 'chat-input-container';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'chat-input';
                input.placeholder = 'Ask a follow-up question...';
                
                const sendBtn = document.createElement('button');
                sendBtn.className = 'chat-send';
                sendBtn.textContent = 'Send';
                
                sendBtn.addEventListener('click', () => this.sendMessage(input.value));
                input.addEventListener('keypress', (e) => {
                  if (e.key === 'Enter') this.sendMessage(input.value);
                });
                
                inputContainer.appendChild(input);
                inputContainer.appendChild(sendBtn);
                
                chatContainer.appendChild(chatMessages);
                chatContainer.appendChild(inputContainer);
                
                this.container.appendChild(chatContainer);
                this.chatElement = chatMessages;
                this.inputElement = input;
                
                // Add initial AI message
                this.addMessage('AI', 'I can help explain this question further. What would you like to know?');
              }
              
              addMessage(sender, message) {
                const messageDiv = document.createElement('div');
                messageDiv.className = sender === 'AI' ? 'ai-message' : 'user-message';
                messageDiv.textContent = message;
                this.chatElement.appendChild(messageDiv);
                this.chatElement.scrollTop = this.chatElement.scrollHeight;
              }
              
              async sendMessage(message) {
                if (!message.trim()) return;
                
                this.addMessage('You', message);
                this.inputElement.value = '';
                this.inputElement.disabled = true;
                
                const loadingMsg = document.createElement('div');
                loadingMsg.className = 'ai-message';
                loadingMsg.innerHTML = '<div class="loading-spinner"></div> Thinking...';
                this.chatElement.appendChild(loadingMsg);
                this.chatElement.scrollTop = this.chatElement.scrollHeight;
                
                try {
                  const response = await this.getAIResponse(message);
                  this.chatElement.removeChild(loadingMsg);
                  this.addMessage('AI', response);
                } catch (error) {
                  this.chatElement.removeChild(loadingMsg);
                  this.addMessage('AI', \`Sorry, I encountered an error: \${error.message}\`);
                }
                
                this.inputElement.disabled = false;
                this.inputElement.focus();
              }
              
              async getAIResponse(message) {
                const isSpanish = /[ÁÉÍÓÚáéíóúñÑ]/.test(message);
                const prompt = isSpanish 
                  ? \`Pregunta original: "\${this.questionText}". Pregunta de seguimiento: "\${message}". Responde en español.\`
                  : \`Original question: "\${this.questionText}". Follow-up: "\${message}". Answer in the same language as the follow-up.\`;
                
                const response = await fetch("https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1", {
                  method: "POST",
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: "Bearer x8i4xUCxtNs4EZMMiO2ifmyxnxZD8WYl"
                  },
                  body: JSON.stringify({
                    input: prompt,
                    max_new_tokens: 300,
                    temperature: 0.7
                  })
                });
                
                const data = await response.json();
                return data.results?.[0]?.generated_text || "I couldn't generate a response. Please try again.";
              }
            }

            // Question processing function
            async function processQuestions(mediaData) {
              const resultsDiv = document.getElementById('results');
              resultsDiv.innerHTML = '';
              
              // Sort questions by timestamp (earliest first)
              const sortedQuestions = [...mediaData.questions].sort((a, b) => {
                const timeA = a.time || 0;
                const timeB = b.time || 0;
                return timeA - timeB;
              });
              
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
                    const answerBubble = document.createElement('div');
                    answerBubble.className = 'answer-bubble';
                    answerBubble.textContent = answerText;
                    questionCard.appendChild(answerBubble);
                  });
                } else {
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
                  // Add chat interface for follow-up questions
                  new AIChat(questionCard, questionText);
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
                    max_new_tokens: 250,
                    temperature: 0.7
                  })
                });
                
                const data = await response.json();
                let answer = data.results?.[0]?.generated_text || "No answer generated";
                
                // Clean up the response
                if (isSpanish) {
                  answer = answer.replace(/Responde esta pregunta de Edpuzzle en español:.*?/, '').trim();
                } else {
                  answer = answer.replace(/Answer this Edpuzzle question for me:.*?/, '').trim();
                }
                
                answerContainer.innerHTML = \`<div class="answer-bubble"><strong>\${isSpanish ? 'Respuesta IA:' : 'AI Answer:'}</strong> \${answer}</div>\`;
              } catch (error) {
                answerContainer.innerHTML = \`<div class="answer-bubble" style="border-left-color: #f87171;"><strong>Error:</strong> \${error.message}</div>\`;
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
              const processBtn = document.getElementById('processBtn');
              const status = document.getElementById('status');
              
              try {
                const jsonData = document.getElementById('jsonInput').value.trim();
                if (!jsonData) throw new Error('Please paste the JSON data');

                processBtn.disabled = true;
                status.textContent = "Processing questions...";

                const mediaData = JSON.parse(jsonData);
                if (!mediaData.questions) throw new Error('Invalid JSON - missing questions');

                await processQuestions(mediaData);

                // Show submit button after processing
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.style.display = 'block';
                submitBtn.onclick = function() {
                  AutoAnswers.submitAnswers(mediaData.questions);
                };
                
                status.textContent = "Done processing!";
              } catch (error) {
                status.textContent = \`Error: \${error.message}\`;
                processBtn.disabled = false;
              }
            };
          });
        </script>
      </body>
    </html>
  `);

  // Close the document writing
  popupWindow.document.close();
})();
