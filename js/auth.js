// Navegación entre bienvenida, inicio de sesión y registro.
document.querySelectorAll('[data-show]').forEach(button => button.addEventListener('click', event => {
  const target = button.dataset.show;
  if (!target) return;
  if (button.tagName === 'A') event.preventDefault();
  message('#loginMessage', ''); message('#registerMessage', '');
  show(target);
}));

// Google OAuth necesita estar habilitado en Supabase y tener la URL publicada autorizada.
document.querySelectorAll('[data-google-login]').forEach(button => button.addEventListener('click', async () => {
  const original = button.innerHTML;
  button.disabled = true; button.textContent = 'Conectando con Google…';
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] }
    });
    if (error) throw error;
  } catch (error) {
    message(document.querySelector('#registerView.active') ? '#registerMessage' : '#loginMessage',
      error.message || 'No se pudo iniciar con Google.');
    button.disabled = false; button.innerHTML = original;
  }
}));

$('#loginForm').onsubmit = async event => {
  event.preventDefault(); message('#loginMessage', '');
  const button = $('#loginBtn'); button.disabled = true; button.textContent = 'Ingresando…';
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: $('#loginEmail').value.trim(), password: $('#loginPassword').value
    });
    if (error) throw error;
    message('#loginMessage', 'Ingreso correcto. Cargando panel…', true);
    await loadDashboard(data.user);
  } catch (error) { message('#loginMessage', error.message || 'No se pudo iniciar sesión.'); }
  finally { button.disabled = false; button.textContent = 'Ingresar'; }
};

$('#registerForm').onsubmit = async event => {
  event.preventDefault(); message('#registerMessage', '');
  const button = $('#registerBtn'); button.disabled = true; button.textContent = 'Creando cuenta…';
  const email = $('#registerEmail').value.trim(), name = $('#name').value.trim();
  const password = $('#registerPassword').value;
  const metadata = { name, phone: $('#registerPhone').value.trim(),
    birthdate: $('#registerBirthdate').value, city: $('#registerCity').value.trim(), theme: 'system' };
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: metadata } });
    if (error) throw error;
    $('#loginEmail').value = email;
    if (data.session && data.user) {
      message('#registerMessage', 'Cuenta creada. Preparando tu espacio…', true);
      await loadDashboard(data.user);
    } else {
      show('loginView');
      message('#loginMessage', 'Cuenta creada. Revisá tu correo si se solicita confirmación y después iniciá sesión.', true);
    }
  } catch (error) { message('#registerMessage', error.message || 'No se pudo crear la cuenta.'); }
  finally { button.disabled = false; button.textContent = 'Crear cuenta'; }
};
