// =================================================================
// CONFIGURATION
// =================================================================
const backendUrl = 'https://pse10-backend-app.azurewebsites.net';
// Note: The WebPubSubClient library must be imported in your HTML files.

// =================================================================
// LOGIN & SIGNUP FUNCTIONS
// =================================================================

function showErrorMessage(message) {
  const errorMessageEl = document.getElementById('errorMessage');
  if (errorMessageEl) {
    errorMessageEl.innerText = message;
    errorMessageEl.style.display = 'block';
  }
}

function login() {
  const username = document.getElementById('name')?.value?.trim();
  const password = document.getElementById('password')?.value?.trim();

  if (!username || !password) {
    return showErrorMessage('Please enter your username and password.');
  }

  fetch(`${backendUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => {
    if (!response.ok) { throw new Error('Invalid username or password.'); }
    return response.json();
  })
  .then(data => {
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userNumber', data.user.username);
    window.location.href = 'menu.html';
  })
  .catch(error => {
    showErrorMessage(error.message);
  });
}

function signup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const username = document.getElementById('signupUsername')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value?.trim();

  if (!name || !username || !email || !password) {
    return showErrorMessage('Please fill in all signup details.');
  }

  fetch(`${backendUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password })
  })
  .then(response => {
    if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message) });
    }
    return response.json();
  })
  .then(data => {
    alert(data.message + ' Please log in.');
    window.location.href = 'index.html';
  })
  .catch(error => {
    showErrorMessage('Signup failed: ' + error.message);
  });
}

// =================================================================
// REAL-TIME NOTIFICATION FUNCTIONS
// =================================================================

async function connectToWebPubSub() {
  const username = localStorage.getItem('userNumber');
  if (!username || typeof WebPubSubClient === 'undefined') {
    console.log("Not connecting to WebPubSub: user not logged in or library not found.");
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/negotiate?username=${username}`);
    const data = await response.json();
    const client = new WebPubSubClient(data.url);

    client.on("server-message", (e) => {
      const notification = e.message.data;
      console.log("Received notification:", notification);
      
      if (notification.type === 'newProposal') {
        showProposalPopup(notification.data);
      } else if (notification.type === 'proposalResponse') {
        alert(`Your proposal for the topic "${notification.data.topic}" was ${notification.data.status} by ${notification.data.recipient}.`);
      }
    });

    await client.start();
    console.log("Connected to real-time notification service.");

  } catch (err) {
    console.error("Failed to connect to real-time service:", err);
  }
}

function showProposalPopup(proposalData) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'modal-content';
  
  popup.innerHTML = `
    <h3>New Tutoring Offer!</h3>
    <p>
      <strong>Tutor:</strong> ${proposalData.tutorName} <br>
      <strong>Tutor Points:</strong> ${proposalData.tutorPoints} <br>
      <strong>Topic:</strong> ${proposalData.topic} <br>
      <strong>Date:</strong> ${proposalData.date} <br>
      <strong>Time:</strong> ${proposalData.time}
    </p>
    <p>Are you okay with this tutor, date, and time?</p>
    <div class="modal-buttons">
      <button id="acceptBtn" class="modal-button-submit">YES</button>
      <button id="rejectBtn" class="modal-button-close">NO</button>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  document.getElementById('acceptBtn').onclick = () => {
    fetch(`${backendUrl}/api/proposals/${proposalData.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'accepted' })
    });
    document.body.removeChild(overlay);
  };

  document.getElementById('rejectBtn').onclick = () => {
    fetch(`${backendUrl}/api/proposals/${proposalData.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'rejected' })
    });
    document.body.removeChild(overlay);
  };
}


// =================================================================
// PASSWORD RESET FUNCTIONS
// =================================================================

function requestPasswordReset() {
  const email = document.getElementById('email')?.value?.trim();
  if (!email) {
    return showErrorMessage('Please enter your registered email.');
  }

  fetch(`${backendUrl}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message + " For testing, check the backend's Log stream for the reset link.");
    window.location.href = 'index.html';
  })
  .catch(error => {
    showErrorMessage('An error occurred. Please try again.');
  });
}

function verifyResetToken() {
  const token = getQueryParam('token');
  if (!token) {
    showErrorMessage('No reset token provided. Please request a new link.');
    document.querySelector('button').disabled = true;
  }
}

function submitNewPassword() {
  const token = getQueryParam('token');
  const newPassword = document.getElementById('newPassword')?.value?.trim();
  const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();

  if (!newPassword || !confirmPassword) {
    return showErrorMessage('Please enter and confirm your new password.');
  }
  if (newPassword !== confirmPassword) {
    return showErrorMessage('Passwords do not match.');
  }

  fetch(`${backendUrl}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, password: newPassword })
  })
  .then(response => {
    if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message) });
    }
    return response.json();
  })
  .then(data => {
    alert(data.message);
    window.location.href = 'index.html';
  })
  .catch(error => {
    showErrorMessage('Error resetting password: ' + error.message);
  });
}


// =================================================================
// OTHER HELPER FUNCTIONS
// =================================================================

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function logout() {
  localStorage.removeItem('userName');
  localStorage.removeItem('userNumber');
  window.location.href = 'index.html';
}

