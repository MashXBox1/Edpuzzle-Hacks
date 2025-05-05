javascript:(function(){
  // Create main popup container
  const popup = document.createElement('div');
  popup.style = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    background: white;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    padding: 20px;
    z-index: 999999;
    overflow-y: auto;
    font-family: Arial, sans-serif;
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => document.body.removeChild(popup);
  popup.appendChild(closeBtn);

  // Get assignment ID from URL or prompt
  const pathMatch = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/);
  const assignmentId = pathMatch ? pathMatch[1] : prompt('Enter Edpuzzle Assignment ID:');
  if (!assignmentId) return;

  // Show loading state
  popup.innerHTML = `
    <h2 style="color: #0078d7; margin-top: 0;">Edpuzzle Answer Generator</h2>
    <div style="margin: 15px 0; color: #666;">Fetching assignment data...</div>
  `;
  document.body.appendChild(popup);

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
    popup.innerHTML = `
      <h2 style="color: #0078d7; margin-top: 0;">Edpuzzle Answer Generator</h2>
      <div style="margin-bottom: 15px;">
        <a href="https://edpuzzle.com/api/v3/media/${mediaId}" target="_blank" style="word-break: break-all; color: #0078d7;">
          Media API: https://edpuzzle.com/api/v3/media/${mediaId}
        </a>
      </div>
      <div style="margin-bottom: 10px; font-weight: bold;">Paste JSON Data:</div>
      <textarea id="jsonInput" style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; margin-bottom: 15px;"></textarea>
      <button id="processBtn" style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
        Generate Answers
      </button>
      <div id="status" style="margin: 10px 0; color: #666;"></div>
      <div id="results" style="display: none;"></div>
    `;

    // Process button click handler
    document.getElementById('processBtn').onclick = function() {
      try {
        const jsonData = document.getElementById('jsonInput').value.trim();
        if (!jsonData) throw new Error('Please paste the JSON data');

        const mediaData = JSON.parse(jsonData);
        if (!mediaData.questions) throw new Error('Invalid JSON - missing questions');

        // Hide input, show results
        document.getElementById('jsonInput').style.display = 'none';
        document.getElementById('processBtn').style.display = 'none';
        document.getElementById('status').style.display = 'none';
        
        const resultsDiv = document.getElementById('results');
        resultsDiv.style.display = 'block';
        processQuestions(mediaData, resultsDiv);
      } catch (error) {
        document.getElementById('status').textContent = `Error: ${error.message}`;
      }
    };
  })
  .catch(error => {
    popup.innerHTML = `
      <h2 style="color: #0078d7; margin-top: 0;">Edpuzzle Answer Generator</h2>
      <div style="color: #d32f2f; margin: 15px 0;">Error: ${error.message}</div>
      <button onclick="document.body.removeChild(this.parentNode)" style="padding: 8px 15px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">
        Close
      </button>
    `;
  });

  // Your original question processing logic (modified for same-popup display)
  function processQuestions(mediaData, container) {
    // Add CSS
    const css = `
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
    `;
    const styleElem = document.createElement('style');
    styleElem.textContent = css;
    container.appendChild(styleElem);

    // Process each question
    mediaData.questions.forEach((question, index) => {
      const questionCard = document.createElement('div');
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

    // Add AI answer generation (using your original token)
    container.querySelectorAll('.generate-btn').forEach(btn => {
      btn.onclick = async function() {
        const questionText = decodeURIComponent(this.getAttribute('data-question'));
        const answerContainer = this.nextElementSibling;
        answerContainer.innerHTML = 'Generating answer...';

        try {
          // Using your original DeepInfra token
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
