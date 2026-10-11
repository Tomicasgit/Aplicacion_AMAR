let currentProfileUser = null;
function fillProfileForm(user) {
  if (!user) return;
  currentProfileUser = user;
  const meta = user.user_metadata || {};
  $('#profileName').value = meta.name || meta.full_name || '';
  $('#profileEmail').value = user.email || '';
  $('#profilePhone').value = meta.phone || '';
  $('#profileBirthdate').value = meta.birthdate || '';
  $('#profileCity').value = meta.city || '';
  $('#profileHeading').textContent = meta.name || meta.full_name || 'Mi perfil';
  $('#profileAvatar').textContent = (meta.name || meta.full_name || user.email || 'A').trim().charAt(0).toUpperCase();
  const avatarUrl = meta.avatar_url || '';
  $('#profileAvatarImage').hidden = !avatarUrl;
  $('#profileAvatarImage').src = avatarUrl;
  $('#profileAvatar').hidden = Boolean(avatarUrl);
}
async function editProfile() {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) throw error;
  if (!data.user) return show('loginView');
  fillProfileForm(data.user); show('appView');
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
  const button = $('#profileForm button[type="submit"]'); button.disabled = true; message('#profileMessage', '');
  const name = $('#profileName').value.trim();
  const metadata = { ...currentProfileUser.user_metadata, name, phone: $('#profilePhone').value.trim(),
    birthdate: $('#profileBirthdate').value, city: $('#profileCity').value.trim() };
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ data: metadata });
    if (error) throw error;
    currentProfileUser = data.user || { ...currentProfileUser, user_metadata: metadata };
    const { error: profileError } = await supabaseClient.from('profiles').update({ name }).eq('id', currentProfileUser.id);
    if (profileError) console.warn('Datos de cuenta guardados; no se pudo sincronizar profiles.name:', profileError);
    $('#patientName').textContent = name || 'Paciente';
    $('#profileHeading').textContent = name || 'Mi perfil';
    $('#profileAvatar').textContent = (name || currentProfileUser.email || 'A').trim().charAt(0).toUpperCase();
    message('#profileMessage', profileError ? 'Datos guardados en la cuenta; el panel puede tardar en sincronizar el nombre.' : 'Cambios guardados correctamente.', true);
  } catch (error) { message('#profileMessage', error.message || 'No se pudieron guardar los cambios.'); }
  finally { button.disabled = false; }
});
$('#uploadProfilePhoto')?.addEventListener('click', async () => {
  const file = $('#profilePhotoFile').files[0];
  if (!file) return message('#profileMessage', 'Elegí una imagen antes de guardarla.');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return message('#profileMessage', 'Usá una imagen JPG, PNG o WebP.');
  if (file.size > 3 * 1024 * 1024) return message('#profileMessage', 'La imagen supera el límite de 3 MB.');
  const button = $('#uploadProfilePhoto'); button.disabled = true; button.textContent = 'Subiendo foto…';
  try {
    if (!currentProfileUser) {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      currentProfileUser = data.user;
    }
    if (!currentProfileUser) throw new Error('Iniciá sesión para cambiar tu foto.');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = currentProfileUser.id + '/profile.' + extension;
    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabaseClient.storage.from('avatars').getPublicUrl(path);
    const avatar_url = publicData.publicUrl + '?v=' + Date.now();
    const { data, error } = await supabaseClient.auth.updateUser({ data: { avatar_url } });
    if (error) throw error;
    currentProfileUser = data.user || currentProfileUser;
    fillProfileForm(currentProfileUser);
    message('#profileMessage', 'Foto de perfil actualizada.', true);
  } catch (error) {
    message('#profileMessage', error.message || 'No se pudo guardar la foto. Revisá la configuración del bucket avatars en Supabase.');
  } finally { button.disabled = false; button.textContent = 'Guardar foto'; }
});
$('#resetProfile')?.addEventListener('click', async () => {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data.user) return message('#profileMessage', 'No se pudo recuperar tu perfil.');
  fillProfileForm(data.user); message('#profileMessage', '');
});
window.addEventListener('DOMContentLoaded', async () => {
  const { data } = await supabaseClient.auth.getUser();
  if (data?.user) fillProfileForm(data.user);
});