function autoFillTutorForm() {
  const name = localStorage.getItem('userName') || '';
  const number = localStorage.getItem('userNumber') || '';
  if (document.getElementById('tutorName')) document.getElementById('tutorName').value = name;
  if (document.getElementById('tutorNumber')) document.getElementById('tutorNumber').value = number;
}

// =================================================================
// SUBMIT FUNCTIONS (API Calls)
// =================================================================

function submitLearn() {
  const topic = document.getElementById('learnTopic')?.value?.trim();
  const filename = document.getElementById('learnFile')?.files[0]?.name || '';
  const username = localStorage.getItem('userNumber');

  if (!topic || !filename) {
    alert('Please enter a topic and choose a file.');
    return;
  }
  const learnRequestData = { topic: topic, fileName: filename, requestedByUsername: username };
  fetch(`${backendUrl}/api/learn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(learnRequestData)
  })
  .then(response => response.json())
  .then(data => {
    alert('Learning request submitted!');
    window.location.href = 'profile.html';
  })
  .catch(error => {
    alert('Failed to submit request. Please try again.');
  });
}

function submitTutor() {
  const name = document.getElementById('tutorName')?.value?.trim();
  const number = document.getElementById('tutorNumber')?.value?.trim();
  const time = document.getElementById('tutorTime')?.value?.trim();
  if (!name || !number || !time) {
    alert('Please fill Name, Number and Schedule & Timing.');
    return;
  }
  const tutorOfferData = { name: name, number: number, schedule: time };
  fetch(`${backendUrl}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutorOfferData)
  })
  .then(response => response.json())
  .then(data => {
    alert('Tutor details submitted!');
    window.location.href = 'profile.html';
  })
  .catch(error => {
    alert('Failed to submit offer. Please try again.');
  });
}

// =================================================================
// LOAD DATA & MODAL FUNCTIONS
// =================================================================

function loadTutorPoints() {
    const tutorPointsEl = document.getElementById('tutorPoints');
    if (tutorPointsEl) {
        tutorPointsEl.innerText = '10';
    }
}

function loadProfile() {
  const name = localStorage.getItem('userName') || 'Guest';
  const username = localStorage.getItem('userNumber') || '';

  if (document.getElementById('profileName')) document.getElementById('profileName').innerText = name;
  if (document.getElementById('profileUsername')) document.getElementById('profileUsername').innerText = username;

  const learnList = document.getElementById('learnRequestsList');
  const activeLearningCount = document.getElementById('activeLearningCount');

  if (learnList && username) {
    fetch(`${backendUrl}/api/learn?username=${username}`)
      .then(response => response.json())
      .then(requests => {
        if (activeLearningCount) activeLearningCount.innerText = requests.length;
        learnList.innerHTML = '';
        if (requests.length === 0) {
            learnList.innerHTML = '<li>No courses requested yet.</li>';
        } else {
            requests.forEach((req, idx) => {
                const li = document.createElement('li');
                li.innerText = `${idx + 1}. ${req.topic} — ${req.fileName}`;
                learnList.appendChild(li);
            });
        }
      })
      .catch(error => {
        learnList.innerHTML = '<li>Could not load learning requests.</li>';
      });
  }
  
  loadTutorPoints();
}

function loadTutorList() {
  const container = document.getElementById('tutorListContainer');
  if (!container) return;

  fetch(`${backendUrl}/api/learn`) 
    .then(response => response.json())
    .then(requests => {
      container.innerHTML = '';
      if (requests.length === 0) {
        container.innerHTML = '<p>No topics have been requested yet.</p>';
        return;
      }

      requests.forEach(req => {
        const card = document.createElement('div');
        card.className = 'tutor-card';
        card.innerHTML = `
          <div class="tutor-info">
            <h4>${req.topic}</h4>
            <p>File: ${req.fileName}</p>
          </div>
          <button onclick="openRequestModal('${req.topic}', '${req.requestedByUsername}')">Tutor</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(error => {
      container.innerHTML = '<p>Could not load topic list. Please try again later.</p>';
    });
}

function openRequestModal(topicName, recipientUsername) {
  const modal = document.getElementById('requestModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const submitRequestBtn = document.getElementById('submitRequestBtn');
  const requestDateEl = document.getElementById('requestDate');
  const requestTimeEl = document.getElementById('requestTime');

  if (!modal || !closeModalBtn || !submitRequestBtn || !requestDateEl || !requestTimeEl) return;

  requestDateEl.value = '';
  requestTimeEl.value = '';
  
  modal.style.display = 'flex';

  const closeModal = () => {
    modal.style.display = 'none';
  };

  const submitHandler = () => {
    const date = requestDateEl.value;
    const time = requestTimeEl.value;

    if (!date || !time) {
      alert('Please select both a date and a time.');
      return;
    }
    
    const proposerUsername = localStorage.getItem('userNumber');

    const proposalData = {
      proposerUsername: proposerUsername,
      recipientUsername: recipientUsername,
      topic: topicName,
      proposedDate: date,
      proposedTime: time
    };

    fetch(`${backendUrl}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    });

    closeModal();
    alert(`Offer to tutor for '${topicName}' sent! Waiting for student approval.`);
  };

  closeModalBtn.onclick = closeModal;
  submitRequestBtn.onclick = submitHandler;

  modal.onclick = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };
}

// Automatically connect to the notification service on pages that need it
document.addEventListener('DOMContentLoaded', function() {
    connectToWebPubSub();
});