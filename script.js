function getAssignmentId() {
  let assignment_id = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/)?.[1];
  if (!assignment_id) {
    assignment_id = prompt('Enter Edpuzzle assignment ID:');
    if (!assignment_id) return null;
  }
  return assignment_id;
}

function getCredentials() {
  const email = "neel_ss@hotmail.com";
  if (!email) return null;
  
  const password = "Rsmhw1234$$";
  if (!password) return null;
  
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZkNzRmNGM4NTFhOTc5YzVhYmM1ZWEiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NDY2Mzc5NiwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzMjM4NzEsImV4cCI6MTc0NjkyODY3MSwianRpIjoiNjgxNmM5OWZmMzdlMjJhMDFjOTg4ZDM1In0.rlAMoA8TyFrzr4BHuecRibU82rTBMbjjvpBc3d1ZMSw";
  
  return { email, password, token };
}

async function authenticate(email, password) {
  try {
    const response = await fetch('https://edpuzzle.com/api/v3/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: email,
        password: password
      }),
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Authentication failed');
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function fetchMediaData(media_id, token) {
  try {
    const response = await fetch(`https://edpuzzle.com/api/v3/media/${media_id}`, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to fetch media data');
    
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
    </style>
    <div class="answer-popup">
      <h2>Edpuzzle Correct Answers</h2>
  `;

  quizData.questions.forEach((q, i) => {
    const questionText = q.body[0].html.replace(/<[^>]*>/g, '');
    const correctChoice = q.choices.find(c => c.isCorrect);
    const time = q.time ? `(Appears at ${q.time.toFixed(2)}s)` : '';
    
    html += `
      <div class="question">
        <div class="question-text"><strong>Q${i+1}:</strong> ${questionText}</div>
        <div class="question-time">${time}</div>
        <div class="correct-answer">✓ ${correctChoice.body[0].html.replace(/<[^>]*>/g, '')}</div>
      </div>
    `;
  });

  html += `</div>`;

  const popup = window.open('', '_blank', 'width=650,height=700,scrollbars=yes,resizable=yes');
  popup.document.write(html);
  popup.document.title = 'Edpuzzle Answers';
  popup.document.close();
}

async function main() {
  const assignment_id = getAssignmentId();
  if (!assignment_id) return;

  try {
    const assignmentResponse = await fetch(`https://edpuzzle.com/api/v3/assignments/${assignment_id}`);
    if (!assignmentResponse.ok) throw new Error(`Failed to fetch (Status ${assignmentResponse.status})`);
    
    const assignmentData = await assignmentResponse.json();
    const media_id = assignmentData.teacherAssignments[0].contentId;

    const credentials = getCredentials();
    if (!credentials) return;
    
    let token = credentials.token;
    if (!token) {
      token = await authenticate(credentials.email, credentials.password);
      if (!token) {
        alert('Authentication failed. Please check your credentials.');
        return;
      }
    }
    
    const mediaData = await fetchMediaData(media_id, token);
    if (!mediaData) {
      alert('Failed to fetch media data.');
      return;
    }
    
    displayResults(mediaData);
  } catch (error) {
    alert(`Error: ${error.message}\n\nMake sure you're on edpuzzle.com`);
  }
}

// Start the process
main();
