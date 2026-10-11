// Carga del panel desde las tablas de Supabase

    async function loadDashboard(user = null) {
      try {
        if (!user) {
          const { data, error } = await supabaseClient.auth.getUser();
          if (error) throw error;
          user = data.user;
        }

        if (!user) {
          show('welcomeView');
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

        $('#patientName').textContent = profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'Paciente';
        if (typeof fillProfileForm === 'function') { currentProfileUser = user; fillProfileForm(user); }

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
