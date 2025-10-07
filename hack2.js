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
    const api2 = `https://edpuzzlefetch.edpuzzledestroyer.workers.dev/api/v3/media/${mediaId}`;
    const r2 = await fetch(api2, { credentials: 'include' });
    if (!r2.ok) throw new Error(`Fetch failed (${r2.status}) for ${api2}`);
    const d2 = await r2.json();
    const title = d2.title || 'Edpuzzle Answers';
    const questions = Array.isArray(d2.questions) ? d2.questions : [];

    // Open popup window
    const popup = window.open('', '_blank', 'width=780,height=700,scrollbars=yes,resizable=yes');
    if (!popup) {
      alert('Popup blocked. Allow popups for this site and try again.');
      return;
    }

    // Build minimal HTML (no complex div overlay). Use semantic tags.
    let contentHtml = `<h1 style="margin:12px 0 6px 0;font-family:Inter,system-ui,Arial,sans-serif;color:#fff;font-size:20px;text-align:center;">${title}</h1>\n`;

    if (d2.description?.blocks?.length) {
      const descText = d2.description.blocks.map(b => b.text || '').join(' ');
      contentHtml += `<p style="text-align:center;color:#bdbdbd;margin:0 0 12px 0;font-family:Inter,system-ui,Arial,sans-serif;">${descText}</p>\n`;
    }

    if (questions.length === 0) {
      contentHtml += `<p style="color:#bbb;text-align:center;margin-top:24px;">No questions found.</p>`;
    } else {
      // Each question as <article>, choices inside <ol><li>
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const timestamp = q.time ? formatTime(q.time) : '';
        const qBodyHtml = q.body?.[0]?.html || '<em>Question unavailable</em>';

        contentHtml += `<article style="margin:18px auto;padding:12px;border-radius:10px;max-width:720px;background:rgba(255,255,255,0.03);box-sizing:border-box;">\n`;
        if (timestamp) {
          contentHtml += `<div style="color:#9a9a9a;font-size:13px;margin-bottom:6px;font-family:Inter,system-ui,Arial,sans-serif;">[${timestamp}]</div>\n`;
        }
        contentHtml += `<p style="margin:0 0 10px 0;font-weight:700;color:#fff;font-family:Inter,system-ui,Arial,sans-serif;">${qBodyHtml}</p>\n`;

        // choices as list (keep choice HTML)
        const choices = Array.isArray(q.choices) ? q.choices : [];
        if (choices.length === 0) {
          contentHtml += `<p style="color:#9a9a9a;font-style:italic;margin:6px 0 0 0;">No choices available</p>\n`;
        } else {
          contentHtml += `<ol style="list-style:none;padding:0;margin:6px 0 0 0;">\n`;
          for (const c of choices) {
            const isCorrect = !!c.isCorrect;
            // correct = white bg, black text; incorrect = black bg, white text but with subtle border so it's visible
            const liStyle = isCorrect
              ? 'background:#fff;color:#000;font-weight:700;border-radius:8px;padding:10px;margin:6px 0;border:2px solid #fff;'
              : 'background:#000;color:#fff;border-radius:8px;padding:10px;margin:6px 0;border:1px solid rgba(255,255,255,0.08);box-shadow:0 1px 0 rgba(255,255,255,0.02) inset;';
            const choiceHtml = c.body?.[0]?.html || '';
            contentHtml += `<li style="${liStyle}font-family:Inter,system-ui,Arial,sans-serif;text-align:center;">${choiceHtml}</li>\n`;
          }
          contentHtml += `</ol>\n`;
        }

        contentHtml += `</article>\n`;
      }
    }

    // Minimal CSS + write to popup
    const fullHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{height:100%;margin:0;background:#000;}
  body{padding:14px 12px 30px 12px;box-sizing:border-box;overflow:auto;-webkit-font-smoothing:antialiased;}
  h1{margin:0 0 6px 0;}
  article p, li {line-height:1.25;}
  /* make sure inline html from Edpuzzle choices scales reasonably */
  img {max-width:100%;height:auto;display:block;margin:6px auto;}
  table {max-width:100%;overflow:auto;}
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
