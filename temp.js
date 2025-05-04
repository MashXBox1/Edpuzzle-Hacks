(async function () {
  function _0x4861d6() {
    let _0x85e13 = window.location.pathname.match(/\/assignments\/([a-f0-9]+)/)?.[0x1];
    if (!_0x85e13) {
      _0x85e13 = prompt("Enter Edpuzzle assignment ID:");
      if (!_0x85e13) {
        return null;
      }
    }
    return _0x85e13;
  }
  async function _0x39926d(_0x48e3e6) {
    try {
      const _0x372d4e = await fetch("https://edpuzzle.com/api/v3/assignments/" + _0x48e3e6, {
        'credentials': "include"
      });
      if (!_0x372d4e.ok) {
        throw new Error("Failed to fetch assignment (Status: " + _0x372d4e.status + ')');
      }
      return await _0x372d4e.json();
    } catch (_0x18b9fa) {
      console.error("Assignment fetch error:", _0x18b9fa);
      return null;
    }
  }
  async function _0xa537f(_0xea9bd0, _0x234357) {
    try {
      const _0x20d745 = await fetch("https://edpuzzle.com/api/v3/media/" + _0xea9bd0, {
        'headers': {
          'Authorization': "Bearer " + _0x234357,
          'Content-Type': "application/json"
        },
        'credentials': "omit"
      });
      if (!_0x20d745.ok) {
        throw new Error("Failed to fetch media (Status: " + _0x20d745.status + ')');
      }
      return await _0x20d745.json();
    } catch (_0x16f260) {
      console.error("Media fetch error:", _0x16f260);
      return null;
    }
  }
  async function _0xf67303(_0x451f60, _0x203c91, _0x18d227 = "deepinfra") {
    try {
      _0x203c91.innerHTML = "<em>Generating answer with " + _0x18d227 + "...</em>";
      let _0x4cdff0;
      switch (_0x18d227) {
        case "deepinfra":
          _0x4cdff0 = await fetch("https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.1", {
            'method': "POST",
            'headers': {
              'Content-Type': 'application/json',
              'Authorization': "Bearer x8i4xUCxtNs4EZMMiO2ifmyxnxZD8WYl"
            },
            'body': JSON.stringify({
              'input': "Answer this Edpuzzle question concisely and accurately: " + _0x451f60,
              'max_new_tokens': 0xc8,
              'temperature': 0.7
            })
          });
          if (_0x4cdff0.status === 0x1ad) {
            throw new Error("DeepInfra rate limit - try again later");
          }
          if (_0x4cdff0.status === 0x193) {
            throw new Error("Invalid API key - check your DeepInfra key");
          }
          break;
        case "huggingface":
          _0x4cdff0 = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1", {
            'method': "POST",
            'headers': {
              'Authorization': "Bearer YOUR_HF_TOKEN_HERE",
              'Content-Type': "application/json"
            },
            'body': JSON.stringify({
              'inputs': "Answer this Edpuzzle question: " + _0x451f60,
              'parameters': {
                'max_new_tokens': 0x96
              }
            })
          });
          break;
        case 'pawan':
          _0x4cdff0 = await fetch('https://api.pawan.krd/v1/chat/completions', {
            'method': 'POST',
            'headers': {
              'Content-Type': "application/json",
              'Authorization': "Bearer pk-this-is-a-free-free-key-6445d31b64a9407d8093c563a8ac9125"
            },
            'body': JSON.stringify({
              'model': 'gpt-3.5-turbo',
              'messages': [{
                'role': "user",
                'content': "Answer this Edpuzzle question: " + _0x451f60
              }],
              'max_tokens': 0x96
            })
          });
          break;
        default:
          _0x4cdff0 = await fetch("https://chatgpt-api.shn.hk/v1/", {
            'method': 'POST',
            'headers': {
              'Content-Type': "application/json"
            },
            'body': JSON.stringify({
              'model': "gpt-3.5-turbo",
              'messages': [{
                'role': 'user',
                'content': "Answer this: " + _0x451f60
              }]
            })
          });
      }
      const _0x24a884 = await _0x4cdff0.json();
      let _0xfe22bf;
      if (_0x18d227 === "deepinfra") {
        _0xfe22bf = _0x24a884.results?.[0x0]?.["generated_text"] || "No answer generated";
      } else if (_0x18d227 === "huggingface") {
        _0xfe22bf = _0x24a884[0x0]?.['generated_text'] || "No answer generated";
      } else {
        _0xfe22bf = _0x24a884.choices?.[0x0]?.["message"]?.['content'] || "No answer generated";
      }
      _0xfe22bf = _0xfe22bf.replace(/Answer this Edpuzzle question.*?:/, '').trim();
      _0x203c91.innerHTML = "<div class=\"ai-answer\">🤖 <strong>" + _0x18d227 + "</strong>: " + _0xfe22bf + '</div>';
    } catch (_0x170a7a) {
      console.error("Error with " + _0x18d227 + ':', _0x170a7a);
      const _0x2bf490 = ['deepinfra', "huggingface", "pawan", "default"];
      const _0x51bf59 = _0x2bf490[_0x2bf490.indexOf(_0x18d227) + 0x1];
      if (_0x51bf59) {
        _0x203c91.innerHTML = "<em>" + _0x170a7a.message + ". Retrying with " + _0x51bf59 + "...</em>";
        setTimeout(() => _0xf67303(_0x451f60, _0x203c91, _0x51bf59), 0x5dc);
      } else {
        _0x203c91.innerHTML = "<div class=\"ai-answer error\">⚠ All providers failed. Try again later.</div>";
      }
    }
  }
  function _0x597617(_0x135ac3) {
    let _0x3f79df = "\n      <style>\n        body {\n          background: linear-gradient(to right, #ffecd2, #fcb69f);\n          font-family: 'Poppins', sans-serif;\n        }\n        .container {\n          max-width: 900px;\n          margin: 40px auto;\n          padding: 30px;\n          background: #ffffffcc;\n          backdrop-filter: blur(8px);\n          border-radius: 20px;\n          box-shadow: 0 10px 30px rgba(0,0,0,0.15);\n        }\n        h1 {\n          text-align: center;\n          color: #ff5722;\n          margin-bottom: 30px;\n        }\n        .controls {\n          display: flex;\n          justify-content: center;\n          gap: 20px;\n          margin: 20px 0;\n          flex-wrap: wrap;\n        }\n        .controls button {\n          background: #ff5722;\n          color: white;\n          border: none;\n          padding: 12px 20px;\n          border-radius: 30px;\n          font-weight: bold;\n          cursor: pointer;\n          transition: all 0.3s;\n          min-width: 150px;\n        }\n        .controls button:hover {\n          background: #e64a19;\n          transform: translateY(-2px);\n        }\n        .question-card {\n          border-left: 6px solid #00b894;\n          background: #fafafa;\n          padding: 20px;\n          border-radius: 15px;\n          margin-bottom: 25px;\n          box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n          transition: all 0.3s;\n        }\n        .question-card:hover {\n          transform: translateY(-3px);\n          box-shadow: 0 6px 12px rgba(0,0,0,0.15);\n        }\n        .question-text {\n          font-weight: bold;\n          font-size: 18px;\n          margin-bottom: 10px;\n          color: #333;\n        }\n        .question-time {\n          font-size: 14px;\n          color: #666;\n          margin-bottom: 15px;\n        }\n        .correct-answer {\n          background: #e8f5e9;\n          color: #2e7d32;\n          padding: 12px;\n          border-radius: 10px;\n          margin: 8px 0;\n          border-left: 4px solid #4caf50;\n        }\n        .no-answer {\n          color: #c62828;\n          font-weight: bold;\n          margin-bottom: 15px;\n          padding: 10px;\n          background: #ffebee;\n          border-radius: 8px;\n        }\n        .generate-answer-btn {\n          background: #4CAF50;\n          color: white;\n          padding: 10px 15px;\n          border-radius: 8px;\n          border: none;\n          cursor: pointer;\n          margin: 10px 5px 5px 0;\n          transition: all 0.3s;\n        }\n        .generate-answer-btn:hover {\n          background: #388e3c;\n          transform: translateY(-2px);\n        }\n        .ai-answer {\n          background: #e3f2fd;\n          border-left: 6px solid #2196F3;\n          padding: 15px;\n          margin-top: 15px;\n          border-radius: 8px;\n          animation: fadeIn 0.5s;\n        }\n        .ai-answer.error {\n          border-left-color: #f44336;\n          background: #ffebee;\n        }\n        .provider-selector {\n          margin: 15px 0;\n          display: flex;\n          align-items: center;\n          gap: 10px;\n        }\n        .provider-selector select {\n          padding: 8px 12px;\n          border-radius: 8px;\n          border: 1px solid #ddd;\n          background: white;\n          font-size: 14px;\n        }\n        @keyframes fadeIn {\n          from { opacity: 0; }\n          to { opacity: 1; }\n        }\n        .status {\n          text-align: center;\n          margin: 20px 0;\n          font-style: italic;\n          color: #666;\n        }\n      </style>\n      <div class=\"container\">\n        <h1>🚀 Edpuzzle Answer Assistant</h1>\n        <div class=\"status\">Using your DeepInfra API key for best results</div>\n        <div class=\"controls\">\n          <button id=\"skipBtn\">⏭ Skip Video</button>\n          <button id=\"answerBtn\">🧠 Auto Answer</button>\n        </div>\n    ";
    _0x135ac3.questions?.["forEach"]((_0x474dc3, _0xe4597) => {
      const _0x4991b8 = _0x474dc3.body?.[0x0]?.["html"]?.["replace"](/<[^>]*>/g, '') || "No question text";
      const _0xfc2df2 = _0x474dc3.time ? "(at " + _0x474dc3.time.toFixed(0x2) + 's)' : '';
      const _0x3ab420 = _0x474dc3.choices?.["filter"](_0xbe588 => _0xbe588.isCorrect) || [];
      _0x3f79df += "<div class=\"question-card\" id=\"q" + _0xe4597 + "\">\n        <div class=\"question-text\">Q" + (_0xe4597 + 0x1) + ": " + _0x4991b8 + "</div>\n        <div class=\"question-time\">" + _0xfc2df2 + "</div>\n      ";
      if (_0x3ab420.length > 0x0) {
        _0x3ab420.forEach(_0x426482 => {
          const _0x21b72e = _0x426482.body?.[0x0]?.["html"]?.["replace"](/<[^>]*>/g, '') || "No answer text";
          _0x3f79df += "<div class=\"correct-answer\">✔ " + _0x21b72e + "</div>";
        });
      } else {
        _0x3f79df += "<div class=\"no-answer\">⚠ Open-Ended Question</div>\n          <div class=\"provider-selector\">\n            <span>AI Provider:</span>\n            <select id=\"provider" + _0xe4597 + "\">\n              <option value=\"deepinfra\" selected>DeepInfra (Best)</option>\n              <option value=\"huggingface\">Hugging Face</option>\n              <option value=\"pawan\">Pawan</option>\n              <option value=\"default\">Fallback</option>\n            </select>\n          </div>\n          <button class=\"generate-answer-btn\" data-qid=\"" + _0xe4597 + "\">Generate Answer</button>\n          <div class=\"ai-display\" id=\"ai" + _0xe4597 + "\"></div>\n        ";
      }
      _0x3f79df += "</div>";
    });
    _0x3f79df += "</div>";
    const _0x29cdb3 = window.open('', "_blank", 'width=900,height=900,scrollbars=yes,resizable=yes');
    _0x29cdb3.document.write(_0x3f79df);
    _0x29cdb3.document.title = "Edpuzzle Answers";
    _0x29cdb3.document.getElementById('skipBtn').onclick = function () {
      const _0x24c1ce = document.querySelector("video");
      if (_0x24c1ce) {
        _0x24c1ce.currentTime = _0x24c1ce.duration;
      }
      const _0x416744 = document.querySelector(".skip-btn");
      if (_0x416744) {
        _0x416744.click();
      }
    };
    _0x29cdb3.document.getElementById("answerBtn").onclick = function () {
      if (!_0x135ac3.questions) {
        return;
      }
      const _0x1180b8 = _0x2af6a0 => {
        if (_0x2af6a0 >= _0x135ac3.questions.length) {
          return;
        }
        const _0x3bfdf5 = _0x135ac3.questions[_0x2af6a0];
        const _0x6dcd48 = document.querySelectorAll(".question-container")[_0x2af6a0];
        if (!_0x6dcd48) {
          return setTimeout(() => _0x1180b8(_0x2af6a0 + 0x1), 0x3e8);
        }
        const _0xbedca7 = _0x3bfdf5.choices?.['filter'](_0x30f368 => _0x30f368.isCorrect) || [];
        const _0x3df867 = _0x6dcd48.querySelectorAll(".answer-item");
        _0xbedca7.forEach(_0xe81133 => {
          const _0x16f822 = _0x3bfdf5.choices.indexOf(_0xe81133);
          if (_0x3df867[_0x16f822]) {
            _0x3df867[_0x16f822].click();
          }
        });
        const _0x5d6dba = _0x6dcd48.querySelector('.check-answer');
        if (_0x5d6dba) {
          _0x5d6dba.click();
          setTimeout(() => {
            const _0x17875d = _0x6dcd48.querySelector(".skip-btn") || document.querySelector('.skip-btn');
            if (_0x17875d) {
              _0x17875d.click();
            }
            setTimeout(() => _0x1180b8(_0x2af6a0 + 0x1), 0x3e8);
          }, 0x3e8);
        } else {
          setTimeout(() => _0x1180b8(_0x2af6a0 + 0x1), 0x3e8);
        }
      };
      _0x1180b8(0x0);
    };
    _0x29cdb3.document.querySelectorAll('.generate-answer-btn').forEach(_0x495c07 => {
      _0x495c07.onclick = function () {
        const _0x54d27c = _0x495c07.getAttribute("data-qid");
        const _0x53af6e = _0x135ac3.questions[_0x54d27c].body?.[0x0]?.["html"]?.['replace'](/<[^>]*>/g, '') || '';
        const _0x10b108 = _0x29cdb3.document.getElementById('ai' + _0x54d27c);
        const _0x114b6c = _0x29cdb3.document.getElementById("provider" + _0x54d27c);
        const _0x181219 = _0x114b6c ? _0x114b6c.value : "deepinfra";
        _0xf67303(_0x53af6e, _0x10b108, _0x181219);
      };
    });
    _0x29cdb3.document.close();
  }
  async function _0x197981() {
    const _0x48d334 = _0x4861d6();
    if (!_0x48d334) {
      return;
    }
    try {
      const _0x15e82b = await _0x39926d(_0x48d334);
      const _0x544a58 = _0x15e82b?.['teacherAssignments']?.[0x0]?.["contentId"];
      if (!_0x544a58) {
        throw new Error("Could not get media ID");
      }
      const _0x440036 = await _0xa537f(_0x544a58, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODE2YzgwMmY4MTg1M2M5NDA2Y2RkZWUiLCJyb2xlIjoidGVhY2hlciIsInJlZ2lzdGVyZWRBdCI6MTc0NjMyMzQ1OCwiaXNBZG1pbiI6ZmFsc2UsImJlY29tZVRoaXNVc2VyIjpmYWxzZSwidXNlcklkQmVjb21pbmdUaGlzVXNlciI6IiIsImlzT3BlbkNsYXNzcm9vbVVzZXIiOmZhbHNlLCJpc0x0aVVzZXIiOmZhbHNlLCJpc1VzZXJVc2luZ1RoaXJkUGFydHlBcHBsaWNhdGlvbiI6ZmFsc2UsImlzT3JpZ2luYWxzU3R1ZGlvVXNlciI6ZmFsc2UsImlzSXRBZG1pblVzZXIiOmZhbHNlLCJsb2NhdGlvbiI6eyJjaXR5IjoiTWFuY2hlc3RlciIsInJlZ2lvbiI6IkNvbm5lY3RpY3V0IiwiY291bnRyeSI6IlVTIiwibGF0aXR1ZGUiOjQxLjc5NTgsImxvbmdpdHVkZSI6LTcyLjUyNDF9LCJpYXQiOjE3NDYzOTU4MjgsImV4cCI6MTc0NzAwMDYyOCwianRpIjoiNjgxN2UyYjRkNmMzZTFiNDhmMWQ4Zjc4In0.8YCPPaJz8H1IQAsJplH17Ny4Sae1JtzmbRBLNQgsDJ0");
      if (!_0x440036) {
        throw new Error("Failed to fetch questions");
      }
      _0x597617(_0x440036);
    } catch (_0x37341a) {
      alert("Error: " + _0x37341a.message + "\n\nCheck:\n- Assignment ID\n- Token validity\n- Edpuzzle page context");
    }
  }
  _0x197981();
})();
