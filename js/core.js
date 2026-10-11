const supabaseClient = window.supabase.createClient(window.AMAR_SUPABASE_URL, window.AMAR_SUPABASE_KEY);
const $ = selector => document.querySelector(selector);
function show(id) {
  document.querySelectorAll('.view').forEach(view => {
    const active = view.id === id;
    view.classList.toggle('active', active);
    view.setAttribute('aria-hidden', String(!active));
  });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function activateDashboardSection(target) {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    const active = section.id === target;
    section.classList.toggle('active', active); section.setAttribute('aria-hidden', String(!active));
  });
  document.querySelectorAll('.nav [data-panel]').forEach(item => {
    const active = item.dataset.panel === target;
    item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active));
  });
  const title = document.querySelector('.top-heading h1'), description = document.querySelector('.top-heading p');
  const copy = { homeSection:['Tu panel de salud','Un resumen claro de tus lecturas y tu dispositivo A.M.A.R.'],
    historySection:['Seguimiento cardíaco','Revisá las mediciones guardadas y consultá tu evolución por fecha.'],
    profileSection:['Mi perfil','Tus datos personales y las preferencias de tu aplicación.'] }[target];
  if (title && description && copy) { title.textContent = copy[0]; description.textContent = copy[1]; }
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
document.querySelectorAll('[data-panel]').forEach(button => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => activateDashboardSection(button.dataset.panel));
});
function message(id, text, isSuccess = false) {
  const element = $(id); if (!element) return;
  element.textContent = text; element.className = isSuccess ? 'message success' : 'message';
}
function openModal(html) { $('#modalContent').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
