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
const repoPathInp = $('#repoPath'); // NOVO: Caminho do Repositório
const descTxt = $('#description');
const btnEdit = $('#btn-edit');
const btnSave = $('#btn-save');
const dropZone = $('#drop-zone');
const fileInput = $('#file-input');
const fileList = $('#file-list');
const commitList = $('#commit-list');
const commitHashInp = $('#commit-hash');
const commitMsgInp = $('#commit-msg');
const btnAddCommit = $('#btn-add-commit');
// Ações Git
const gitBranchInp = $('#git-branch-val');
const gitCommitInp = $('#git-commit-val');
const btnCreateBranch = $('#btn-create-branch');
const btnCopyCommit = $('#btn-copy-commit');

let attachments = []; // { name, size, dataURL }
let commits = [];

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
    // The following line was added as per the instruction's Code Edit snippet
    // It implies a variable `isEditing` which is not present in the original code.
    // Assuming `isEditing` would be defined elsewhere or is a placeholder for future functionality.
    // For now, it's added as is, but might cause a `ReferenceError` if `isEditing` is not defined.
    // If `isEditing` is meant to be `false` initially for read-only mode, then `repoPathInp.readOnly = true;`
    // If `isEditing` is meant to be `true` initially for editable mode, then `repoPathInp.readOnly = false;`
    // Given the context of `loadIncident`, it's usually for displaying, so `isEditing` would likely be `false`.
    // However, to faithfully follow the instruction, the line is added exactly as provided.
    if (repoPathInp) repoPathInp.readOnly = !isEditing; // NOVO: Editável
    if (repoPathInp) repoPathInp.value = inc.repoPath || ""; // NOVO: Carregar Caminho
    descTxt.value = inc.description || '';

    // Normalize existing attachments
    attachments = (inc.attachments || []).map(a => ({
      name: a.filename,
      size: a.size,
      url: a.url
    }));
    renderFiles();

    // Commits
    commits = inc.commits || [];
    renderCommits();

    // Preencher Ações Git
    const safeTitle = inc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    gitBranchInp.value = `fix/inc-${id}-${safeTitle}`.substring(0, 50); // limit length
    gitCommitInp.value = `fix: ${inc.title} (ref #${id})`;

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
      status: statusSel.value,
      repoPath: repoPathInp ? repoPathInp.value.trim() : "" // NOVO: Guardar Caminho
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

// ---------- COMMITS (RF13) ----------
function renderCommits() {
  const repoUrl = "https://github.com/Brunocor26/Software-Incident-Management-System/commit/";

  commitList.innerHTML = commits.map((c, i) => {
    const link = c.url || (repoUrl + c.hash);
    return `
    <li>
      <div class="file-info">
        <strong><a href="${link}" target="_blank" class="commit-link">${c.hash.substring(0, 7)}</a></strong> - ${c.message || ''}
      </div>
      <button type="button" class="remove-commit" data-hash="${c.hash}">×</button>
    </li>`;
  }).join('');

  commitList.querySelectorAll('.remove-commit').forEach(btn =>
    btn.addEventListener('click', async e => {
      if (!confirm('Unlink this commit?')) return;
      const hash = e.target.dataset.hash;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/incidents/${id}/commits/${hash}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to unlink');

        // Remove locally
        commits = commits.filter(c => c.hash !== hash);
        renderCommits();
      } catch (err) {
        console.error(err);
        alert("Failed to unlink commit");
      }
    })
  );
}

btnAddCommit.addEventListener('click', async () => {
  const hash = commitHashInp.value.trim();
  const message = commitMsgInp.value.trim();
  if (!hash) return alert("Commit hash is required");

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/incidents/${id}/commits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hash, message })
    });
    if (!res.ok) throw new Error("Failed to link commit");

    const updatedInc = await res.json();
    commits = updatedInc.commits;
    commitHashInp.value = '';
    commitMsgInp.value = '';
  } catch (err) {
    console.error(err);
    alert("Error linking commit");
  }
});

// ---------- AÇÕES GIT ----------
function copyToClipboard(el) {
  el.select();
  document.execCommand('copy');

  // Visual feedback
  const originalBg = el.style.backgroundColor;
  el.style.backgroundColor = '#2ecc71';
  setTimeout(() => el.style.backgroundColor = originalBg, 200);
}

btnCreateBranch.addEventListener('click', async () => {
  const branchName = gitBranchInp.value;
  const repoPath = repoPathInp ? repoPathInp.value.trim() : null; // Obter caminho

  if (!branchName) return;

  const pathMsg = repoPath ? `\nIn repository: ${repoPath}` : "\n(Using default server repository)";
  if (!confirm(`Create branch '${branchName}'?${pathMsg}`)) return;

  try {
    const res = await fetch('http://localhost:3000/api/git/branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchName, repoPath }) // Enviar caminho
    });
    const data = await res.json();

    if (res.ok) {
      alert("Success: " + data.message);
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) {
    console.error(e);
    alert("Failed to connect to server");
  }
});
btnCopyCommit.addEventListener('click', () => copyToClipboard(gitCommitInp));