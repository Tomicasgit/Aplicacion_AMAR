let currentProfileUser = null;
function applyUserTheme(theme = 'system') {
  const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
}
function fillProfileForm(user) {
  if (!user) return;
  const meta = user.user_metadata || {};
  $('#profileName').value = meta.name || meta.full_name || '';
  $('#profileEmail').value = user.email || '';
  $('#profilePhone').value = meta.phone || '';
  $('#profileBirthdate').value = meta.birthdate || '';
  $('#profileCity').value = meta.city || '';
  $('#profileTheme').value = ['light','dark','system'].includes(meta.theme) ? meta.theme : 'system';
  $('#profileHeading').textContent = meta.name || meta.full_name || 'Mi perfil';
  $('#profileAvatar').textContent = (meta.name || meta.full_name || user.email || 'A').trim().charAt(0).toUpperCase();
  applyUserTheme($('#profileTheme').value);
}
async function editProfile() {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) throw error;
  if (!data.user) return show('loginView');
  currentProfileUser = data.user; fillProfileForm(data.user); show('appView');
  document.querySelector('[data-panel="profileSection"]')?.click();
}
$('#profileForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentProfileUser) {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) return message('#profileMessage', 'No se pudo recuperar tu sesión.');
    currentProfileUser = data.user;
  }
  if (!currentProfileUser) return message('#profileMessage', 'Iniciá sesión para editar tu perfil.');
  const button = $('#profileForm button[type="submit"]'); button.disabled = true;
  message('#profileMessage', '');
  const name = $('#profileName').value.trim();
  const metadata = { ...currentProfileUser.user_metadata, name,
    phone: $('#profilePhone').value.trim(), birthdate: $('#profileBirthdate').value,
    city: $('#profileCity').value.trim(), theme: $('#profileTheme').value };
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ data: metadata });
    if (error) throw error;
    currentProfileUser = data.user || { ...currentProfileUser, user_metadata: metadata };
    const { error: profileError } = await supabaseClient.from('profiles').update({ name }).eq('id', currentProfileUser.id);
    if (profileError) console.warn('Datos de cuenta guardados; no se pudo sincronizar profiles.name:', profileError);
    applyUserTheme(metadata.theme);
    $('#patientName').textContent = name || 'Paciente';
    $('#profileHeading').textContent = name || 'Mi perfil';
    $('#profileAvatar').textContent = (name || currentProfileUser.email || 'A').trim().charAt(0).toUpperCase();
    message('#profileMessage', profileError ? 'Preferencias guardadas. El nombre puede tardar en actualizarse en el panel.' : 'Cambios guardados correctamente.', true);
  } catch (error) { message('#profileMessage', error.message || 'No se pudieron guardar los cambios.'); }
  finally { button.disabled = false; }
});
$('#profileTheme')?.addEventListener('change', event => applyUserTheme(event.target.value));
$('#resetProfile')?.addEventListener('click', async () => {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data.user) return message('#profileMessage', 'No se pudo recuperar tu perfil.');
  currentProfileUser = data.user; fillProfileForm(data.user); message('#profileMessage', '');
});
window.addEventListener('DOMContentLoaded', async () => {
  const { data } = await supabaseClient.auth.getUser();
  if (data?.user) { currentProfileUser = data.user; fillProfileForm(data.user); }
});
