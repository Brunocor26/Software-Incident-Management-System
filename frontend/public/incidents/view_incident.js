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
    const res = await fetch(`/api/incidents/${id}`, {
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

    // Disable editing if incident is closed
    if (inc.status === "closed") {
      form.querySelectorAll('input,select,textarea').forEach(el => el.setAttribute('readonly', 'readonly'));
      form.querySelectorAll('select').forEach(el => el.disabled = true);
      btnEdit.disabled = true;
      dropZone.style.pointerEvents = 'none';
      dropZone.style.opacity = '0.5';
      fileInput.disabled = true;

      // Show message
      const msg = document.createElement('div');
      msg.style.cssText = 'background-color: #ffe6e6; color: #cc0000; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 4px solid #cc0000;';
      msg.textContent = '⚠️ Este incidente foi fechado e não pode ser modificado.';
      form.insertBefore(msg, form.firstChild);
    }

    // AI Suggestion
    if (["open", "in-progress"].includes(inc.status)) {
      const aiContainer = $('#ai-suggestion-container');
      const aiContent = $('#ai-suggestion-content');
      aiContainer.style.display = 'block';

      try {
        const aiRes = await fetch(`/api/incidents/${id}/ai-suggestion`, {
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

    // Init Git Sidebar with data
    initGitSidebar(inc);

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
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update status');
    }

    // 2. Upload new files
    const newFiles = attachments.filter(a => a.file);
    if (newFiles.length > 0) {
      const formData = new FormData();
      newFiles.forEach(a => formData.append('files', a.file));

      const resUpload = await fetch(`/api/incidents/${id}/attachments`, {
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
    alert('Error saving incident: ' + err.message);
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
      ? `<a href="${f.url}" target="_blank" class="view-link">View</a>`
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
          const res = await fetch(`/api/incidents/${id}/attachments/${file.name}`, {
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

// ---------- GIT INTEGRATION ----------
const btnCreateBranch = $('#btn-create-branch');
if (btnCreateBranch) {
  btnCreateBranch.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Auto-generate branch name: feature/INC-{id}-{slug}
    // Slug: title to lower, remove special chars, replace space with -
    const slug = titleInp.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 30); // limit length

    const branchName = prompt("Branch Name:", `feature/INC-${id}-${slug}`);
    if (!branchName) return;

    try {
      btnCreateBranch.disabled = true;
      btnCreateBranch.textContent = "Creating...";

      const res = await fetch('/api/git/create-branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ incidentId: id, branchName })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create branch');
      }

      const data = await res.json();
      alert(data.message);
      location.reload();

    } catch (e) {
      console.error(e);
      alert('Error: ' + e.message);
      btnCreateBranch.disabled = false;
    }
  });
}

const inpBranchName = $('#git-branch-name-input');
const inpCheckout = $('#git-checkout-cmd');
const inpCommit = $('#git-commit-cmd');
const btnLinkBranch = $('#btn-link-branch');
const msgLinked = $('#msg-linked');

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = '✅';
    setTimeout(() => btn.innerHTML = original, 2000);
  });
}

if (inpBranchName && $('#btn-copy-name')) $('#btn-copy-name').onclick = () => copyToClipboard(inpBranchName.value, $('#btn-copy-name'));
if (inpCheckout && $('#btn-copy-checkout')) $('#btn-copy-checkout').onclick = () => copyToClipboard(inpCheckout.value, $('#btn-copy-checkout'));
if (inpCommit && $('#btn-copy-commit')) $('#btn-copy-commit').onclick = () => copyToClipboard(inpCommit.value, $('#btn-copy-commit'));

function updateGitCommands() {
  const branch = inpBranchName.value.trim();
  inpCheckout.value = `git checkout -b ${branch}`;
  const incId = $('#incident-id').textContent || id;
  inpCommit.value = `git commit -m "INC-${incId} ${titleInp.value.substring(0, 50)}..."`;
}
if (inpBranchName) inpBranchName.addEventListener('input', updateGitCommands);

function initGitSidebar(incident) {
  if (!inpBranchName) return;

  if (incident.gitBranch) {
    inpBranchName.value = incident.gitBranch;
    inpBranchName.readOnly = true;
    inpBranchName.style.background = '#f3f4f6';
    inpBranchName.style.color = '#6b7280';

    if (btnLinkBranch) btnLinkBranch.style.display = 'none';
    if (msgLinked) msgLinked.style.display = 'block';
  } else {
    const slug = incident.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 40);
    inpBranchName.value = `feature/INC-${incident._id}-${slug}`;

    if (btnLinkBranch) btnLinkBranch.style.display = 'block';
    if (msgLinked) msgLinked.style.display = 'none';
  }
  updateGitCommands();
}

if (btnLinkBranch) {
  btnLinkBranch.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const branchName = inpBranchName.value.trim();
    if (!branchName || !token) return;

    try {
      btnLinkBranch.disabled = true;
      btnLinkBranch.textContent = "Linking...";

      const res = await fetch('/api/git/create-branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ incidentId: id, branchName })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      inpBranchName.readOnly = true;
      inpBranchName.style.background = '#f3f4f6';
      inpBranchName.style.color = '#6b7280';
      btnLinkBranch.style.display = 'none';
      msgLinked.style.display = 'block';

    } catch (e) {
      console.error(e);
      alert('Error: ' + e.message);
      btnLinkBranch.disabled = false;
      btnLinkBranch.textContent = "Link Branch Only";
    }
  });
}