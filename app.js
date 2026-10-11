// Cerrar sesión en Supabase
    $('#logout').onclick = async () => {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        message('#loginMessage', error.message);
        return;
      }

      message('#loginMessage', 'Sesión cerrada correctamente.', true);
      show('welcomeView');
    };

    // Modal para vincular ESP32 por Bluetooth
    $('#addDevice').onclick = () => openModal(`
      <h2>Vincular ESP32</h2>
      <p>Encendé tu dispositivo A.M.A.R. y asegurate de tenerlo cerca.</p>
      <form id="deviceForm">
        <div class="field">
          <label>Nombre del dispositivo en tu cuenta</label>
          <input id="deviceName" value="ESP32 A.M.A.R." required>
        </div>
        <button class="primary">Conectar por Bluetooth</button>
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
          <input id="contactPhone" type="tel" required maxlength="40">
        </div>
        <div class="field">
          <label>Correo electrónico (opcional)</label>
          <input id="contactEmail" type="email" maxlength="254" placeholder="contacto@correo.com">
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
        if (form.id === 'deviceForm') {
          const name = $('#deviceName').value.trim();

          if (!name) {
            throw new Error('Ingresá un nombre para el dispositivo.');
          }

          const connectedName = await window.connectAMARBluetooth(name);
          const safeName = name.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
          }[c]));

          openModal(`
            <h2>ESP32 conectado</h2>
            <p><strong>${safeName}</strong> está conectado por Bluetooth.</p>
            <p>Dispositivo detectado: ${connectedName}</p>
            <p>Las lecturas válidas se enviarán a tu historial si Supabase permite guardarlas.</p>
            <button class="primary" onclick="closeModal();loadDashboard()">Entendido</button>
          `);
        }

        if (form.id === 'contactForm') {
          const { data: authData, error: authError } =
            await supabaseClient.auth.getUser();

          if (authError) throw authError;
          if (!authData.user) {
            throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
          }

          const userId = authData.user.id;
          const name = $('#contactName').value.trim();
          const phone = $('#contactPhone').value.trim();
          const relationship = $('#contactRelation').value.trim();
          const email = $('#contactEmail').value.trim();

          if (!name || !phone) {
            throw new Error('Completá el nombre y el teléfono del contacto.');
          }

          const { error } = await supabaseClient
            .from('emergency_contacts')
            .insert({
              user_id: userId,
              name,
              phone,
              email: email || null,
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
        show('welcomeView');
        return;
      }

      if (data.session) {
        await loadDashboard(data.session.user);
      } else {
        show('welcomeView');
      }
    })();
