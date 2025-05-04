// edpuzzle-helper.js

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
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZkNzRmNGM4NTFhOTc5YzVhYmM1ZWEiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NDY2Mzc5NiwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzNjkyOTgsImV4cCI6MTc0Njk3NDA5OCwianRpIjoiNjgxNzdiMTIzNGRhNDRlYzJlOTIwODFjIn0.siO71gnOorbgsySBRUM41pG_WxF9yWFmbslLA0K1rOo" // <-- Replace with your valid token
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

  function displayResults(quizData) {
    let html = `
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .answer-popup {
          max-width: 700px;
          margin: auto;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        h2 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 25px;
        }
        button {
          background: #1e88e5;
          border: none;
          color: white;
          padding: 10px 18px;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        button:hover {
          background: #1669c1;
        }
        .question {
          background: #f1f5f9;
          border-left: 4px solid #3498db;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
        }
        .question-text {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .question-time {
          font-size: 12px;
          color: #666;
        }
        .correct-answer {
          margin-top: 6px;
          color: #27ae60;
          font-weight: 500;
        }
        .no-answer {
          margin-top: 6px;
          color: #c0392b;
          font-weight: 500;
        }
      </style>
      <div class="answer-popup">
        <h2>🎓 Edpuzzle Quiz Answers</h2>
        <div class="controls">
          <button id="skipBtn">⏭️ Skip Video</button>
          <button id="answerBtn">✅ Auto Answer</button>
        </div>
    `;

    if (quizData.questions?.length > 0) {
      quizData.questions.forEach((q, i) => {
        const questionText = q.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
        const time = q.time ? `(Appears at ${q.time.toFixed(2)}s)` : '';
        let answerHtml = '';

        const correctChoices = q.choices?.filter(c => c.isCorrect) || [];
        if (correctChoices.length > 0) {
          correctChoices.forEach(choice => {
            const answerText = choice.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No answer text';
            answerHtml += `<div class="correct-answer">✔ ${answerText}</div>`;
          });
        } else {
          answerHtml = `<div class="no-answer">No correct answer available</div>`;
        }

        html += `
          <div class="question">
            <div class="question-text">Q${i + 1}: ${questionText}</div>
            <div class="question-time">${time}</div>
            ${answerHtml}
          </div>
        `;
      });
    } else {
      html += `<p>No questions found in this assignment.</p>`;
    }

    html += `</div>`;

    const popup = window.open('', '_blank', 'width=720,height=800,scrollbars=yes,resizable=yes');
    popup.document.write(html);
    popup.document.title = 'Edpuzzle Answers';

    popup.document.getElementById('skipBtn').onclick = function () {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = video.duration;
        const skipBtn = document.querySelector('.skip-btn');
        if (skipBtn) skipBtn.click();
      }
    };

    popup.document.getElementById('answerBtn').onclick = function () {
      if (!quizData.questions) return;

      const answerQuestion = (index) => {
        if (index >= quizData.questions.length) return;
        const q = quizData.questions[index];
        const questionContainer = document.querySelectorAll('.question-container')[index];
        if (!questionContainer) {
          setTimeout(() => answerQuestion(index + 1), 1000);
          return;
        }

        const correctChoices = q.choices?.filter(c => c.isCorrect) || [];
        const choiceElements = questionContainer.querySelectorAll('.answer-item');
        correctChoices.forEach(choice => {
          const choiceIndex = q.choices.indexOf(choice);
          if (choiceElements[choiceIndex]) {
            choiceElements[choiceIndex].click();
          }
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

    popup.document.close();
  }

  async function main() {
    const assignment_id = getAssignmentId();
    if (!assignment_id) return;

    try {
      const assignmentData = await fetchAssignmentDetails(assignment_id);
      if (!assignmentData?.teacherAssignments?.[0]?.contentId) {
        throw new Error('Could not get media ID - are you sure this is a teacher assignment?');
      }

      const media_id = assignmentData.teacherAssignments[0].contentId;
      const credentials = getCredentials();

      const mediaData = await fetchMediaData(media_id, credentials.token);
      if (!mediaData) {
        throw new Error('Failed to fetch questions - token may be invalid');
      }

      displayResults(mediaData);
    } catch (error) {
      alert(`Error: ${error.message}\n\nPossible issues:\n1. Not on an Edpuzzle assignment page\n2. Not a teacher assignment\n3. Token may be expired`);
    }
  }

  main();
})();
