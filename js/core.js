const supabaseClient = window.supabase.createClient(
      window.AMAR_SUPABASE_URL,
      window.AMAR_SUPABASE_KEY
    );

    const $ = s => document.querySelector(s);

    // Cambia de vista como una SPA: solo una vista principal queda activa.
    function show(id) {
      document.querySelectorAll('.view').forEach(view => {
        const active = view.id === id;
        view.classList.toggle('active', active);
        view.setAttribute('aria-hidden', String(!active));
      });
    }

    // Navegación interna entre las secciones del panel.
    document.querySelectorAll('[data-panel]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));

      button.addEventListener('click', () => {
        const target = button.dataset.panel;

        document.querySelectorAll('.dashboard-section').forEach(section => {
          const active = section.id === target;
          section.classList.toggle('active', active);
          section.setAttribute('aria-hidden', String(!active));
        });

        document.querySelectorAll('.nav [data-panel]').forEach(item => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });

        const title = document.querySelector('.top-heading h1');
        const description = document.querySelector('.top-heading p');
        if (title && description) {
          const isHistory = target === 'historySection';
          title.textContent = isHistory ? 'Seguimiento cardíaco' : 'Tu panel de salud';
          description.textContent = isHistory
            ? 'Revisá las mediciones guardadas y consultá tu evolución por fecha.'
            : 'Consultá tus lecturas y el estado de tu dispositivo A.M.A.R.';
        }

        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
