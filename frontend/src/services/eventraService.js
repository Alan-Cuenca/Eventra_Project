import { api } from './api';
import {
  MOCK_SERVICIOS,
  MOCK_PAQUETES,
  MOCK_EVENTOS,
  MOCK_SOLICITUDES_CAMBIO,
  MOCK_METRICAS_SAAS,
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
    try {
      const response = await api.get('/eventos');
      if (response && response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_EVENTOS;
    } catch (err) {
      console.warn('[eventraService] getEventos fallback:', err.message);
      return MOCK_EVENTOS;
    }
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
  // COTIZACIONES & RESERVAS (/api/cotizaciones)
  // ==========================================
  async getCotizaciones() {
    const response = await api.get('/cotizaciones');
    return response.data || [];
  },

  async createCotizacion(cotizacionData) {
    const response = await api.post('/cotizaciones', cotizacionData);
    return response.data;
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
};
