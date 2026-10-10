// Navegación entre vistas de login y registro
    document.querySelectorAll('[data-show]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        message('#loginMessage', '');
        message('#registerMessage', '');
        show(a.dataset.show);
      };
    });

    // Formulario de inicio de sesión con Supabase
    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      message('#loginMessage', '');

      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.textContent = 'Ingresando...';

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: $('#loginEmail').value.trim(),
          password: $('#loginPassword').value
        });

        if (error) throw error;

        message('#loginMessage', 'Ingreso correcto. Cargando panel...', true);
        await loadDashboard(data.user);
      } catch (err) {
        message('#loginMessage', err.message || 'No se pudo iniciar sesión.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    };

    // Formulario de registro con Supabase
    $('#registerForm').onsubmit = async e => {
      e.preventDefault();
      message('#registerMessage', '');

      const btn = $('#registerBtn');
      btn.disabled = true;
      btn.textContent = 'Creando cuenta...';

      const email = $('#registerEmail').value.trim();
      const name = $('#name').value.trim();
      const password = $('#registerPassword').value;

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (error) throw error;

        $('#loginEmail').value = email;

        if (data.session && data.user) {
          message('#registerMessage', 'Cuenta creada correctamente. Cargando panel...', true);
          await loadDashboard(data.user);
        } else {
          message(
            '#registerMessage',
            'Cuenta creada. Iniciá sesión con tu correo y contraseña.',
            true
          );
          show('loginView');
          message('#loginMessage', 'Ya podés ingresar con tu cuenta.', true);
        }
      } catch (err) {
        message('#registerMessage', err.message || 'No se pudo crear la cuenta.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
      }
    };
