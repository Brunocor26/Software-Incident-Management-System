document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('incident-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obter dados do formulário
    const formData = new FormData(form);
    const incident = {
      title: formData.get('title'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: formData.get('status'),
      description: formData.get('description') || '',
      createdAt: new Date().toISOString()
    };

    // Mostrar dados na consola
    console.log('New Incident:', incident);

    // Simular sucesso e redirecionar (mais para a frente aqui metemos um envio para base de dados)
    alert('Incident created successfully!');
    window.location.href = 'incidents.html';
  });
});


/*
guarda como
 New Incident: 
Object { title: "erro", priority: "high", category: "network", status: "open", description: "", createdAt: "2025-10-22T15:00:16.728Z" }
*/