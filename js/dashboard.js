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

        // La tarjeta principal solo representa mediciones del día local actual.
        // Una lectura de ayer puede seguir en el historial, pero no debe mostrarse como actual.
        const now = new Date();
        const recordedAt = reading?.recorded_at ? new Date(reading.recorded_at) : null;
        const hasReadingToday = Boolean(
          recordedAt &&
          !Number.isNaN(recordedAt.getTime()) &&
          recordedAt.getFullYear() === now.getFullYear() &&
          recordedAt.getMonth() === now.getMonth() &&
          recordedAt.getDate() === now.getDate()
        );
        const todayReading = hasReadingToday ? reading : null;

        $('#bpm').textContent = todayReading?.lpm ?? '0';
        $('#readingTime').textContent = todayReading?.recorded_at
          ? new Date(todayReading.recorded_at).toLocaleString('es-AR')
          : 'Sin mediciones hoy';

        $('#contactsCount').textContent = results[3].count ?? 0;

        $('#deviceBadge').textContent = device
          ? `${device.name}: ${device.status}`
          : 'Sin dispositivo';

        $('#heartState').textContent = todayReading
          ? 'Última lectura recibida hoy'
          : 'Todavía no hay mediciones de hoy';

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
