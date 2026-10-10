// Mostrar todos los contactos de emergencia
    async function loadContacts(userId) {
      const list = $('#contactsList');

      const { data, error } = await supabaseClient
        .from('emergency_contacts')
        .select('id, name, phone, relationship')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      $('#contactsCount').textContent = data.length;

      if (!data.length) {
        list.innerHTML = '<p class="empty">Todavía no agregaste contactos.</p>';
        return;
      }

      list.innerHTML = data.map(contact => `
        <div class="record-item">
          <div class="record-info">
            <strong>${escapeHTML(contact.name)}</strong>
            <small>Teléfono: ${escapeHTML(contact.phone)}</small>
            <br>
            <small>Relación: ${escapeHTML(contact.relationship || 'No especificada')}</small>
          </div>
          <div class="record-actions">
            <button type="button" class="edit-button"
              onclick="editContact('${contact.id}')">Editar</button>
            <button type="button" class="delete-button"
              onclick="deleteContact('${contact.id}')">Eliminar</button>
          </div>
        </div>
      `).join('');
    }

// Abrir formulario para editar un contacto
    async function editContact(id) {
      try {
        const { data: auth, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!auth.user) throw new Error('Tu sesión expiró.');

        const { data, error } = await supabaseClient
          .from('emergency_contacts')
          .select('id, name, phone, relationship')
          .eq('id', id)
          .eq('user_id', auth.user.id)
          .single();

        if (error) throw error;

        openModal(`
          <h2>Editar contacto</h2>
          <form id="editContactForm">
            <div class="field">
              <label for="editContactName">Nombre</label>
              <input id="editContactName" required maxlength="100"
                value="${escapeHTML(data.name)}">
            </div>
            <div class="field">
              <label for="editContactPhone">Teléfono</label>
              <input id="editContactPhone" type="tel" required maxlength="40"
                value="${escapeHTML(data.phone)}">
            </div>
            <div class="field">
              <label for="editContactRelation">Relación</label>
              <input id="editContactRelation" maxlength="100"
                value="${escapeHTML(data.relationship || '')}">
            </div>
            <button class="primary" type="submit">Guardar cambios</button>
            <button class="secondary" type="button" onclick="closeModal()">Cancelar</button>
          </form>
        `);

        $('#editContactForm').onsubmit = async event => {
          event.preventDefault();

          const name = $('#editContactName').value.trim();
          const phone = $('#editContactPhone').value.trim();
          const relationship = $('#editContactRelation').value.trim();

          if (!name || !phone) {
            return alert('Completá el nombre y el teléfono.');
          }

          const { error: updateError } = await supabaseClient
            .from('emergency_contacts')
            .update({ name, phone, relationship: relationship || null })
            .eq('id', id)
            .eq('user_id', auth.user.id);

          if (updateError) return alert(updateError.message);

          closeModal();
          await loadDashboard(auth.user);
        };
      } catch (error) {
        alert(error.message || 'No se pudo abrir el contacto.');
      }
    }

// Eliminar un contacto después de confirmar
    async function deleteContact(id) {
      if (!confirm('¿Querés eliminar este contacto de emergencia?')) return;

      try {
        const { data: auth, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!auth.user) throw new Error('Tu sesión expiró.');

        const { error } = await supabaseClient
          .from('emergency_contacts')
          .delete()
          .eq('id', id)
          .eq('user_id', auth.user.id);

        if (error) throw error;
        await loadDashboard(auth.user);
      } catch (error) {
        alert(error.message || 'No se pudo eliminar el contacto.');
      }
    }
