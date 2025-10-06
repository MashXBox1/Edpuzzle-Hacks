(async () => {
    // Step 1: Extract assignmentId and attachmentId from the current window URL
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = window.location.pathname.split('/assignments/')[1]?.split('/')[0];
    const attachmentId = urlParams.get('attachmentId');

    if (!assignmentId || !attachmentId) {
        alert('Unable to extract assignmentId or attachmentId from the URL.');
        return;
    }

    // Step 2: Fetch media ID
    const apiEndpoint1 = `https://edpuzzle.com/api/v3/learning/assignments/${assignmentId}/attachments/${attachmentId}/content`;
    const response1 = await fetch(apiEndpoint1, { credentials: 'include' });
    if (!response1.ok) {
        alert(`Failed to fetch from ${apiEndpoint1}.`);
        return;
    }
    const data1 = await response1.json();
    const mediaId = data1?.content?.data?.id;
    if (!mediaId) {
        alert('Media ID not found.');
        return;
    }

    // Step 3: Fetch questions
    const apiEndpoint2 = `https://edpuzzlefetch.edpuzzledestroyer.workers.dev/api/v3/media/${mediaId}`;
    const response2 = await fetch(apiEndpoint2, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response2.ok) {
        alert(`Failed to fetch from ${apiEndpoint2}.`);
        return;
    }
    const data2 = await response2.json();
    const mediaContent = data2;
    const questions = data2.questions || [];

    // --- Popup Setup ---
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '100px';
    popup.style.left = '100px';
    popup.style.width = '600px';
    popup.style.height = '500px';
    popup.style.backgroundColor = 'black';
    popup.style.color = 'white';
    popup.style.border = '1px solid #444';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)';
    popup.style.zIndex = '99999';
    popup.style.overflow = 'hidden';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.fontFamily = 'Arial, sans-serif';

    // --- Header Bar ---
    const header = document.createElement('div');
    header.style.background = '#111';
    header.style.padding = '10px 15px';
    header.style.cursor = 'move';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.borderBottom = '1px solid #333';

    const title = document.createElement('span');
    title.textContent = mediaContent.title || 'Edpuzzle Answers';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';
    header.appendChild(title);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.textContent = '–';
    minimizeBtn.style.background = '#333';
    minimizeBtn.style.color = 'white';
    minimizeBtn.style.border = 'none';
    minimizeBtn.style.cursor = 'pointer';
    minimizeBtn.style.fontSize = '16px';
    minimizeBtn.style.width = '24px';
    minimizeBtn.style.height = '24px';
    minimizeBtn.style.borderRadius = '4px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = '#333';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.width = '24px';
    closeBtn.style.height = '24px';
    closeBtn.style.borderRadius = '4px';

    controls.appendChild(minimizeBtn);
    controls.appendChild(closeBtn);
    header.appendChild(controls);
    popup.appendChild(header);

    // --- Particle Background ---
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    popup.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    function resizeCanvas() {
        w = canvas.width = popup.clientWidth;
        h = canvas.height = popup.clientHeight;
        particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1,
        }));
    }
    resizeCanvas();
    new ResizeObserver(resizeCanvas).observe(popup);

    function animateParticles() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'white';
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --- Content Area ---
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.padding = '15px 20px';
    popup.appendChild(content);

    // Description
    if (mediaContent.description?.blocks?.length) {
        const desc = document.createElement('p');
        desc.textContent = mediaContent.description.blocks.map(b => b.text).join(' ');
        desc.style.textAlign = 'center';
        desc.style.color = '#bbb';
        desc.style.marginBottom = '15px';
        content.appendChild(desc);
    }

    // Questions
    questions.forEach(q => {
        const box = document.createElement('div');
        box.style.background = 'rgba(255,255,255,0.08)';
        box.style.border = '1px solid rgba(255,255,255,0.2)';
        box.style.borderRadius = '10px';
        box.style.padding = '15px';
        box.style.marginBottom = '15px';

        if (q.time) {
            const t = document.createElement('div');
            t.textContent = `[${formatTime(q.time)}]`;
            t.style.color = '#aaa';
            t.style.fontSize = '13px';
            t.style.marginBottom = '5px';
            box.appendChild(t);
        }

        const qText = document.createElement('div');
        qText.innerHTML = q.body?.[0]?.html || '<em>Question unavailable</em>';
        qText.style.fontWeight = 'bold';
        qText.style.textAlign = 'center';
        qText.style.marginBottom = '10px';
        box.appendChild(qText);

        if (q.choices && Array.isArray(q.choices)) {
            q.choices.forEach(c => {
                const choice = document.createElement('div');
                const isCorrect = c.isCorrect;
                choice.innerHTML = c.body?.[0]?.html || '<em>No text</em>';
                choice.style.padding = '8px 10px';
                choice.style.borderRadius = '6px';
                choice.style.margin = '5px 0';
                choice.style.textAlign = 'center';
                choice.style.background = isCorrect ? '#fff' : '#111';
                choice.style.color = isCorrect ? '#000' : '#fff';
                choice.style.border = isCorrect ? '2px solid #fff' : '1px solid #333';
                box.appendChild(choice);
            });
        }

        content.appendChild(box);
    });

    document.body.appendChild(popup);

    // --- Draggable Logic ---
    let isDragging = false;
    let offsetX, offsetY;
    header.addEventListener('mousedown', e => {
        isDragging = true;
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;
        popup.style.transition = 'none';
    });
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            popup.style.left = e.clientX - offsetX + 'px';
            popup.style.top = e.clientY - offsetY + 'px';
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);

    // --- Minimize / Restore Logic ---
    let minimized = false;
    minimizeBtn.onclick = () => {
        if (!minimized) {
            content.style.display = 'none';
            canvas.style.display = 'none';
            popup.style.height = '40px';
            minimizeBtn.textContent = '+';
            minimized = true;
        } else {
            content.style.display = 'block';
            canvas.style.display = 'block';
            popup.style.height = '500px';
            minimizeBtn.textContent = '–';
            minimized = false;
        }
    };

    closeBtn.onclick = () => popup.remove();

    // Helper
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
})();
