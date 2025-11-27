// ---------- UTILS ----------
const $ = q => document.querySelector(q);
const params = new URLSearchParams(location.search);
const id = params.get('id');
if (!id) location.href = 'incidents.html';

// ---------- ELEMENTS ----------
const form = $('#incident-form');
const titleInp = $('#title');
const prioritySel = $('#priority');
const categorySel = $('#category');
const statusSel = $('#status');
const descTxt = $('#description');
const btnEdit = $('#btn-edit');
const btnSave = $('#btn-save');
const dropZone = $('#drop-zone');
const fileInput = $('#file-input');
const fileList = $('#file-list');

let attachments = []; // { name, size, dataURL }

// ---------- LOAD INCIDENT ----------
async function loadIncident() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "../login/login.html";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/incidents/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "../login/login.html";
        return;
      }
      alert('Incident not found');
      location.href = 'incidents.html';
      return;
    }

    const inc = await res.json();

    $('#incident-id').textContent = id;
    titleInp.value = inc.title;
    prioritySel.value = inc.priority;
    categorySel.value = inc.category;
    statusSel.value = inc.status;
    descTxt.value = inc.description || '';
    attachments = inc.attachments || [];
    renderFiles();
  } catch (err) {
    console.error(err);
    alert('Error loading incident');
  }
}
loadIncident();

// ---------- EDIT / SAVE ----------
btnEdit.addEventListener('click', () => {
  form.querySelectorAll('input,select,textarea').forEach(el => el.removeAttribute('readonly'));
  form.querySelectorAll('select').forEach(el => el.disabled = false);
  btnSave.disabled = false;
  btnEdit.disabled = true;
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "../login/login.html";
    return;
  }

  try {
    const body = {
      title: titleInp.value.trim(),
      priority: prioritySel.value,
      category: categorySel.value,
      description: descTxt.value.trim(),
      // attachments - backend doesn't support attachments yet, but we keep the UI logic
    };

    // First patch generic fields
    let res = await fetch(`http://localhost:3000/api/incidents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Failed to update incident details');

    // Then patch status if changed (separate endpoint in backend)
    // We can just send it, if it's the same the backend might process it or we could check.
    // The backend `PATCH /:id` doesn't include status, `PATCH /:id/status` does.

    res = await fetch(`http://localhost:3000/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: statusSel.value })
    });

    if (!res.ok) throw new Error('Failed to update status');

    alert('Saved!');
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Error saving incident');
  }
});

// ---------- ATTACHMENTS ----------
dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); })
);
['dragenter', 'dragover'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.add('drag-active'))
);
['dragleave', 'drop'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-active'))
);
dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(files) {
  [...files].forEach(f => {
    const reader = new FileReader();
    reader.onload = () => {
      attachments.push({ name: f.name, size: f.size, dataURL: reader.result });
      renderFiles();
    };
    reader.readAsDataURL(f);
  });
}

function renderFiles() {
  fileList.innerHTML = attachments.map((f, i) => `
    <li>
      <span>${f.name} (${(f.size / 1024).toFixed(1)} KB)</span>
      <button type="button" class="remove" data-i="${i}">×</button>
    </li>`).join('');
  fileList.querySelectorAll('.remove').forEach(btn =>
    btn.addEventListener('click', e => {
      attachments.splice(e.target.dataset.i, 1);
      renderFiles();
    })
  );
}