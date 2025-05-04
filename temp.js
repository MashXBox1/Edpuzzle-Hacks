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
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZkNzRmNGM4NTFhOTc5YzVhYmM1ZWEiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NDY2Mzc5NiwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzNzk0NzUsImV4cCI6MTc0Njk4NDI3NSwianRpIjoiNjgxN2EyZDMwN2NlODhkOWEzYzY3MjdkIn0.yrh21nClYHCJzoAD57u5V2SKbRaAQK7ltkwaKvX04lc" // Replace with a valid teacher token
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

  async function generateAIAnswer(questionText, displayEl) {
    try {
      displayEl.innerHTML = `<em>Generating answer...</em>`;
      const response = await fetch('https://freeopenaiapi.sreejan.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Answer this Edpuzzle open-ended question: "${questionText}"` }]
        })
      });
      const data = await response.json();
      const aiAnswer = data.choices?.[0]?.message?.content || 'Unable to generate answer.';
      displayEl.innerHTML = `<div class="ai-answer">🤖 ${aiAnswer}</div>`;
    } catch (e) {
      displayEl.innerHTML = `<div class="ai-answer error">⚠ Error generating answer.</div>`;
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
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
        }
        .controls button {
          background: #ff5722;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
        }
        .controls button:hover {
          background: #e64a19;
        }
        .question-card {
          border-left: 6px solid #00b894;
          background: #fafafa;
          padding: 15px 20px;
          border-radius: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .question-text {
          font-weight: bold;
        }
        .question-time {
          font-size: 13px;
          color: #888;
          margin-bottom: 10px;
        }
        .correct-answer {
          background: #d1f5d3;
          color: #2e7d32;
          padding: 8px;
          border-radius: 10px;
          margin: 5px 0;
        }
        .no-answer {
          color: #c0392b;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .generate-answer-btn {
          background: #4CAF50;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          margin-top: 5px;
        }
        .generate-answer-btn:hover {
          background: #388e3c;
        }
        .ai-answer {
          background: #e7f3fe;
          border-left: 6px solid #2196F3;
          padding: 10px;
          margin-top: 10px;
          border-radius: 8px;
        }
      </style>
      <div class="container">
        <h1>🚀 Edpuzzle Answer Assistant</h1>
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
        html += `<div class="no-answer">⚠ No correct answer found (Open-Ended)</div>
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
    popup.document.getElementById('skipBtn').onclick = function () {
      const video = document.querySelector('video');
      if (video) video.currentTime = video.duration;
      const skipBtn = document.querySelector('.skip-btn');
      if (skipBtn) skipBtn.click();
    };

    popup.document.getElementById('answerBtn').onclick = function () {
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
      btn.onclick = function () {
        const qid = btn.getAttribute('data-qid');
        const questionText = quizData.questions[qid].body?.[0]?.html?.replace(/<[^>]*>/g, '') || '';
        const displayEl = popup.document.getElementById(`ai${qid}`);
        generateAIAnswer(questionText, displayEl);
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
