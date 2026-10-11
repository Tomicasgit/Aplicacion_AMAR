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

// Atajos de navegación: escritorio y barra inferior móvil.
const deviceShortcuts = ['#addDevice', '#deviceQuickAction', '#mobileAddDevice'];
const contactShortcuts = ['#addContact', '#contactQuickAction', '#mobileAddContact'];
deviceShortcuts.forEach(selector => {
  const button = $(selector);
  if (button) button.addEventListener('click', () => {
    if (selector !== '#addDevice') $('#addDevice').click();
  });
});
contactShortcuts.forEach(selector => {
  const button = $(selector);
  if (button) button.addEventListener('click', () => {
    if (selector !== '#addContact') $('#addContact').click();
  });
});
const contactsQuickAction = $('#contactsQuickAction');
if (contactsQuickAction) contactsQuickAction.addEventListener('click', () => $('#addContact').click());

// Modal para vincular ESP32 por Bluetooth
$('#addDevice').onclick = () => openModal(`
  <h2 id="modalTitle">Vincular ESP32</h2>
  <p>Encendé tu dispositivo A.M.A.R. y asegurate de tenerlo cerca.</p>
  <form id="deviceForm">
    <div class="field"><label for="deviceName">Nombre del dispositivo en tu cuenta</label><input id="deviceName" value="ESP32 A.M.A.R." required></div>
    <button class="primary" type="submit">Conectar por Bluetooth <span>→</span></button>
    <button type="button" class="secondary" onclick="closeModal()">Cancelar</button>
  </form>
`);

// Modal para agregar contacto
$('#addContact').onclick = () => openModal(`
  <h2 id="modalTitle">Nuevo contacto</h2>
  <p>Agregá a una persona de confianza para tener sus datos a mano.</p>
  <form id="contactForm">
    <div class="field"><label for="contactName">Nombre</label><input id="contactName" autocomplete="name" required></div>
    <div class="field"><label for="contactPhone">Teléfono</label><input id="contactPhone" type="tel" autocomplete="tel" required></div>
    <div class="field"><label for="contactRelation">Relación</label><input id="contactRelation" placeholder="Ej. Madre"></div>
    <button class="primary" type="submit">Guardar contacto <span>→</span></button>
    <button type="button" class="secondary" onclick="closeModal()">Cancelar</button>
  </form>
`);

// Formularios de contactos y dispositivos mediante Supabase.
document.addEventListener('submit', async e => {
  if (e.target.id !== 'deviceForm' && e.target.id !== 'contactForm') return;
  e.preventDefault();
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"], button:not([type])');
  if (submitButton) submitButton.disabled = true;
  try {
    if (form.id === 'deviceForm') {
      const name = $('#deviceName').value.trim();
      if (!name) throw new Error('Ingresá un nombre para el dispositivo.');
      const connectedName = await window.connectAMARBluetooth(name);
      const safeName = escapeHTML(name);
      openModal(`
        <h2 id="modalTitle">ESP32 conectado</h2>
        <p><strong>${safeName}</strong> está conectado por Bluetooth.</p>
        <p>Dispositivo detectado: ${escapeHTML(connectedName)}</p>
        <p>Las lecturas válidas se enviarán a tu historial si Supabase permite guardarlas.</p>
        <button class="primary" onclick="closeModal();loadDashboard()">Entendido <span>→</span></button>
      `);
    }
    if (form.id === 'contactForm') {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
      const userId = authData.user.id;
      const name = $('#contactName').value.trim();
      const phone = $('#contactPhone').value.trim();
      const relationship = $('#contactRelation').value.trim();
      if (!name || !phone) throw new Error('Completá el nombre y el teléfono del contacto.');
      const { error } = await supabaseClient.from('emergency_contacts').insert({
        user_id: userId, name, phone, relationship: relationship || null
      });
      if (error) throw error;
      closeModal();
      await loadDashboard();
    }
  } catch (err) {
    alert(err.message || 'No se pudo guardar la información.');
  } finally {
    if (submitButton && submitButton.isConnected) submitButton.disabled = false;
  }
});

// Fecha, saludo y nombre visible. No se generan datos médicos ficticios.
function updateDashboardGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const title = $('#greetingTitle');
  const eyebrow = $('#dateEyebrow');
  const today = $('#todayLabel');
  if (title) title.textContent = greeting;
  if (eyebrow) eyebrow.textContent = now.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' }).toUpperCase();
  if (today) today.textContent = now.toLocaleDateString('es-AR', { day:'numeric', month:'long' });
}
function syncDashboardIdentity() {
  const patient = $('#patientName');
  const welcome = $('#welcomeName');
  const avatar = document.querySelector('.account-avatar');
  const topAvatar = $('.top-avatar');
  const name = patient?.textContent?.trim() || 'Paciente';
  if (welcome) welcome.textContent = name;
  const initial = [...name][0]?.toLocaleUpperCase('es-AR') || 'A';
  if (avatar) avatar.textContent = initial;
  if (topAvatar) topAvatar.textContent = initial;
}
updateDashboardGreeting();
document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.panel;
    document.querySelectorAll('.dashboard-section').forEach(section => {
      section.classList.toggle('active', section.id === target);
    });
    document.querySelectorAll('.nav [data-panel], .mobile-nav [data-panel]').forEach(item => {
      item.classList.toggle('active', item.dataset.panel === target);
    });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});
const originalLoadDashboard = window.loadDashboard;
window.loadDashboard = async function(...args) {
  const result = await originalLoadDashboard.apply(this, args);
  syncDashboardIdentity();
  const time = $('#readingTime');
  const secondary = $('#readingTimeSecondary');
  if (time && secondary) secondary.textContent = time.textContent;
  const badge = $('#deviceBadge');
  const chip = $('.live-chip');
  const liveLabel = $('#pulseLiveLabel');
  if (badge && chip && liveLabel) {
    const connected = /conectad|connected|online/i.test(badge.textContent);
    chip.classList.toggle('is-live', connected);
    liveLabel.textContent = connected ? 'Dispositivo activo' : 'En espera';
  }
  return result;
};

// Restaurar la sesión guardada por Supabase al abrir la página.
(async () => {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Error al recuperar la sesión:', error);
    show('loginView');
    return;
  }
  if (data.session) await loadDashboard(data.session.user);
  else show('loginView');
})();
