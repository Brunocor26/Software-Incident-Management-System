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

    // Normalize existing attachments
    attachments = (inc.attachments || []).map(a => ({
      name: a.filename,
      size: a.size,
      url: a.url
    }));
    renderFiles();

    // AI Suggestion
    if (["open", "in-progress"].includes(inc.status)) {
      const aiContainer = $('#ai-suggestion-container');
      const aiContent = $('#ai-suggestion-content');
      aiContainer.style.display = 'block';

      try {
        const aiRes = await fetch(`http://localhost:3000/api/incidents/${id}/ai-suggestion`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiContent.innerHTML = aiData.suggestion;
        } else {
          aiContent.textContent = "Unable to load suggestion.";
        }
      } catch (e) {
        console.error("Error loading AI suggestion:", e);
        aiContent.textContent = "Error loading suggestion.";
      }
    }

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
      status: statusSel.value
    };

    // 1. Update incident fields
    const res = await fetch(`http://localhost:3000/api/incidents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Failed to update status');

    // 2. Upload new files
    const newFiles = attachments.filter(a => a.file);
    if (newFiles.length > 0) {
      const formData = new FormData();
      newFiles.forEach(a => formData.append('files', a.file));

      const resUpload = await fetch(`http://localhost:3000/api/incidents/${id}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!resUpload.ok) throw new Error('Failed to upload files');
    }

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
      attachments.push({ name: f.name, size: f.size, dataURL: reader.result, file: f });
      renderFiles();
    };
    reader.readAsDataURL(f);
  });
}

function renderFiles() {
  fileList.innerHTML = attachments.map((f, i) => {
    const isExisting = !f.file; // If no file object, it's from DB
    const viewLink = isExisting
      ? `<a href="http://localhost:3000${f.url}" target="_blank" class="view-link">View</a>`
      : '<span class="new-badge">New</span>';

    return `
    <li>
      <div class="file-info">
        <span>${f.name} (${(f.size / 1024).toFixed(1)} KB)</span>
        ${viewLink}
      </div>
      <button type="button" class="remove" data-i="${i}">×</button>
    </li>`;
  }).join('');

  fileList.querySelectorAll('.remove').forEach(btn =>
    btn.addEventListener('click', async e => {
      const i = e.target.dataset.i;
      const file = attachments[i];

      if (file.file) {
        // It's a new file, just remove from array
        attachments.splice(i, 1);
        renderFiles();
      } else {
        // It's an existing file, confirm and delete from server
        if (!confirm(`Delete attachment "${file.name}"?`)) return;

        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:3000/api/incidents/${id}/attachments/${file.name}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) throw new Error('Failed to delete attachment');

          attachments.splice(i, 1);
          renderFiles();
        } catch (err) {
          console.error(err);
          alert('Error deleting attachment');
        }
      }
    })
  );
}