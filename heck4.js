(async () => {
    // Step 1: Extract assignmentId and attachmentId from the current window URL
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = window.location.pathname.split('/assignments/')[1].split('/')[0];
    const attachmentId = urlParams.get('attachmentId');

    if (!assignmentId || !attachmentId) {
        alert('Unable to extract assignmentId or attachmentId from the URL.');
        return;
    }

    // Step 2: Fetch data from the first API endpoint (to get the media ID)
    const apiEndpoint1 = `https://edpuzzle.com/api/v3/learning/assignments/${assignmentId}/attachments/${attachmentId}/content`;
    const response1 = await fetch(apiEndpoint1, { credentials: 'include' });

    if (!response1.ok) {
        alert(`Failed to fetch data from ${apiEndpoint1}. Status: ${response1.status}`);
        return;
    }

    const data1 = await response1.json();

    // Debug: Log the raw JSON response from the first API call
    console.log('Raw JSON Response (First API Call - Media ID):', data1);

    // Step 3: Extract media ID from the JSON response
    const mediaId = data1?.content?.data?.id;

    if (!mediaId) {
        alert('Media ID not found in the API response.');
        return;
    }

    // Step 4: Fetch data from the second API endpoint (to get the questions and answers)
    const apiEndpoint2 = `https://edpuzzlefetch.edpuzzledestroyer.workers.dev/api/v3/media/${mediaId}`;
    const response2 = await fetch(apiEndpoint2, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HTTP-only cookies for edpuzzlefetch
        mode: 'cors', // Ensure cross-origin requests are allowed
    });

    if (!response2.ok) {
        alert(`Failed to fetch data from ${apiEndpoint2}. Status: ${response2.status}`);
        return;
    }

    const data2 = await response2.json();

    // Debug: Log the raw JSON response from the second API call
    console.log('Raw JSON Response (Second API Call - Questions and Answers):', data2);

    // Step 5: Process the media content and questions
    const mediaContent = data2; // Use the second API for media title/description
    const questions = data2.questions || []; // Use the second API for questions and answers

    // Create a popup container
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.width = '80%';
    popup.style.maxWidth = '600px';
    popup.style.backgroundColor = '#fff';
    popup.style.padding = '20px';
    popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popup.style.zIndex = '1000';
    popup.style.overflowY = 'auto';
    popup.style.maxHeight = '80vh';

    // Add title and description
    const title = document.createElement('h2');
    title.textContent = mediaContent.title || 'No Title Available';
    title.style.marginBottom = '10px';
    popup.appendChild(title);

    const description = document.createElement('p');
    description.textContent = mediaContent.description?.blocks?.map(block => block.text || '').join('') || 'No Description Available';
    description.style.marginBottom = '20px';
    popup.appendChild(description);

    // Add questions and answers
    questions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.style.marginBottom = '15px';

        // Add timestamp (if available)
        const timestamp = question.time; // Timestamp comes from the second API
        if (timestamp) {
            const timestampSpan = document.createElement('span');
            timestampSpan.textContent = `[${formatTime(timestamp)}] `;
            timestampSpan.style.fontWeight = 'bold';
            timestampSpan.style.color = '#555';
            questionDiv.appendChild(timestampSpan);
        }

        // Add question text
        const questionText = document.createElement('p');

        // Defensive check for question body
        const questionBody = question.body?.[0]?.html || '<em>Question text unavailable</em>';
        questionText.innerHTML = questionBody;
        questionText.style.fontWeight = 'bold';
        questionDiv.appendChild(questionText);

        // Add choices (if available)
        if (question.choices && Array.isArray(question.choices)) {
            question.choices.forEach(choice => {
                const choiceDiv = document.createElement('div');
                choiceDiv.style.marginLeft = '20px';

                const choiceText = document.createElement('span');

                // Defensive check for choice content
                const choiceBody = choice.body?.[0]?.html || '<em>Choice text unavailable</em>';
                choiceText.innerHTML = choiceBody;

                // Highlight based on correctness
                if (question.type === 'multiple-choice') {
                    const isCorrect = choice.isCorrect;
                    choiceDiv.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
                    choiceDiv.style.color = isCorrect ? '#155724' : '#721c24';
                } else {
                    choiceDiv.style.backgroundColor = '#fff3cd';
                    choiceDiv.style.color = '#856404';
                }

                choiceDiv.appendChild(choiceText);
                questionDiv.appendChild(choiceDiv);
            });
        } else {
            const noChoicesMessage = document.createElement('p');
            noChoicesMessage.innerHTML = '<em>No choices available for this question.</em>';
            noChoicesMessage.style.color = '#888'; // Gray out unavailable text
            questionDiv.appendChild(noChoicesMessage);
        }

        popup.appendChild(questionDiv);
    });

    // Add raw JSON section
    const jsonSection = document.createElement('div');
    jsonSection.style.marginTop = '20px';
    jsonSection.style.borderTop = '1px solid #ccc';
    jsonSection.style.paddingTop = '20px';

    const jsonTitle = document.createElement('h3');
    jsonTitle.textContent = 'Raw JSON Data:';
    jsonTitle.style.marginBottom = '10px';
    jsonSection.appendChild(jsonTitle);

    const jsonPre = document.createElement('pre');
    jsonPre.style.whiteSpace = 'pre-wrap';
    jsonPre.style.wordWrap = 'break-word';
    jsonPre.style.backgroundColor = '#f9f9f9';
    jsonPre.style.padding = '10px';
    jsonPre.style.border = '1px solid #ddd';
    jsonPre.style.borderRadius = '4px';
    jsonPre.style.fontSize = '12px';
    jsonPre.textContent = JSON.stringify(data2, null, 2); // Pretty-print the JSON
    jsonSection.appendChild(jsonPre);

    popup.appendChild(jsonSection);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#007bff';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => popup.remove();
    popup.appendChild(closeButton);

    // Append the popup to the body
    document.body.appendChild(popup);
})();

// Helper function to format time (in seconds) as mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
