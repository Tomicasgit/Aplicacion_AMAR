// Mostrar todos los dispositivos del usuario autenticado
    async function loadDevices(userId) {
      const list = $('#devicesList');

      const { data, error } = await supabaseClient
        .from('devices')
        .select('id, name, status, last_seen_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data.length) {
        list.innerHTML = '<p class="empty">Todavía no registraste dispositivos.</p>';
        $('#deviceBadge').textContent = 'Sin dispositivo';
        return;
      }

      list.innerHTML = data.map(device => `
        <div class="record-item">
          <div class="record-info">
            <strong>${escapeHTML(device.name)}</strong>
            <small>Estado: ${escapeHTML(device.status || 'Sin estado')}</small>
            <br>
            <small>Última conexión: ${
              device.last_seen_at
                ? escapeHTML(new Date(device.last_seen_at).toLocaleString())
                : 'Sin conexión registrada'
            }</small>
          </div>
          <div class="record-actions">
            <button type="button" class="edit-button"
              onclick="editDevice('${device.id}')">Editar</button>
            <button type="button" class="delete-button"
              onclick="deleteDevice('${device.id}')">Eliminar</button>
          </div>
        </div>
      `).join('');

      $('#deviceBadge').textContent =
        `${data[0].name}: ${data[0].status || 'Sin estado'}`;
    }

// Abrir formulario para editar un dispositivo
    async function editDevice(id) {
      try {
        const { data: auth, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!auth.user) throw new Error('Tu sesión expiró.');

        const { data, error } = await supabaseClient
          .from('devices')
          .select('id, name')
          .eq('id', id)
          .eq('user_id', auth.user.id)
          .single();

        if (error) throw error;

        openModal(`
          <h2>Editar dispositivo</h2>
          <form id="editDeviceForm">
            <div class="field">
              <label for="editDeviceName">Nombre del dispositivo</label>
              <input id="editDeviceName" required maxlength="100"
                value="${escapeHTML(data.name)}">
            </div>
            <button class="primary" type="submit">Guardar cambios</button>
            <button class="secondary" type="button" onclick="closeModal()">Cancelar</button>
          </form>
        `);

        $('#editDeviceForm').onsubmit = async event => {
          event.preventDefault();
          const name = $('#editDeviceName').value.trim();
          if (!name) return alert('Ingresá un nombre.');

          const { error: updateError } = await supabaseClient
            .from('devices')
            .update({ name })
            .eq('id', id)
            .eq('user_id', auth.user.id);

          if (updateError) return alert(updateError.message);

          closeModal();
          await loadDashboard(auth.user);
        };
      } catch (error) {
        alert(error.message || 'No se pudo abrir el dispositivo.');
      }
    }

// Eliminar un dispositivo después de confirmar
    async function deleteDevice(id) {
      if (!confirm('¿Querés eliminar este dispositivo de tu cuenta?')) return;

      try {
        const { data: auth, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!auth.user) throw new Error('Tu sesión expiró.');

        const { error } = await supabaseClient
          .from('devices')
          .delete()
          .eq('id', id)
          .eq('user_id', auth.user.id);

        if (error) throw error;
        await loadDashboard(auth.user);
      } catch (error) {
        alert(error.message || 'No se pudo eliminar el dispositivo.');
      }
    }
