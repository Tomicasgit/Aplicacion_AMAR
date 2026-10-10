// Cerrar sesión en Supabase
    $('#logout').onclick = async () => {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        message('#loginMessage', error.message);
        return;
      }

      message('#loginMessage', 'Sesión cerrada correctamente.', true);
      show('loginView');
    };

    // Modal para vincular ESP32
    $('#addDevice').onclick = () => openModal(`
      <h2>Vincular ESP32</h2>
      <p>Registrá el dispositivo en tu cuenta. La conexión con el ESP32 se integrará mediante Bluetooth desde el navegador.</p>
      <form id="deviceForm">
        <div class="field">
          <label>Nombre del dispositivo</label>
          <input id="deviceName" value="ESP32 A.M.A.R." required>
        </div>
        <button class="primary">Generar clave</button>
        <button type="button" class="secondary" onclick="closeModal()">Cancelar</button>
      </form>
    `);

    // Modal para agregar contacto
    $('#addContact').onclick = () => openModal(`
      <h2>Nuevo contacto</h2>
      <form id="contactForm">
        <div class="field">
          <label>Nombre</label>
          <input id="contactName" required>
        </div>
        <div class="field">
          <label>Teléfono</label>
          <input id="contactPhone" required>
        </div>
        <div class="field">
          <label>Relación</label>
          <input id="contactRelation" placeholder="Ej. Madre">
        </div>
        <button class="primary">Guardar contacto</button>
        <button type="button" class="secondary" onclick="closeModal()">Cancelar</button>
      </form>
    `);

    // Formularios de contactos y dispositivos mediante Supabase
    document.addEventListener('submit', async e => {
      if (e.target.id !== 'deviceForm' && e.target.id !== 'contactForm') {
        return;
      }

      e.preventDefault();

      const form = e.target;
      const submitButton = form.querySelector('button[type="submit"], button:not([type])');

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const { data: authData, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!authData.user) throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');

        const userId = authData.user.id;

        if (form.id === 'deviceForm') {
          const name = $('#deviceName').value.trim();

          if (!name) throw new Error('Ingresá un nombre para el dispositivo.');

          const { data, error } = await supabaseClient
            .from('devices')
            .insert({
              user_id: userId,
              name,
              status: 'offline'
            })
            .select('id, name, status')
            .single();

          if (error) throw error;

          openModal(`
            <h2>Dispositivo registrado</h2>
            <p><strong>${data.name.replace(/[&<>"']/g, c => ({
              '&': '&amp;', '<': '&lt;', '>': '&gt;',
              '"': '&quot;', "'": '&#39;'
            }[c]))}</strong> quedó asociado a tu cuenta.</p>
            <p>Estado inicial: sin conexión.</p>
            <p>La vinculación Bluetooth se implementará en el siguiente paso.</p>
            <button class="primary" onclick="closeModal();loadDashboard()">Entendido</button>
          `);
        }

        if (form.id === 'contactForm') {
          const name = $('#contactName').value.trim();
          const phone = $('#contactPhone').value.trim();
          const relationship = $('#contactRelation').value.trim();

          if (!name || !phone) {
            throw new Error('Completá el nombre y el teléfono del contacto.');
          }

          const { error } = await supabaseClient
            .from('emergency_contacts')
            .insert({
              user_id: userId,
              name,
              phone,
              relationship: relationship || null
            });

          if (error) throw error;

          closeModal();
          await loadDashboard();
        }
      } catch (err) {
        alert(err.message || 'No se pudo guardar la información.');
      } finally {
        if (submitButton && submitButton.isConnected) {
          submitButton.disabled = false;
        }
      }
    });

    // Restaurar la sesión guardada por Supabase al abrir la página
    (async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Error al recuperar la sesión:', error);
        show('loginView');
        return;
      }

      if (data.session) {
        await loadDashboard(data.session.user);
      } else {
        show('loginView');
      }
    })();
