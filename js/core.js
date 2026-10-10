const supabaseClient = window.supabase.createClient(
      window.AMAR_SUPABASE_URL,
      window.AMAR_SUPABASE_KEY
    );

    const $ = s => document.querySelector(s);

    function show(id) {
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
    }

    // Navegación interna entre Inicio e Historial.
    document.querySelectorAll('[data-panel]').forEach(button => {
      button.addEventListener('click', () => {
        const target = button.dataset.panel;

        document.querySelectorAll('.dashboard-section').forEach(section => {
          section.classList.toggle('active', section.id === target);
        });

        document.querySelectorAll('.nav [data-panel]').forEach(item => {
          item.classList.toggle('active', item === button);
        });
      });
    });

    function message(id, text, isSuccess = false) {
      const el = $(id);
      el.textContent = text;
      el.className = isSuccess ? 'message success' : 'message';
    }

    function openModal(html) {
      $('#modalContent').innerHTML = html;
      $('#modal').classList.add('show');
    }

    function closeModal() {
      $('#modal').classList.remove('show');
    }

// Escapar texto antes de insertarlo en el HTML
    function escapeHTML(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char]));
    }
