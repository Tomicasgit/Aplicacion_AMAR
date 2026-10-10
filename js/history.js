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

    function renderWeeklySummary() {
      const container = $('#weeklySummary');
      if (!container) return;

      const today = new Date();
      const monday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const weekday = (monday.getDay() + 6) % 7;
      monday.setDate(monday.getDate() - weekday);

      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 7);

      const rows = heartReadings.filter(reading => {
        const date = new Date(reading.recorded_at);
        return !Number.isNaN(date.getTime()) &&
          date >= monday && date < sunday;
      });

      const values = rows
        .map(reading => Number(reading.lpm))
        .filter(value => Number.isFinite(value) && value > 0);

      const average = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : null;
      const minimum = values.length ? Math.min(...values) : null;
      const maximum = values.length ? Math.max(...values) : null;

      container.innerHTML = `
        <div class="calendar-stat">
          <small>Lecturas de la semana</small>
          <strong>${rows.length}</strong>
        </div>
        <div class="calendar-stat">
          <small>Promedio semanal</small>
          <strong>${average === null ? '—' : average + ' LPM'}</strong>
        </div>
        <div class="calendar-stat">
          <small>Mínimo semanal</small>
          <strong>${minimum === null ? '—' : minimum + ' LPM'}</strong>
        </div>
        <div class="calendar-stat">
          <small>Máximo semanal</small>
          <strong>${maximum === null ? '—' : maximum + ' LPM'}</strong>
        </div>
        ${rows.length ? '' : '<p class="empty">Todavía no hay mediciones registradas esta semana.</p>'}
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
      renderWeeklySummary();
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
