(async () => {
  // --- helpers ---
  function formatTime(seconds) {
    if (typeof seconds !== 'number') return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // Extract IDs
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = window.location.pathname.split('/assignments/')[1]?.split('/')[0];
  const attachmentId = urlParams.get('attachmentId');
  if (!assignmentId || !attachmentId) {
    alert('Unable to extract assignmentId or attachmentId from the URL.');
    return;
  }

  // Open a blank window with just the button
  const blankWindow = window.open('', '_blank', 'width=400,height=300,scrollbars=no,resizable=yes');
  if (!blankWindow) {
    alert('Popup blocked. Allow popups for this site and try again.');
    return;
  }

  // Write basic HTML with just the generate button
  blankWindow.document.open();
  blankWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Edpuzzle Answers Generator</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
        }
        .generate-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 16px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .generate-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        .generate-btn:active {
          transform: translateY(-1px);
        }
        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .loading {
          display: none;
          margin-top: 20px;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top: 3px solid #667eea;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status {
          margin-top: 10px;
          font-size: 14px;
          color: #b0b0b0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="margin-bottom: 30px; font-weight: 500;">Edpuzzle Answers</h2>
        <button class="generate-btn" onclick="generateAnswers()">Generate Answers</button>
        <div class="loading" id="loading">
          <div class="spinner"></div>
          <p>Loading answers...</p>
          <div class="status" id="status"></div>
        </div>
        <div id="answersContainer" style="display: none;"></div>
      </div>

      <script>
        async function generateAnswers() {
          const btn = document.querySelector('.generate-btn');
          const loading = document.getElementById('loading');
          const status = document.getElementById('status');
          const answersContainer = document.getElementById('answersContainer');
          
          // Disable button and show loading
          btn.disabled = true;
          btn.textContent = 'Generating...';
          loading.style.display = 'block';
          status.textContent = 'Fetching data...';
          
          try {
            // This function will be called from the parent window
            await window.generateAnswersContent();
          } catch (error) {
            // If parent function fails, show error
            loading.style.display = 'none';
            answersContainer.innerHTML = '<p style="color: #ff6b6b; margin-top: 20px;">Error: ' + error.message + '</p>';
            answersContainer.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Generate Answers';
          }
        }

        function updateStatus(message) {
          const status = document.getElementById('status');
          if (status) {
            status.textContent = message;
          }
        }
      </script>
    </body>
    </html>
  `);
  blankWindow.document.close();

  // Function to fetch media data with retry logic for missing correct answers
  async function fetchMediaDataWithRetry(mediaId, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        blankWindow.updateStatus(`Fetching questions... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        const api2 = `https://edpuzzlefetch.edpuzzledestroyer.workers.dev/api/v3/media/${mediaId}`;
        const r2 = await fetch(api2, { credentials: 'include' });
        if (!r2.ok) throw new Error(`Fetch failed (${r2.status}) for ${api2}`);
        const d2 = await r2.json();
        
        const questions = Array.isArray(d2.questions) ? d2.questions : [];
        
        // Check if any question has correct answers
        let hasCorrectAnswers = false;
        for (const question of questions) {
          const choices = Array.isArray(question.choices) ? question.choices : [];
          for (const choice of choices) {
            if (choice.isCorrect === true) {
              hasCorrectAnswers = true;
              break;
            }
          }
          if (hasCorrectAnswers) break;
        }
        
        if (hasCorrectAnswers || questions.length === 0) {
          blankWindow.updateStatus(`Found ${questions.length} questions with answers`);
          return d2;
        } else {
          blankWindow.updateStatus(`No correct answers found, retrying... (${retryCount + 1}/${maxRetries})`);
          retryCount++;
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        }
      } catch (error) {
        retryCount++;
        blankWindow.updateStatus(`Error: ${error.message}, retrying... (${retryCount}/${maxRetries})`);
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      }
    }
    
    throw new Error(`No correct answers found after ${maxRetries} attempts`);
  }

  // Define the function that will be called when the button is pressed
  blankWindow.generateAnswersContent = async function() {
    try {
      // Fetch media ID
      blankWindow.updateStatus('Getting media information...');
      const api1 = `https://edpuzzle.com/api/v3/learning/assignments/${assignmentId}/attachments/${attachmentId}/content`;
      const r1 = await fetch(api1, { credentials: 'include' });
      if (!r1.ok) throw new Error(`Fetch failed (${r1.status}) for ${api1}`);
      const d1 = await r1.json();
      const mediaId = d1?.content?.data?.id;
      if (!mediaId) throw new Error('Media ID not found in response.');

      // Fetch media/questions with retry logic
      blankWindow.updateStatus('Media ID found, fetching questions...');
      const d2 = await fetchMediaDataWithRetry(mediaId, 5); // 5 retries max
      
      const title = d2.title || 'Edpuzzle Answers';
      const questions = Array.isArray(d2.questions) ? d2.questions : [];

      // Build the answers content
      let contentHtml = `
        <div class="popup-overlay">
          <div class="popup-container">
            <div class="header-container">
              <h1>${title}</h1>
      `;

      if (d2.description?.blocks?.length) {
        const descText = d2.description.blocks.map(b => b.text || '').join(' ');
        contentHtml += `<p class="description">${descText}</p>`;
      }
      
      contentHtml += `</div>`;

      if (questions.length === 0) {
        contentHtml += `<div class="no-questions">No questions found.</div>`;
      } else {
        contentHtml += `<div class="questions-container">`;
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const timestamp = q.time ? formatTime(q.time) : '';
          const qBodyHtml = q.body?.[0]?.html || '<em>Question unavailable</em>';

          contentHtml += `
            <article class="question-card">
              ${timestamp ? `<div class="timestamp">${timestamp}</div>` : ''}
              <div class="question-content">
                <p class="question-text">${qBodyHtml}</p>
          `;

          const choices = Array.isArray(q.choices) ? q.choices : [];
          if (choices.length === 0) {
            contentHtml += `<p class="no-choices">No choices available</p>`;
          } else {
            contentHtml += `<ol class="choices-list">`;
            let hasCorrectAnswer = false;
            
            for (const c of choices) {
              const isCorrect = !!c.isCorrect;
              if (isCorrect) hasCorrectAnswer = true;
              const choiceClass = isCorrect ? 'choice correct' : 'choice incorrect';
              const choiceHtml = c.body?.[0]?.html || '';
              contentHtml += `
                <li class="${choiceClass}">
                  <div class="choice-content">${choiceHtml}</div>
                  ${isCorrect ? '<div class="correct-badge">✓</div>' : ''}
                </li>`;
            }
            
            // If no correct answers were found in this question, show a warning
            if (!hasCorrectAnswer && choices.length > 0) {
              contentHtml += `<p class="no-choices" style="color: #ff6b6b; margin-top: 10px;">⚠️ No correct answer identified for this question</p>`;
            }
          }

          contentHtml += `
              </div>
            </article>
          `;
        }
        contentHtml += `</div>`;
      }

      contentHtml += `
            <div class="popup-actions">
              <button onclick="this.closest('.popup-overlay').remove()" class="close-btn">Close Answers</button>
            </div>
          </div>
        </div>
      `;

      // Enhanced CSS with beautiful background effects
      const fullCss = `
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
          }

          .popup-container {
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            border-radius: 20px;
            padding: 30px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          }

          /* Animated background elements */
          .popup-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.05) 0%, transparent 50%);
            animation: backgroundShift 20s ease-in-out infinite;
            z-index: -1;
            border-radius: 20px;
          }

          @keyframes backgroundShift {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.05) rotate(1deg); }
          }

          .header-container {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }

          h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 12px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            letter-spacing: -0.5px;
          }

          .description {
            color: #b0b0b0;
            font-size: 16px;
            line-height: 1.5;
            max-width: 600px;
            margin: 0 auto;
          }

          .questions-container {
            max-width: 780px;
            margin: 0 auto;
          }

          .question-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(15px);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .question-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(to bottom, #667eea, #764ba2);
            border-radius: 4px 0 0 4px;
          }

          .question-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .timestamp {
            color: #9a9a9a;
            font-size: 13px;
            margin-bottom: 16px;
            font-weight: 500;
            display: inline-block;
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .question-text {
            color: #ffffff;
            font-size: 17px;
            font-weight: 600;
            line-height: 1.5;
            margin-bottom: 20px;
          }

          .choices-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .choice {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px 20px;
            margin: 12px 0;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .choice:hover {
            transform: translateX(4px);
            background: rgba(255, 255, 255, 0.15);
          }

          .choice.correct {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.3));
            border: 1px solid rgba(34, 197, 94, 0.4);
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2);
          }

          .choice.incorrect {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .choice-content {
            color: #ffffff;
            font-size: 15px;
            line-height: 1.4;
            flex: 1;
          }

          .correct-badge {
            background: #22c55e;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            margin-left: 12px;
            flex-shrink: 0;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .no-choices, .no-questions {
            color: #9a9a9a;
            text-align: center;
            font-style: italic;
            padding: 40px 20px;
            font-size: 16px;
          }

          .popup-actions {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .close-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .close-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          }

          /* Make sure inline html from Edpuzzle choices scales reasonably */
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 8px auto;
            border-radius: 8px;
          }

          table {
            max-width: 100%;
            overflow: auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            margin: 8px 0;
          }

          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        </style>
      `;

      // Hide loading and show answers
      const loading = blankWindow.document.getElementById('loading');
      const btn = blankWindow.document.querySelector('.generate-btn');
      const container = blankWindow.document.querySelector('.container');
      
      loading.style.display = 'none';
      btn.style.display = 'none';
      
      // Resize window to fit content
      blankWindow.resizeTo(850, 800);
      
      // Add the answers popup to the container
      container.innerHTML = fullCss + contentHtml;
      blankWindow.document.title = title;

    } catch (error) {
      // Show error in the window
      const loading = blankWindow.document.getElementById('loading');
      const btn = blankWindow.document.querySelector('.generate-btn');
      const container = blankWindow.document.querySelector('.container');
      
      loading.style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Generate Answers';
      
      container.innerHTML = `
        <div style="color: white; text-align: center;">
          <h2 style="color: #ff6b6b; margin-bottom: 15px;">Error Loading Answers</h2>
          <p style="margin-bottom: 20px; color: #ccc;">${error.message}</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
        </div>
      `;
      throw error; // Re-throw to be caught by the button's error handler
    }
  };

})();
