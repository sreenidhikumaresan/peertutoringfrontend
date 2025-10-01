// =================================================================
// CONFIGURATION
// =================================================================
const backendUrl = 'https://pse10-backend-api.victoriouscoast-a723bfc3.centralindia.azurecontainerapps.io';

// =================================================================
// LOGIN & SIGNUP FUNCTIONS
// =================================================================

function login() {
  const name = document.getElementById('name')?.value?.trim();
  const password = document.getElementById('password')?.value?.trim();

  if (name && password) {
    localStorage.setItem('userName', name);
    window.location.href = 'menu.html';
  } else {
    alert('Please enter your details');
  }
}

function signup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const number = document.getElementById('signupNumber')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value?.trim();

  if (name && number && password) {
    alert('Signup successful! Please log in.');
    window.location.href = 'index.html';
  } else {
    alert('Please fill in all signup details.');
  }
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

  if (!topic || !filename) {
    alert('Please enter a topic and choose a file.');
    return;
  }
  const learnRequestData = { topic: topic, fileName: filename };
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
    console.error('Error submitting learn request:', error);
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
    console.error('Error submitting tutor offer:', error);
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
  const username = name.toLowerCase().replace(' ', ''); 

  if (document.getElementById('profileName')) document.getElementById('profileName').innerText = name;
  if (document.getElementById('profileUsername')) document.getElementById('profileUsername').innerText = username;

  const learnList = document.getElementById('learnRequestsList');
  const activeLearningCount = document.getElementById('activeLearningCount');

  if (learnList) {
    fetch(`${backendUrl}/api/learn`)
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
        console.error('Error fetching learning requests:', error);
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
          <button onclick="openRequestModal('${req.topic}')">Tutor</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error fetching topic list:', error);
      container.innerHTML = '<p>Could not load topic list. Please try again later.</p>';
    });
}

function openRequestModal(topicName) {
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