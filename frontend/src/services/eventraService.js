import { api } from './api';
import {
  MOCK_SERVICIOS,
  MOCK_PAQUETES,
  MOCK_EVENTOS,
  MOCK_SOLICITUDES_CAMBIO,
  MOCK_METRICAS_SAAS,
  MOCK_RESERVAS,
} from './mockData';

export const eventraService = {
  // ==========================================
  // CLIENTES (/api/clientes)
  // ==========================================
  async getClientes() {
    try {
      const response = await api.get('/clientes');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_EVENTOS.map((e) => ({
        id: e.id,
        nombres: e.cliente_nombre.split(' ')[0],
        apellidos: e.cliente_nombre.split(' ').slice(1).join(' ') || 'Cliente',
        email: e.cliente_email,
        telefono: e.cliente_telefono,
        estado_activo: true,
      }));
    } catch (err) {
      console.warn('[eventraService] getClientes fallback:', err.message);
      return MOCK_EVENTOS.map((e) => ({
        id: e.id,
        nombres: e.cliente_nombre.split(' ')[0],
        apellidos: e.cliente_nombre.split(' ').slice(1).join(' ') || 'Cliente',
        email: e.cliente_email,
        telefono: e.cliente_telefono,
        estado_activo: true,
      }));
    }
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
    return response.data || [];
  },

  async createActividad(actividadData) {
    const response = await api.post('/actividades', actividadData);
    return response.data;
  },

  async updateActividad(id, actividadData) {
    const response = await api.put(`/actividades/${id}`, actividadData);
    return response.data;
  },

  async deleteActividad(id) {
    await api.delete(`/actividades/${id}`);
    return true;
  },

  // ==========================================
  // PROVEEDORES (/api/proveedores)
  // ==========================================
  async getProveedores() {
    try {
      const response = await api.get('/proveedores');
      return response.data;
    } catch (err) {
      console.warn('[eventraService] getProveedores fallback:', err.message);
      return [];
    }
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
    try {
      const response = await api.get('/servicios');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_SERVICIOS;
    } catch (err) {
      console.warn('[eventraService] getServicios fallback:', err.message);
      return MOCK_SERVICIOS;
    }
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
    try {
      const response = await api.get('/paquetes');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_PAQUETES;
    } catch (err) {
      console.warn('[eventraService] getPaquetes fallback:', err.message);
      return MOCK_PAQUETES;
    }
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
    return response.data;
  },

  async getEvento(id) {
    const response = await api.get(`/eventos/${id}`);
    return response.data;
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
    try {
      const response = await api.request(`/eventos/${eventoId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_progreso: nuevoEstado }),
      });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] updateEstadoEvento fallback:', err.message);
      return { id: eventoId, estado_progreso: nuevoEstado };
    }
  },

  // ==========================================
  // COTIZACIONES & RESERVAS (/api/cotizaciones, /api/reservas)
  // ==========================================
  async getCotizaciones() {
    const response = await api.get('/cotizaciones');
    return response.data || [];
  },

  async createCotizacion(cotizacionData) {
    const response = await api.post('/cotizaciones', cotizacionData);
    return response.data;
  },

  async getReservas() {
    try {
      const response = await api.get('/reservas');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_RESERVAS;
    } catch (err) {
      console.warn('[eventraService] getReservas fallback:', err.message);
      return MOCK_RESERVAS;
    }
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
  // SOLICITUDES DE MODIFICACIÓN (/api/solicitudes)
  // ==========================================
  async getSolicitudes() {
    try {
      const response = await api.get('/solicitudes');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_SOLICITUDES_CAMBIO;
    } catch (err) {
      console.warn('[eventraService] getSolicitudes fallback:', err.message);
      return MOCK_SOLICITUDES_CAMBIO;
    }
  },

  async updateEstadoSolicitud(solicitudId, estado) {
    try {
      return await api.request(`/solicitudes/${solicitudId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
    } catch (err) {
      console.warn('[eventraService] updateEstadoSolicitud fallback:', err.message);
      return { success: true, id: solicitudId, estado };
    }
  },

  // ==========================================
  // DASHBOARD EJECUTIVO (/api/dashboard/admin)
  // ==========================================
  async getDashboardAdmin() {
    try {
      const response = await api.get('/dashboard/admin');
      if (response && response.data) {
        return response.data;
      }
      return MOCK_METRICAS_SAAS;
    } catch (err) {
      console.warn('[eventraService] getDashboardAdmin fallback:', err.message);
      return MOCK_METRICAS_SAAS;
    }
  },

  // ==========================================
  // ASISTENTE VIRTUAL EVARA / CHATBOT (/api/chatbot)
  // ==========================================
  async enviarMensajeChatbot(mensaje) {
    try {
      const response = await api.post('/chatbot', { mensaje });
      return response.data;
    } catch (err) {
      console.warn('[eventraService] Chatbot API fallback:', err.message);
      return {
        respuesta: `Hola, soy el asistente virtual EVARA de EVENTRA. Estoy preparado para orientarte en bodas, quinceañeras y recepciones. Recibí tu consulta: "${mensaje}". Actualmente te recomiendo revisar nuestros paquetes prediseñados en la sección de Servicios.`,
      };
    }
  },

  // ==========================================
  // PAGOS (/api/pagos)
  // ==========================================
  async getPagos() {
    try {
      const response = await api.get('/pagos');
      return response.data || [];
    } catch (err) {
      console.warn('[eventraService] getPagos error:', err.message);
      return [];
    }
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
};
