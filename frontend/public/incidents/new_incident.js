// ---------- UTILS ----------
const $ = q => document.querySelector(q);

// ---------- FORM ----------
const form = $('#new-incident-form');

form.addEventListener('submit', e => {
  e.preventDefault();

  // basic validation
  if (!form.checkValidity()) { form.reportValidity(); return; }

  // build object
  const newInc = {
    id: Date.now(), // simple ID
    title: form.title.value.trim(),
    priority: form.priority.value,
    category: form.category.value,
    status: form.status.value,
    description: form.description.value.trim(),
    attachments: [] // vazio por default
  };

  // save to localStorage (substituir por fetch depois)
  const incidents = JSON.parse(localStorage.getItem('incidents') || '[]');
  incidents.push(newInc);
  localStorage.setItem('incidents', JSON.stringify(incidents));

  // redirect
  location.href = 'incidents.html';
});