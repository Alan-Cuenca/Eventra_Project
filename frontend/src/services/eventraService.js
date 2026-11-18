import { api } from './api';

export const eventraService = {
  // ==========================================
  // CLIENTES (/api/clientes)
  // ==========================================
  async getClientes() {
    const response = await api.get('/clientes');
    return response?.data || [];
  },

  async createCliente(clienteData) {
    try {
      const response = await api.post('/clientes', clienteData);
      return response.data;
    } catch (err) {
      console.warn('[eventraService] createCliente fallback:', err.message);
      throw err; // propagar para mostrar el error en la UI
    }
  },

  // PUT /api/clientes/:id — Solo Admin y Gerente (verifyToken + authorizeRoles[1,2])
  async updateCliente(id, clienteData) {
    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  // DELETE /api/clientes/:id — Borrado lógico (estado_activo = false)
  async deleteCliente(id) {
    await api.delete(`/clientes/${id}`);
    return true;
  },

  // ==========================================
  // ACTIVIDADES (/api/actividades)
  // ==========================================
  async getActividades(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/actividades?${query}` : '/actividades';
    const response = await api.get(url);
    return Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
  },

  async createActividad(actividadData) {
    const payload = {
      evento_id: actividadData.evento_id,
      responsable_id: actividadData.responsable_id || null,
      titulo: actividadData.titulo || actividadData.descripcion || 'Actividad Operativa',
      descripcion: actividadData.descripcion || actividadData.titulo || '',
      fecha_vencimiento: actividadData.fecha_vencimiento || actividadData.fecha_limite || null,
      estado: actividadData.estado || 'Pendiente',
    };
    const response = await api.post('/actividades', payload);
    return response?.data || response;
  },

  async updateActividad(id, actividadData) {
    const payload = {
      evento_id: actividadData.evento_id,
      responsable_id: actividadData.responsable_id || null,
      titulo: actividadData.titulo || actividadData.descripcion || 'Actividad Operativa',
      descripcion: actividadData.descripcion || actividadData.titulo || '',
      fecha_vencimiento: actividadData.fecha_vencimiento || actividadData.fecha_limite || null,
      estado: actividadData.estado || 'Pendiente',
    };
    const response = await api.put(`/actividades/${id}`, payload);
    return response?.data || response;
  },

  async updateEstadoActividad(id, estado) {
    const response = await api.patch(`/actividades/${id}/estado`, { estado });
    return response?.data || response;
  },

  async deleteActividad(id) {
    await api.delete(`/actividades/${id}`);
    return true;
  },

  // ==========================================
  // USUARIOS / TRABAJADORES (/api/usuarios)
  // ==========================================
  async getUsuarios() {
    try {
      const response = await api.get('/usuarios');
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      return list.map((u) => ({
        id: u.id,
        nombre_completo: u.nombre_completo || u.nombre || `${u.nombres || ''} ${u.apellidos || ''}`.trim() || 'Colaborador',
        email: u.email,
        rol_id: u.rol_id,
      }));
    } catch (err) {
      // Solo el Administrador puede listar usuarios; para otros roles la lista queda vacía
      console.warn('[eventraService] getUsuarios:', err.message);
      return [];
    }
  },

  // ==========================================
  // PROVEEDORES (/api/proveedores)
  // ==========================================
  async getProveedores() {
    const response = await api.get('/proveedores');
    return response?.data || [];
  },

  async getProveedor(id) {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  async createProveedor(proveedorData) {
    const response = await api.post('/proveedores', proveedorData);
    return response.data;
  },

  async updateProveedor(id, proveedorData) {
    const response = await api.put(`/proveedores/${id}`, proveedorData);
    return response.data;
  },

  async deleteProveedor(id) {
    await api.delete(`/proveedores/${id}`);
    return true;
  },

  // ==========================================
  // SERVICIOS & PAQUETES (/api/servicios, /api/paquetes)
  // ==========================================
  async getServicios() {
    const response = await api.get('/servicios');
    return response?.data || [];
  },

  async createServicio(servicioData) {
    const response = await api.post('/servicios', servicioData);
    return response.data;
  },

  async updateServicio(id, servicioData) {
    const response = await api.put(`/servicios/${id}`, servicioData);
    return response.data;
  },

  async deleteServicio(id) {
    await api.delete(`/servicios/${id}`);
    return true;
  },

  async getPaquetes() {
    const response = await api.get('/paquetes');
    return response?.data || [];
  },

  async createPaquete(paqueteData) {
    const response = await api.post('/paquetes', paqueteData);
    return response.data;
  },

  async updatePaquete(id, paqueteData) {
    const response = await api.put(`/paquetes/${id}`, paqueteData);
    return response.data;
  },

  async deletePaquete(id) {
    await api.delete(`/paquetes/${id}`);
    return true;
  },

  // ==========================================
  // EVENTOS (/api/eventos)
  // ==========================================
  async getEventos() {
    const response = await api.get('/eventos');
    return Array.isArray(response)
      ? response
      : (response?.data && Array.isArray(response.data) ? response.data : []);
  },

  async getEvento(id) {
    const response = await api.get(`/eventos/${id}`);
    const data = response?.data || response;
    if (!data || !(data.id || data.titulo)) throw new Error('Evento no encontrado.');
    return data;
  },

  async createEvento(eventoData) {
    const response = await api.post('/eventos', eventoData);
    return response.data;
  },

  async updateEvento(id, eventoData) {
    const response = await api.put(`/eventos/${id}`, eventoData);
    return response.data;
  },

  async deleteEvento(id) {
    await api.delete(`/eventos/${id}`);
    return true;
  },

  async updateEstadoEvento(eventoId, nuevoEstado) {
    const response = await api.patch(`/eventos/${eventoId}/estado`, { estado_progreso: nuevoEstado });
    return response.data;
  },

  // ==========================================
  // COTIZACIONES & RESERVAS (/api/cotizaciones, /api/reservas)
  // ==========================================
  async getCotizaciones() {
    const response = await api.get('/cotizaciones');
    return response.data || [];
  },

  async updateEstadoCotizacion(id, estado) {
    const response = await api.patch(`/cotizaciones/${id}/estado`, { estado });
    return response?.data || response;
  },

  async createCotizacion(cotizacionData) {
    const response = await api.post('/cotizaciones', cotizacionData);
    return response.data;
  },

  async getReservas() {
    const response = await api.get('/reservas');
    return response?.data || [];
  },

  async createReserva(reservaData) {
    // Aquí el backend podría devolver un 409 si ya está reservado.
    // El interceptor en api.js o esta promesa fallará, por lo que lo propagamos.
    const response = await api.post('/reservas', reservaData);
    return response.data;
  },

  async updateReserva(id, reservaData) {
    const response = await api.put(`/reservas/${id}`, reservaData);
    return response.data;
  },

  async deleteReserva(id) {
    await api.delete(`/reservas/${id}`);
    return true;
  },

  // ==========================================
  // DASHBOARD EJECUTIVO (/api/dashboard/admin)
  // ==========================================
  async getDashboardAdmin() {
    const response = await api.get('/dashboard/admin');
    return response?.data || response;
  },

  // ==========================================
  // PAGOS (/api/pagos)
  // ==========================================
  async getPagos() {
    const response = await api.get('/pagos');
    if (Array.isArray(response)) return response;
    return response && Array.isArray(response.data) ? response.data : [];
  },

  async uploadPago(formData) {
    try {
      // Axios usa "data" para el payload, no "body"
      const response = await api.post('/pagos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] uploadPago error:', err.message);
      throw err;
    }
  },

  async actualizarEstadoPago(id, estado) {
    try {
      const response = await api.put(`/pagos/${id}/estado`, { estado });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] actualizarEstadoPago error:', err.message);
      throw err;
    }
  },

  // ==========================================
  // SUSCRIPCIONES SAAS (/api/suscripciones)
  // ==========================================
  async getSuscripciones() {
    const response = await api.get('/suscripciones');
    if (Array.isArray(response)) return response;
    return response && Array.isArray(response.data) ? response.data : [];
  },

  async pagarSuscripcion(formData) {
    try {
      const response = await api.post('/suscripciones/pagar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] pagarSuscripcion error:', err.message);
      throw err;
    }
  },

  async actualizarEstadoSuscripcion(id, estado) {
    try {
      const response = await api.put(`/suscripciones/${id}/estado`, { estado });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] actualizarEstadoSuscripcion error:', err.message);
      throw err;
    }
  },

  async getConsumoSuscripcion() {
    try {
      const response = await api.get('/suscripciones/consumo');
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] getConsumoSuscripcion error:', err.message);
      return null;
    }
  },

  async getConfiguracionGlobal() {
    try {
      const response = await api.get('/configuracion');
      return response?.data?.data || response?.data || response;
    } catch (err) {
      console.warn('[eventraService] getConfiguracionGlobal error:', err.message);
      return null;
    }
  },

  // ==========================================
  // SOLICITUDES DE MODIFICACIÓN (/api/solicitudes)
  // ==========================================
  async getSolicitudes() {
    try {
      const response = await api.get('/solicitudes');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (err) {
      console.warn('[eventraService] getSolicitudes error:', err.message);
      throw err;
    }
  },

  async crearSolicitud(solicitudData) {
    try {
      const response = await api.post('/solicitudes', solicitudData);
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] crearSolicitud error:', err.message);
      throw err;
    }
  },

  async actualizarEstadoSolicitud(id, estado) {
    try {
      const response = await api.put(`/solicitudes/${id}/estado`, { estado });
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] actualizarEstadoSolicitud error:', err.message);
      throw err;
    }
  },

  // ==========================================
  // REPORTES Y ANALÍTICA (/api/reportes)
  // ==========================================
  async getReportesResumen() {
    try {
      const response = await api.get('/reportes/resumen');
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] getReportesResumen error:', err.message);
      throw err;
    }
  },

  // ==========================================
  // BRANDING Y PERSONALIZACIÓN (/api/empresas/mi-branding)
  // ==========================================
  async getMiBranding() {
    try {
      const response = await api.get('/empresas/mi-branding');
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] getMiBranding error:', err.message);
      throw err;
    }
  },

  async actualizarMiBranding(formDataOrPayload) {
    try {
      const isFormData = typeof FormData !== 'undefined' && formDataOrPayload instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
      const response = await api.put('/empresas/mi-branding', formDataOrPayload, config);
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] actualizarMiBranding error:', err.message);
      throw err;
    }
  },

  async analizarLogoConIA(formDataOrPayload) {
    try {
      const isFormData = typeof FormData !== 'undefined' && formDataOrPayload instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
      const response = await api.post('/empresas/analizar-logo-ia', formDataOrPayload, config);
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] analizarLogoConIA error:', err.message);
      throw err;
    }
  },

  async getPortalInfo(slug) {
    try {
      const response = await api.get(`/auth/portal/${slug}`);
      return response?.data || response;
    } catch (err) {
      console.warn('[eventraService] getPortalInfo error:', err.message);
      throw err;
    }
  },

  async registrarClientePublico(payload) {
    const response = await api.post('/clientes/registro-publico', payload);
    return response?.data || response;
  },
};
