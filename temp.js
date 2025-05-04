(async function () {
  function getAssignmentId() {
    let assignment_id = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/)?.[1];
    if (!assignment_id) {
      assignment_id = prompt('Enter Edpuzzle assignment ID:');
      if (!assignment_id) return null;
    }
    return assignment_id;
  }

  function getCredentials() {
    return {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZkNzRmNGM4NTFhOTc5YzVhYmM1ZWEiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NDY2Mzc5NiwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzNzk4NDgsImV4cCI6MTc0Njk4NDY0OCwianRpIjoiNjgxN2E0NDg1ZWVmYWNhYTRjZWQ2MjcxIn0.Bj4D1q9VHbkBGV4e9S3inaaT-D8ipSPtwt_Clv0btc0"
    };
  }

  async function fetchAssignmentDetails(assignment_id) {
    try {
      const response = await fetch(`https://edpuzzle.com/api/v3/assignments/${assignment_id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to fetch assignment (Status: ${response.status})`);
      return await response.json();
    } catch (error) {
      console.error('Assignment fetch error:', error);
      return null;
    }
  }

  async function fetchMediaData(media_id, token) {
    try {
      const response = await fetch(`https://edpuzzle.com/api/v3/media/${media_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'omit'
      });
      if (!response.ok) throw new Error(`Failed to fetch media (Status: ${response.status})`);
      return await response.json();
    } catch (error) {
      console.error('Media fetch error:', error);
      return null;
    }
  }

  async function generateAIAnswer(questionText, displayEl, provider = 'deepinfra') {
    try {
      displayEl.innerHTML = `<em>Generating answer with ${provider}...</em>`;
      
      let response;
      switch (provider) {
        case 'deepinfra':
          // Using your DeepInfra API key
          response = await fetch('https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer x8i4xUCxtNs4EZMMiO2ifmyxnxZD8WYl'
            },
            body: JSON.stringify({
              input: `Answer this Edpuzzle question concisely and accurately: ${questionText}`,
              max_new_tokens: 200,
              temperature: 0.7
            })
          });
          if (response.status === 429) throw new Error('DeepInfra rate limit - try again later');
          if (response.status === 403) throw new Error('Invalid API key - check your DeepInfra key');
          break;
          
        case 'huggingface':
          response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
            method: 'POST',
            headers: { 
              'Authorization': 'Bearer YOUR_HF_TOKEN_HERE',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: `Answer this Edpuzzle question: ${questionText}`,
              parameters: { max_new_tokens: 150 }
            })
          });
          break;
          
        case 'pawan':
          response = await fetch('https://api.pawan.krd/v1/chat/completions', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer pk-this-is-a-free-free-key-6445d31b64a9407d8093c563a8ac9125'
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: `Answer this Edpuzzle question: ${questionText}` }],
              max_tokens: 150
            })
          });
          break;
          
        default:
          response = await fetch('https://chatgpt-api.shn.hk/v1/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: `Answer this: ${questionText}` }]
            })
          });
      }
      
      const data = await response.json();
      let aiAnswer;
      
      if (provider === 'deepinfra') {
        aiAnswer = data.results?.[0]?.generated_text || 'No answer generated';
      } else if (provider === 'huggingface') {
        aiAnswer = data[0]?.generated_text || 'No answer generated';
      } else {
        aiAnswer = data.choices?.[0]?.message?.content || 'No answer generated';
      }
      
      aiAnswer = aiAnswer.replace(/Answer this Edpuzzle question.*?:/, '').trim();
      displayEl.innerHTML = `<div class="ai-answer">🤖 <strong>${provider}</strong>: ${aiAnswer}</div>`;
    } catch (e) {
      console.error(`Error with ${provider}:`, e);
      const providers = ['deepinfra', 'huggingface', 'pawan', 'default'];
      const nextProvider = providers[providers.indexOf(provider) + 1];
      if (nextProvider) {
        displayEl.innerHTML = `<em>${e.message}. Retrying with ${nextProvider}...</em>`;
        setTimeout(() => generateAIAnswer(questionText, displayEl, nextProvider), 1500);
      } else {
        displayEl.innerHTML = `<div class="ai-answer error">⚠ All providers failed. Try again later.</div>`;
      }
    }
  }

  function displayResults(quizData) {
    let html = `
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

    quizData.questions?.forEach((q, i) => {
      const questionText = q.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
      const time = q.time ? `(at ${q.time.toFixed(2)}s)` : '';
      const correctChoices = q.choices?.filter(c => c.isCorrect) || [];

      html += `<div class="question-card" id="q${i}">
        <div class="question-text">Q${i + 1}: ${questionText}</div>
        <div class="question-time">${time}</div>
      `;

      if (correctChoices.length > 0) {
        correctChoices.forEach(choice => {
          const text = choice.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No answer text';
          html += `<div class="correct-answer">✔ ${text}</div>`;
        });
      } else {
        html += `<div class="no-answer">⚠ Open-Ended Question</div>
          <div class="provider-selector">
            <span>AI Provider:</span>
            <select id="provider${i}">
              <option value="deepinfra" selected>DeepInfra (Best)</option>
              <option value="huggingface">Hugging Face</option>
              <option value="pawan">Pawan</option>
              <option value="default">Fallback</option>
            </select>
          </div>
          <button class="generate-answer-btn" data-qid="${i}">Generate Answer</button>
          <div class="ai-display" id="ai${i}"></div>
        `;
      }

      html += `</div>`;
    });

    html += `</div>`;

    const popup = window.open('', '_blank', 'width=900,height=900,scrollbars=yes,resizable=yes');
    popup.document.write(html);
    popup.document.title = 'Edpuzzle Answers';

    // Event handlers
    popup.document.getElementById('skipBtn').onclick = function() {
      const video = document.querySelector('video');
      if (video) video.currentTime = video.duration;
      const skipBtn = document.querySelector('.skip-btn');
      if (skipBtn) skipBtn.click();
    };

    popup.document.getElementById('answerBtn').onclick = function() {
      if (!quizData.questions) return;
      const answerQuestion = (index) => {
        if (index >= quizData.questions.length) return;
        const q = quizData.questions[index];
        const questionContainer = document.querySelectorAll('.question-container')[index];
        if (!questionContainer) return setTimeout(() => answerQuestion(index + 1), 1000);

        const correctChoices = q.choices?.filter(c => c.isCorrect) || [];
        const choiceElements = questionContainer.querySelectorAll('.answer-item');
        correctChoices.forEach(choice => {
          const choiceIndex = q.choices.indexOf(choice);
          if (choiceElements[choiceIndex]) choiceElements[choiceIndex].click();
        });

        const checkBtn = questionContainer.querySelector('.check-answer');
        if (checkBtn) {
          checkBtn.click();
          setTimeout(() => {
            const nextBtn = questionContainer.querySelector('.skip-btn') || document.querySelector('.skip-btn');
            if (nextBtn) nextBtn.click();
            setTimeout(() => answerQuestion(index + 1), 1000);
          }, 1000);
        } else {
          setTimeout(() => answerQuestion(index + 1), 1000);
        }
      };
      answerQuestion(0);
    };

    popup.document.querySelectorAll('.generate-answer-btn').forEach(btn => {
      btn.onclick = function() {
        const qid = btn.getAttribute('data-qid');
        const questionText = quizData.questions[qid].body?.[0]?.html?.replace(/<[^>]*>/g, '') || '';
        const displayEl = popup.document.getElementById(`ai${qid}`);
        const providerSelect = popup.document.getElementById(`provider${qid}`);
        const provider = providerSelect ? providerSelect.value : 'deepinfra';
        generateAIAnswer(questionText, displayEl, provider);
      };
    });

    popup.document.close();
  }

  async function main() {
    const assignment_id = getAssignmentId();
    if (!assignment_id) return;
    try {
      const assignmentData = await fetchAssignmentDetails(assignment_id);
      const media_id = assignmentData?.teacherAssignments?.[0]?.contentId;
      if (!media_id) throw new Error('Could not get media ID');

      const credentials = getCredentials();
      const mediaData = await fetchMediaData(media_id, credentials.token);
      if (!mediaData) throw new Error('Failed to fetch questions');

      displayResults(mediaData);
    } catch (error) {
      alert(`Error: ${error.message}\n\nCheck:\n- Assignment ID\n- Token validity\n- Edpuzzle page context`);
    }
  }

  main();
})();
