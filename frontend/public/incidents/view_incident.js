// ---------- UTILS ----------
const $ = q => document.querySelector(q);
const params = new URLSearchParams(location.search);
const id = params.get('id');
if (!id) location.href = 'incidents.html';

// ---------- ELEMENTS ----------
const form        = $('#incident-form');
const titleInp    = $('#title');
const prioritySel = $('#priority');
const categorySel = $('#category');
const statusSel   = $('#status');
const descTxt     = $('#description');
const btnEdit     = $('#btn-edit');
const btnSave     = $('#btn-save');
const dropZone    = $('#drop-zone');
const fileInput   = $('#file-input');
const fileList    = $('#file-list');

let attachments = []; // { name, size, dataURL }

// ---------- LOAD INCIDENT ----------
function loadIncident() {
  const all = JSON.parse(localStorage.getItem('incidents') || '[]');
  const inc = all.find(i => i.id == id);
  if (!inc) { alert('Incident not found'); location.href = 'incidents.html'; return; }

  $('#incident-id').textContent = id;
  titleInp.value      = inc.title;
  prioritySel.value   = inc.priority;
  categorySel.value   = inc.category;
  statusSel.value     = inc.status;
  descTxt.value       = inc.description || '';
  attachments         = inc.attachments || [];
  renderFiles();
}
loadIncident();

// ---------- EDIT / SAVE ----------
btnEdit.addEventListener('click', () => {
  form.querySelectorAll('input,select,textarea').forEach(el => el.removeAttribute('readonly'));
  form.querySelectorAll('select').forEach(el => el.disabled = false);
  btnSave.disabled = false;
  btnEdit.disabled = true;
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const all = JSON.parse(localStorage.getItem('incidents') || '[]');
  const idx = all.findIndex(i => i.id == id);
  if (idx === -1) return;

  all[idx] = {
    ...all[idx],
    title:       titleInp.value.trim(),
    priority:    prioritySel.value,
    category:    categorySel.value,
    status:      statusSel.value,
    description: descTxt.value.trim(),
    attachments
  };
  localStorage.setItem('incidents', JSON.stringify(all));
  alert('Saved!');
  location.reload();
});

// ---------- ATTACHMENTS ----------
dropZone.addEventListener('click', () => fileInput.click());
['dragenter','dragover','dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); })
);
['dragenter','dragover'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.add('drag-active'))
);
['dragleave','drop'].forEach(evt =>
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
      <span>${f.name} (${(f.size/1024).toFixed(1)} KB)</span>
      <button type="button" class="remove" data-i="${i}">×</button>
    </li>`).join('');
  fileList.querySelectorAll('.remove').forEach(btn =>
    btn.addEventListener('click', e => {
      attachments.splice(e.target.dataset.i, 1);
      renderFiles();
    })
  );
}