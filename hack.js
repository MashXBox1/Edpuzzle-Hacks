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

  // Fetch media ID
  try {
    const api1 = `https://edpuzzle.com/api/v3/learning/assignments/${assignmentId}/attachments/${attachmentId}/content`;
    const r1 = await fetch(api1, { credentials: 'include' });
    if (!r1.ok) throw new Error(`Fetch failed (${r1.status}) for ${api1}`);
    const d1 = await r1.json();
    const mediaId = d1?.content?.data?.id;
    if (!mediaId) throw new Error('Media ID not found in response.');

    // Fetch media/questions
    const api2 = `https://edpuzzlefullcompletion.neelseshadri31.workers.dev/api/v3/media/${mediaId}`;
    const r2 = await fetch(api2, { credentials: 'include' });
    if (!r2.ok) throw new Error(`Fetch failed (${r2.status}) for ${api2}`);
    const d2 = await r2.json();
    const title = d2.title || 'Edpuzzle Answers';
    const questions = Array.isArray(d2.questions) ? d2.questions : [];

    // Open popup window
    const popup = window.open('', '_blank', 'width=820,height=750,scrollbars=yes,resizable=yes');
    if (!popup) {
      alert('Popup blocked. Allow popups for this site and try again.');
      return;
    }

    // Build enhanced HTML with better UI
    let contentHtml = `
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
          for (const c of choices) {
            const isCorrect = !!c.isCorrect;
            const choiceClass = isCorrect ? 'choice correct' : 'choice incorrect';
            const choiceHtml = c.body?.[0]?.html || '';
            contentHtml += `
              <li class="${choiceClass}">
                <div class="choice-content">${choiceHtml}</div>
                ${isCorrect ? '<div class="correct-badge">✓</div>' : ''}
              </li>`;
          }
          contentHtml += `</ol>`;
        }

        contentHtml += `
            </div>
          </article>
        `;
      }
      contentHtml += `</div>`;
    }

    // Enhanced CSS with beautiful background effects
    const fullHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  body {
    background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
    padding: 20px 16px 40px 16px;
    position: relative;
    min-height: 100vh;
  }

  /* Animated background elements */
  body::before {
    content: '';
    position: fixed;
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
  }

  @keyframes backgroundShift {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.05) rotate(1deg); }
  }

  /* Floating particles */
  body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.2), transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.1), transparent),
      radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.2), transparent);
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: float 60s linear infinite;
    z-index: -1;
    opacity: 0.4;
  }

  @keyframes float {
    0% { transform: translateY(0px) translateX(0px); }
    100% { transform: translateY(-200px) translateX(200px); }
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
</head>
<body>
${contentHtml}
</body>
</html>`;

    popup.document.open();
    popup.document.write(fullHtml);
    popup.document.close();

  } catch (err) {
    alert('Error: ' + (err && err.message ? err.message : String(err)));
    console.error(err);
  }
})();
