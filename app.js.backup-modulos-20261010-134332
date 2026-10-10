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


async function editProfile() {
  try {
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
      alert('Debes iniciar sesión.');
      return;
    }

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    openModal(`
      <h2>Editar perfil</h2>
      <form id="editProfileForm">
        <label for="profileName">Nombre completo</label>
        <input
          id="profileName"
          type="text"
          maxlength="100"
          required
          placeholder="Tu nombre"
        >
        <div class="form-actions">
          <button type="button" class="secondary"
            onclick="closeModal()">Cancelar</button>
          <button type="submit" class="primary">Guardar cambios</button>
        </div>
        <p id="profileMessage" class="message"></p>
      </form>
    `);

    $('#profileName').value =
      profile?.name || user.user_metadata?.name || '';

    $('#editProfileForm').onsubmit = async event => {
      event.preventDefault();

      const name = $('#profileName').value.trim();

      if (!name) {
        message('#profileMessage', 'Ingresá tu nombre.');
        return;
      }

      const { error: saveError } = await supabaseClient
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (saveError) {
        console.error('Error al guardar el perfil:', saveError);
        message(
          '#profileMessage',
          'No se pudo guardar. Revisá las políticas de profiles.'
        );
        return;
      }

      closeModal();
      await loadDashboard(user);
    };
  } catch (error) {
    console.error('Error al editar el perfil:', error);
    alert('No se pudo abrir la edición del perfil.');
  }
}


    // Navegación entre vistas de login y registro
    document.querySelectorAll('[data-show]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        message('#loginMessage', '');
        message('#registerMessage', '');
        show(a.dataset.show);
      };
    });

    // Formulario de inicio de sesión con Supabase
    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      message('#loginMessage', '');

      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.textContent = 'Ingresando...';

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: $('#loginEmail').value.trim(),
          password: $('#loginPassword').value
        });

        if (error) throw error;

        message('#loginMessage', 'Ingreso correcto. Cargando panel...', true);
        await loadDashboard(data.user);
      } catch (err) {
        message('#loginMessage', err.message || 'No se pudo iniciar sesión.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    };

    // Formulario de registro con Supabase
    $('#registerForm').onsubmit = async e => {
      e.preventDefault();
      message('#registerMessage', '');

      const btn = $('#registerBtn');
      btn.disabled = true;
      btn.textContent = 'Creando cuenta...';

      const email = $('#registerEmail').value.trim();
      const name = $('#name').value.trim();
      const password = $('#registerPassword').value;

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (error) throw error;

        $('#loginEmail').value = email;

        if (data.session && data.user) {
          message('#registerMessage', 'Cuenta creada correctamente. Cargando panel...', true);
          await loadDashboard(data.user);
        } else {
          message(
            '#registerMessage',
            'Cuenta creada. Iniciá sesión con tu correo y contraseña.',
            true
          );
          show('loginView');
          message('#loginMessage', 'Ya podés ingresar con tu cuenta.', true);
        }
      } catch (err) {
        message('#registerMessage', err.message || 'No se pudo crear la cuenta.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
      }
    };

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

    let heartReadings = [];
    let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let selectedCalendarDate = localDateKey(new Date());

    function localDateKey(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    function dateFromKey(key) {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    function readingsForDate(key) {
      return heartReadings.filter(r => {
        const date = new Date(r.recorded_at);
        return !Number.isNaN(date.getTime()) && localDateKey(date) === key;
      });
    }

    function renderDailySummary() {
      const container = $('#dailySummary');
      if (!container) return;

      const today = localDateKey(new Date());
      const readings = readingsForDate(today);
      const values = readings
        .map(reading => Number(reading.lpm))
        .filter(value => Number.isFinite(value) && value > 0);

      const average = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : null;
      const minimum = values.length ? Math.min(...values) : null;
      const maximum = values.length ? Math.max(...values) : null;

      container.innerHTML = `
        <div class="calendar-stat">
          <small>Lecturas de hoy</small>
          <strong>${readings.length}</strong>
        </div>
        <div class="calendar-stat">
          <small>Promedio de hoy</small>
          <strong>${average === null ? '—' : average + ' LPM'}</strong>
        </div>
        <div class="calendar-stat">
          <small>Mínimo de hoy</small>
          <strong>${minimum === null ? '—' : minimum + ' LPM'}</strong>
        </div>
        <div class="calendar-stat">
          <small>Máximo de hoy</small>
          <strong>${maximum === null ? '—' : maximum + ' LPM'}</strong>
        </div>
        ${readings.length ? '' : '<p class="empty">Todavía no hay mediciones registradas hoy.</p>'}
      `;
    }

    function renderMonthlySummary() {
      const el = $('#calendarSummary');
      if (!el) return;

      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const rows = heartReadings.filter(r => {
        const d = new Date(r.recorded_at);
        return !Number.isNaN(d.getTime()) &&
          d.getFullYear() === year && d.getMonth() === month;
      });

      const days = new Set(rows.map(r => localDateKey(new Date(r.recorded_at))));
      const values = rows.map(r => Number(r.lpm)).filter(n => Number.isFinite(n) && n > 0);
      const avg = values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
      const min = values.length ? Math.min(...values) : null;
      const max = values.length ? Math.max(...values) : null;

      el.innerHTML = `
        <div class="calendar-stat"><small>Días con mediciones</small><strong>${days.size}</strong></div>
        <div class="calendar-stat"><small>Total de lecturas</small><strong>${rows.length}</strong></div>
        <div class="calendar-stat"><small>Promedio del mes</small><strong>${avg === null ? '—' : avg + ' LPM'}</strong></div>
        <div class="calendar-stat"><small>Mín. / Máx.</small><strong>${min === null ? '—' : min + ' / ' + max}</strong></div>
      `;
    }

    function renderSelectedDay() {
      const title = $('#selectedDateTitle');
      const container = $('#historyList');
      if (!title || !container) return;

      const date = dateFromKey(selectedCalendarDate);
      title.textContent = 'Mediciones del ' + date.toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const rows = readingsForDate(selectedCalendarDate)
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

      if (!rows.length) {
        container.innerHTML = '<p class="empty">No hay mediciones registradas para este día.</p>';
        return;
      }

      container.innerHTML = rows.map(r => {
        const date = new Date(r.recorded_at);
        const time = Number.isNaN(date.getTime())
          ? 'Hora no disponible'
          : date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        return `<div class="record-item"><div class="record-info">
          <strong>${escapeHTML(String(r.lpm))} LPM</strong>
          <small>${escapeHTML(time)}</small>
        </div></div>`;
      }).join('');
    }

    function renderCalendar() {
      const grid = $('#calendarGrid');
      const label = $('#calendarMonth');
      if (!grid || !label) return;

      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      label.textContent = calendarMonth.toLocaleDateString('es-AR', {
        month: 'long', year: 'numeric'
      });

      const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const offset = (new Date(year, month, 1).getDay() + 6) % 7;
      const total = new Date(year, month + 1, 0).getDate();
      const today = localDateKey(new Date());

      let html = weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');
      for (let i = 0; i < offset; i++) html += '<div aria-hidden="true"></div>';

      for (let day = 1; day <= total; day++) {
        const key = localDateKey(new Date(year, month, day));
        const hasData = readingsForDate(key).length > 0;
        const classes = [
          'calendar-day',
          hasData ? 'has-data' : '',
          key === selectedCalendarDate ? 'selected' : '',
          key === today ? 'today' : ''
        ].filter(Boolean).join(' ');

        html += `<button type="button" class="${classes}"
          data-calendar-date="${key}" aria-pressed="${key === selectedCalendarDate}">
          <span class="day-number">${day}</span><span class="day-indicator"></span>
        </button>`;
      }

      grid.innerHTML = html;
      renderMonthlySummary();
      renderSelectedDay();
    }

    async function loadHeartHistory(userId) {
      const container = $('#historyList');
      if (container) container.innerHTML = '<p class="empty">Cargando historial...</p>';

      const { data, error } = await supabaseClient
        .from('heart_readings')
        .select('lpm, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error al cargar el historial:', error);
        if (container) container.innerHTML = '<p class="empty">No se pudo cargar el historial.</p>';
        const summary = $('#calendarSummary');
        if (summary) summary.innerHTML = '<p class="empty">No se pudo cargar el resumen mensual.</p>';
        return;
      }

      heartReadings = data || [];
      selectedCalendarDate = localDateKey(new Date());
      calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      renderDailySummary();
      renderCalendar();
    }

    $('#prevMonth')?.addEventListener('click', () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
      selectedCalendarDate = localDateKey(calendarMonth);
      renderCalendar();
    });

    $('#nextMonth')?.addEventListener('click', () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
      selectedCalendarDate = localDateKey(calendarMonth);
      renderCalendar();
    });

    $('#calendarGrid')?.addEventListener('click', event => {
      const button = event.target.closest('[data-calendar-date]');
      if (!button) return;
      selectedCalendarDate = button.dataset.calendarDate;
      renderCalendar();
    });

    // Carga del panel desde las tablas de Supabase

    async function loadDashboard(user = null) {
      try {
        if (!user) {
          const { data, error } = await supabaseClient.auth.getUser();
          if (error) throw error;
          user = data.user;
        }

        if (!user) {
          show('loginView');
          return;
        }

        // Cargar las listas completas del usuario autenticado
        await Promise.all([
          loadDevices(user.id),
          loadContacts(user.id),
          loadHeartHistory(user.id)
        ]);

        const results = await Promise.all([

          supabaseClient
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle(),

          supabaseClient
            .from('heart_readings')
            .select('lpm, recorded_at')
            .eq('user_id', user.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabaseClient
            .from('devices')
            .select('name, status, last_seen_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabaseClient
            .from('emergency_contacts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          supabaseClient
            .from('alerts')
            .select('type, message, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabaseClient
            .from('locations')
            .select('latitude, longitude, recorded_at')
            .eq('user_id', user.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        for (const result of results) {
          if (result.error) throw result.error;
        }

        const [profile, reading, device, contacts, alertData, locationData] =
          results.map(result => result.data);

        $('#patientName').textContent =
          profile?.name || user.user_metadata?.name || 'Paciente';

        $('#bpm').textContent = reading?.lpm ?? '--';
        $('#readingTime').textContent = reading?.recorded_at
          ? new Date(reading.recorded_at).toLocaleString()
          : 'Sin datos';

        $('#contactsCount').textContent = results[3].count ?? 0;

        $('#deviceBadge').textContent = device
          ? `${device.name}: ${device.status}`
          : 'Sin dispositivo';

        $('#heartState').textContent = reading
          ? 'Última lectura recibida'
          : 'Esperando lecturas del dispositivo';

        $('#location').textContent = locationData
          ? `${locationData.latitude}, ${locationData.longitude} — ${new Date(locationData.recorded_at).toLocaleString()}`
          : 'Todavía no se recibió una ubicación.';

        $('#alert').textContent = alertData
          ? `${alertData.type}: ${alertData.message || 'Sin descripción'}`
          : 'No hay alertas registradas.';

        show('appView');
      } catch (err) {
        console.error('Error al cargar el panel:', err);
        message(
          '#loginMessage',
          'No se pudo cargar el panel: ' + (err.message || 'Error desconocido.')
        );
        show('loginView');
      }
    }

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
