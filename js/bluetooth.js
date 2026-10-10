(() => {
  const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

  let bluetoothDevice = null;
  let characteristic = null;
  let databaseDeviceId = null;
  let currentUserId = null;
  let lastSeenUpdate = 0;
  let savingReading = false;
  let readingErrorShown = false;

  function setConnectionStatus(text) {
    const badge = document.querySelector('#deviceBadge');
    if (badge) badge.textContent = text;
  }

  function updateReading(data) {
    const bpm = document.querySelector('#bpm');
    const readingTime = document.querySelector('#readingTime');
    const heartState = document.querySelector('#heartState');

    if (Number.isFinite(data.lpm) && data.lpm > 0 && data.lpm <= 300) {
      if (bpm) bpm.textContent = String(data.lpm);
      if (readingTime) {
        readingTime.textContent = new Date().toLocaleTimeString('es-AR');
      }
      if (heartState) {
        heartState.textContent = data.sensor_state || 'Lectura recibida';
      }
    } else if (heartState && data.sensor_state) {
      heartState.textContent = data.sensor_state;
    }
  }

  async function saveReading(data) {
    if (
      !currentUserId ||
      !Number.isFinite(data.lpm) ||
      !Number.isInteger(data.lpm) ||
      data.lpm <= 0 ||
      data.lpm > 300 ||
      savingReading
    ) {
      return;
    }

    savingReading = true;

    try {
      const parsedDate = data.timestamp ? Date.parse(data.timestamp) : NaN;
      const recordedAt = Number.isFinite(parsedDate)
        ? new Date(parsedDate).toISOString()
        : new Date().toISOString();

      const { error } = await supabaseClient
        .from('heart_readings')
        .insert({
          user_id: currentUserId,
          lpm: data.lpm,
          recorded_at: recordedAt
        });

      if (error) throw error;

      readingErrorShown = false;

      const now = Date.now();
      if (databaseDeviceId && now - lastSeenUpdate >= 15000) {
        lastSeenUpdate = now;

        const { error: updateError } = await supabaseClient
          .from('devices')
          .update({ last_seen_at: new Date(now).toISOString() })
          .eq('id', databaseDeviceId)
          .eq('user_id', currentUserId);

        if (updateError) {
          console.error('No se pudo actualizar last_seen_at:', updateError);
        }
      }
    } catch (error) {
      console.error('Error al guardar la lectura en Supabase:', error);

      if (!readingErrorShown) {
        readingErrorShown = true;
        alert(
          'El ESP32 transmite datos, pero no se pudo guardar la lectura en Supabase. ' +
          'Revisá la consola del navegador para ver el error exacto.'
        );
      }
    } finally {
      savingReading = false;
    }
  }

  async function handleNotification(event) {
    const value = event.target.value;
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength
    );

    try {
      const json = new TextDecoder().decode(bytes);
      const data = JSON.parse(json);

      updateReading(data);
      await saveReading(data);
    } catch (error) {
      console.error('No se pudo interpretar la telemetría BLE:', error);
    }
  }

  async function handleDisconnect() {
    const disconnectedDeviceId = databaseDeviceId;
    const disconnectedUserId = currentUserId;
    const device = bluetoothDevice;

    characteristic?.removeEventListener(
      'characteristicvaluechanged',
      handleNotification
    );

    if (device) {
      device.removeEventListener(
        'gattserverdisconnected',
        handleDisconnect
      );
    }

    characteristic = null;
    databaseDeviceId = null;
    currentUserId = null;
    bluetoothDevice = null;
    setConnectionStatus('Desconectado');

    if (disconnectedDeviceId && disconnectedUserId) {
      try {
        const { error } = await supabaseClient
          .from('devices')
          .update({ status: 'offline' })
          .eq('id', disconnectedDeviceId)
          .eq('user_id', disconnectedUserId);

        if (error) {
          console.error('No se pudo actualizar el estado offline:', error);
        }
      } catch (error) {
        console.error('Error al actualizar el estado offline:', error);
      }
    }

    console.info('El ESP32 se desconectó.');

    if (typeof window.loadDashboard === 'function') {
      await window.loadDashboard();
    }
  }

  async function connectAMARBluetooth(displayName) {
    if (!navigator.bluetooth) {
      throw new Error(
        'Este navegador no admite Web Bluetooth. Usá Chrome o Edge en una página HTTPS.'
      );
    }

    // Debe ejecutarse directamente desde el clic del usuario.
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'A.M.A.R' }],
      optionalServices: [SERVICE_UUID]
    });

    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) {
      throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
    }

    currentUserId = authData.user.id;
    bluetoothDevice = device;

    device.addEventListener(
      'gattserverdisconnected',
      handleDisconnect
    );

    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      characteristic = await service.getCharacteristic(
        CHARACTERISTIC_UUID
      );

      const name = (displayName || 'ESP32 A.M.A.R').trim();

      const { data: existingDevice, error: searchError } =
        await supabaseClient
          .from('devices')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('name', name)
          .limit(1)
          .maybeSingle();

      if (searchError) throw searchError;

      if (existingDevice) {
        databaseDeviceId = existingDevice.id;

        const { error } = await supabaseClient
          .from('devices')
          .update({
            status: 'online',
            last_seen_at: new Date().toISOString()
          })
          .eq('id', databaseDeviceId)
          .eq('user_id', currentUserId);

        if (error) throw error;
      } else {
        const { data: newDevice, error } = await supabaseClient
          .from('devices')
          .insert({
            user_id: currentUserId,
            name,
            status: 'online',
            last_seen_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;
        databaseDeviceId = newDevice.id;
      }

      characteristic.addEventListener(
        'characteristicvaluechanged',
        handleNotification
      );

      await characteristic.startNotifications();

      setConnectionStatus('Conectado');
      console.info('Bluetooth conectado:', device.name);

      if (typeof window.loadDashboard === 'function') {
        await window.loadDashboard();
      }

      return device.name;
    } catch (error) {
      if (device.gatt.connected) device.gatt.disconnect();
      throw error;
    }
  }

  async function disconnectAMARBluetooth() {
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
    } else {
      await handleDisconnect();
    }
  }

  window.connectAMARBluetooth = connectAMARBluetooth;
  window.disconnectAMARBluetooth = disconnectAMARBluetooth;
})();
