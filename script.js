function getAssignmentId() {
  let assignment_id = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/)?.[1];
  if (!assignment_id) {
    assignment_id = prompt('Enter Edpuzzle assignment ID:');
    if (!assignment_id) return null;
  }
  return assignment_id;
}

function getCredentials() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZkNzRmNGM4NTFhOTc5YzVhYmM1ZWEiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NDY2Mzc5NiwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzMjM4NzEsImV4cCI6MTc0NjkyODY3MSwianRpIjoiNjgxNmM5OWZmMzdlMjJhMDFjOTg4ZDM1In0.rlAMoA8TyFrzr4BHuecRibU82rTBMbjjvpBc3d1ZMSw";
  return { token };
}

async function fetchWithToken(url, token) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

function displayResults(quizData) {
  let html = `
    <style>
      .answer-popup {
        font-family: Arial, sans-serif;
        padding: 20px;
        max-width: 600px;
        background: white;
        color: #333;
      }
      .question {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      .correct-answer {
        color: #28a745;
        font-weight: bold;
        margin-left: 10px;
      }
      .no-answer {
        color: #dc3545;
        font-weight: bold;
        margin-left: 10px;
      }
      h2 {
        color: #333;
        margin-top: 0;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
      }
      .question-time {
        font-size: 12px;
        color: #666;
        margin-top: 3px;
      }
      .question-text {
        margin-bottom: 5px;
      }
      .controls {
        margin: 15px 0;
        display: flex;
        gap: 10px;
      }
      button {
        padding: 8px 12px;
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .multiple-answers {
        margin-left: 10px;
      }
    </style>
    <div class="answer-popup">
      <h2>Edpuzzle Correct Answers</h2>
      <div class="controls">
        <button id="skipBtn">Skip Video</button>
        <button id="answerBtn">Auto Answer Questions</button>
      </div>
  `;

  if (quizData.questions && quizData.questions.length > 0) {
    quizData.questions.forEach((q, i) => {
      const questionText = q.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No question text';
      const time = q.time ? `(Appears at ${q.time.toFixed(2)}s)` : '';
      
      let answerHtml = '';
      
      if (q.choices?.length > 0) {
        const correctChoices = q.choices.filter(c => c.isCorrect);
        if (correctChoices.length > 0) {
          answerHtml = `<div class="multiple-answers">`;
          correctChoices.forEach(choice => {
            const answerText = choice.body?.[0]?.html?.replace(/<[^>]*>/g, '') || 'No answer text';
            answerHtml += `<div class="correct-answer">✓ ${answerText}</div>`;
          });
          answerHtml += `</div>`;
        } else {
          answerHtml = `<div class="no-answer">No correct answer</div>`;
        }
      } else {
        answerHtml = `<div class="no-answer">No answer choices</div>`;
      }
      
      html += `
        <div class="question">
          <div class="question-text"><strong>Q${i+1}:</strong> ${questionText}</div>
          <div class="question-time">${time}</div>
          ${answerHtml}
        </div>
      `;
    });
  } else {
    html += `<p>No questions found in this assignment.</p>`;
  }

  html += `</div>`;

  const popup = window.open('', '_blank', 'width=650,height=700,scrollbars=yes,resizable=yes');
  popup.document.write(html);
  popup.document.title = 'Edpuzzle Answers';
  
  popup.document.getElementById('skipBtn').onclick = function() {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = video.duration;
      const skipBtn = document.querySelector('.skip-btn');
      if (skipBtn) skipBtn.click();
    }
  };
  
  popup.document.getElementById('answerBtn').onclick = function() {
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
          const nextBtn = questionContainer.querySelector('.skip-btn') || 
                         document.querySelector('.skip-btn');
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
    const credentials = getCredentials();
    if (!credentials?.token) {
      alert('No authentication token found');
      return;
    }

    // First get assignment details
    const assignmentData = await fetchWithToken(
      `https://edpuzzle.com/api/v3/assignments/${assignment_id}`,
      credentials.token
    );
    
    if (!assignmentData?.teacherAssignments?.[0]?.contentId) {
      throw new Error('Could not get assignment data');
    }

    // Then get media with questions
    const mediaData = await fetchWithToken(
      `https://edpuzzle.com/api/v3/media/${assignmentData.teacherAssignments[0].contentId}`,
      credentials.token
    );

    if (!mediaData) {
      alert('Failed to fetch questions data');
      return;
    }

    displayResults(mediaData);
  } catch (error) {
    alert(`Error: ${error.message}\n\nMake sure you're on edpuzzle.com`);
  }
}

// Start the process
main();
