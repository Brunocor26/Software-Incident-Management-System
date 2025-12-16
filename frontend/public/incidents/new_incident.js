// ---------- UTILS ----------
const $ = q => document.querySelector(q);

// ---------- FORM ----------
const form = $('#new-incident-form');

form.addEventListener('submit', e => {
  e.preventDefault();

  // basic validation
  if (!form.checkValidity()) { form.reportValidity(); return; }

  // build object
  const body = {
    title: form.title.value.trim(),
    priority: form.priority.value || "",
    category: form.category.value,
    status: form.status.value,
    description: form.description.value.trim()
  };

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "../login/login.html";
    return;
  }

  // send to API
  fetch('/api/incidents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })
    .then(async res => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create incident');
      }
      return res.json();
    })
    .then(() => {
      // redirect
      location.href = 'incidents.html';
    })
    .catch(err => {
      console.error(err);
      alert(`Error creating incident: ${err.message}`);
    });
});