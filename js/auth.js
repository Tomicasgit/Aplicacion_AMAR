// Supabase Auth: navegación SPA entre bienvenida, acceso y registro.
document.querySelectorAll('[data-google-login]').forEach(button => button.addEventListener('click', async () => {
  const original = button.innerHTML;
  const targetMessage = document.querySelector('#registerView.active') ? '#registerMessage' : '#loginMessage';
  message(targetMessage, 'Conectando con Google…', true);
  document.querySelectorAll('[data-google-login]').forEach(item => { item.disabled = true; });
  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } }
    });
    if (error) throw error;
  } catch (error) {
    message(targetMessage, error.message || 'No se pudo iniciar con Google. Verificá que Google esté habilitado en Supabase.');
    document.querySelectorAll('[data-google-login]').forEach(item => { item.disabled = false; });
    button.innerHTML = original;
  }
}));
$('#loginForm').onsubmit = async event => {
  event.preventDefault(); message('#loginMessage', '');
  const button = $('#loginBtn'); button.disabled = true; button.textContent = 'Ingresando…';
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: $('#loginEmail').value.trim(), password: $('#loginPassword').value });
    if (error) throw error;
    await loadDashboard(data.user);
  } catch (error) { message('#loginMessage', error.message || 'No se pudo iniciar sesión.'); }
  finally { button.disabled = false; button.textContent = 'Ingresar'; }
};
$('#registerForm').onsubmit = async event => {
  event.preventDefault(); message('#registerMessage', '');
  const button = $('#registerBtn'); button.disabled = true; button.textContent = 'Creando cuenta…';
  const email = $('#registerEmail').value.trim(), name = $('#name').value.trim(), password = $('#registerPassword').value;
  const metadata = { name, phone: $('#registerPhone').value.trim(), birthdate: $('#registerBirthdate').value, city: $('#registerCity').value.trim() };
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: metadata } });
    if (error) throw error;
    $('#loginEmail').value = email;
    if (data.session && data.user) { await loadDashboard(data.user); }
    else {
      show('loginView');
      message('#loginMessage', 'Cuenta creada. Revisá tu correo si se solicita confirmación y después iniciá sesión.', true);
    }
  } catch (error) { message('#registerMessage', error.message || 'No se pudo crear la cuenta.'); }
  finally { button.disabled = false; button.textContent = 'Crear cuenta'; }
};
