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
