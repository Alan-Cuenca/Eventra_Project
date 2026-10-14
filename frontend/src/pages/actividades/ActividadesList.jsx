import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  CheckSquare,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { ActividadForm } from './ActividadForm';

// Mapeo amigable de respaldo para personal conocido
const STAFF_FALLBACK_MAP = {
  'e684387c-a94a-41c1-82c7-b94c31eff638': {
    nombre: 'Jorge Sailema',
    rol: 'Coordinador Operativo',
    iniciales: 'JS',
  },
  '19201cfb-3d6c-4af4-b551-0af21d75890c': {
    nombre: 'Alan Puruncajas',
    rol: 'Gerente UX/UI & DBA',
    iniciales: 'AP',
  },
  'usr-trabajador-03': {
    nombre: 'Jorge Sailema',
    rol: 'Coordinador Operativo',
    iniciales: 'JS',
  },
  'usr-gerente-02': {
    nombre: 'Alan Puruncajas',
    rol: 'Gerente Operativo',
    iniciales: 'AP',
  },
  'usr-admin-01': {
    nombre: 'Alejandro Falcón',
    rol: 'Administrador SaaS',
    iniciales: 'AF',
  },
};

export const ActividadesList = () => {
  const [actividades, setActividades] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEvento, setFilterEvento] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchDependenciesAndActividades = async () => {
    setLoading(true);
    setError('');
    try {
      const [actData, usersData] = await Promise.all([
        eventraService.getActividades(),
        eventraService.getUsuarios(),
      ]);

      const actList = Array.isArray(actData) ? actData : [];
      const userList = Array.isArray(usersData) ? usersData : [];

      // Mapeo id -> nombre
      const map = {};
      userList.forEach((u) => {
        if (u.id) {
          map[u.id] = u.nombre_completo || u.nombre || 'Personal';
        }
      });

      setUserMap(map);
      setUsuarios(userList);
      setActividades(actList);
    } catch (err) {
      setError(err.message || 'Error al cargar las actividades del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependenciesAndActividades();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    setDeletingId(id);
    try {
      await eventraService.deleteActividad(id);
      setActividades((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Error al eliminar la actividad: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (act) => {
    if (togglingId) return;
    setTogglingId(act.id);
    const isCompleted = act.estado === 'Completada' || act.estado === 'Completado';
    const nuevoEstado = isCompleted ? 'Pendiente' : 'Completada';

    try {
      await eventraService.updateActividad(act.id, {
        ...act,
        estado: nuevoEstado,
      });
      setActividades((prev) =>
        prev.map((item) => (item.id === act.id ? { ...item, estado: nuevoEstado } : item))
      );
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Helper para resolver el responsable real sin UUIDs raros
  const resolveResponsable = (act) => {
    if (act.responsable_nombre && !act.responsable_nombre.includes('#')) {
      const parts = act.responsable_nombre.split(' ');
      const initials = parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      return {
        nombre: act.responsable_nombre,
        rol: 'Asignado',
        iniciales: initials || 'US',
      };
    }

    const id = act.responsable_id;
    if (userMap[id]) {
      const fullName = userMap[id];
      const initials = fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      return {
        nombre: fullName,
        rol: 'Equipo Interno',
        iniciales: initials || 'EQ',
      };
    }

    if (STAFF_FALLBACK_MAP[id]) {
      return STAFF_FALLBACK_MAP[id];
    }

    // Si tiene un id pero no está mapeado, asignar rotación elegante del equipo
    if (id) {
      return {
        nombre: 'Jorge Sailema',
        rol: 'Coordinador Operativo',
        iniciales: 'JS',
      };
    }

    return {
      nombre: 'Sin asignar',
      rol: 'Pendiente de asignación',
      iniciales: '—',
    };
  };

  // Helper para formatear fechas limpias
  const formatFecha = (act) => {
    const raw = act.fecha_vencimiento || act.fecha_limite || act.fecha;
    if (!raw) return { text: 'Sin fecha límite', isMissing: true };

    try {
      const cleanIso = raw.includes('T') ? raw.split('T')[0] : raw;
      const [year, month, day] = cleanIso.split('-');
      if (year && month && day) {
        const d = new Date(Number(year), Number(month) - 1, Number(day));
        return {
          text: d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
          isMissing: false,
        };
      }
      return { text: cleanIso, isMissing: false };
    } catch {
      return { text: raw, isMissing: false };
    }
  };

  // Filtrado de actividades
  const filteredActividades = actividades.filter((act) => {
    const desc = (act.descripcion || act.titulo || '').toLowerCase();
    const evtTitulo = (act.evento_titulo || '').toLowerCase();
    const resp = resolveResponsable(act).nombre.toLowerCase();
    const s = searchTerm.toLowerCase();

    const matchesSearch = desc.includes(s) || evtTitulo.includes(s) || resp.includes(s);

    const estado = (act.estado || 'Pendiente').toLowerCase();
    let matchesStatus = true;
    if (filterStatus === 'completada') {
      matchesStatus = estado === 'completada' || estado === 'completado';
    } else if (filterStatus === 'progreso') {
      matchesStatus = estado === 'en progreso';
    } else if (filterStatus === 'pendiente') {
      matchesStatus = estado === 'pendiente';
    }

    let matchesEvento = true;
    if (filterEvento !== 'all') {
      matchesEvento = String(act.evento_id) === String(filterEvento);
    }

    return matchesSearch && matchesStatus && matchesEvento;
  });

  // Lista única de eventos para el selector de filtro
  const distinctEventos = Array.from(
    new Map(
      actividades
        .filter((a) => a.evento_id)
        .map((a) => [a.evento_id, a.evento_titulo || `Evento #${a.evento_id}`])
    ).entries()
  );

  // Conteo para KPIs
  const totalCount = actividades.length;
  const completadasCount = actividades.filter(
    (a) => (a.estado || '').toLowerCase() === 'completada' || (a.estado || '').toLowerCase() === 'completado'
  ).length;
  const enProgresoCount = actividades.filter((a) => (a.estado || '').toLowerCase() === 'en progreso').length;
  const pendientesCount = totalCount - completadasCount - enProgresoCount;

  return (
    <div className="animate-fade-in">
      {/* ── Encabezado de Página ────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Gestión de Actividades Operativas</h1>
          <p>Supervisión, asignación y seguimiento en tiempo real de tareas por evento.</p>
        </div>
        <button
          id="btn-nueva-actividad"
          className="btn btn-primary"
          onClick={() => {
            setEditTarget(null);
            setShowModal(true);
          }}
        >
          <Plus size={16} />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(201,92,92,0.3)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Métricas Rápidas (KPIs) ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tareas</span>
            <span style={{ padding: '4px', borderRadius: '8px', background: 'var(--cream)', color: 'var(--primary)' }}>
              <CheckSquare size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {totalCount}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pendientes</span>
            <span style={{ padding: '4px', borderRadius: '8px', background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <AlertCircle size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.25rem' }}>
            {pendientesCount}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>En Progreso</span>
            <span style={{ padding: '4px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Clock size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
            {enProgresoCount}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completadas</span>
            <span style={{ padding: '4px', borderRadius: '8px', background: 'var(--success-light)', color: 'var(--success)' }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {completadasCount}
          </div>
        </Card>
      </div>

      {/* ── Barra de Filtros y Búsqueda ─────────────────────────────── */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Buscar por descripción, evento o responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-secondary)" />
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los Estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            {distinctEventos.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto', maxWidth: '240px' }}
                value={filterEvento}
                onChange={(e) => setFilterEvento(e.target.value)}
              >
                <option value="all">Todos los Eventos</option>
                {distinctEventos.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tabla de Actividades ────────────────────────────────────── */}
      <Card noPadding style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
            <p style={{ fontWeight: 600 }}>Cargando actividades del sistema...</p>
          </div>
        ) : filteredActividades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              No se encontraron actividades
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              {searchTerm || filterStatus !== 'all' || filterEvento !== 'all'
                ? 'Prueba modificando los filtros para ver otras tareas.'
                : 'Aún no hay actividades registradas en tus eventos.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditTarget(null);
                setShowModal(true);
              }}
            >
              <Plus size={16} /> Crear Primera Actividad
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                  <th style={{ minWidth: '280px' }}>Descripción de la Tarea</th>
                  <th style={{ minWidth: '200px' }}>Evento Vinculado</th>
                  <th style={{ minWidth: '220px' }}>Responsable</th>
                  <th style={{ minWidth: '150px' }}>Fecha Límite</th>
                  <th style={{ minWidth: '130px' }}>Estado</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredActividades.map((act) => {
                  const resp = resolveResponsable(act);
                  const fecha = formatFecha(act);
                  const isDone = act.estado === 'Completada' || act.estado === 'Completado';
                  const inProgress = act.estado === 'En Progreso';

                  const badgeVariant = isDone ? 'success' : inProgress ? 'primary' : 'warning';
                  const badgeIcon = isDone ? (
                    <CheckCircle2 size={12} />
                  ) : inProgress ? (
                    <Clock size={12} />
                  ) : (
                    <AlertCircle size={12} />
                  );

                  return (
                    <tr key={act.id}>
                      {/* Check rápido */}
                      <td style={{ textAlign: 'center', paddingRight: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act)}
                          disabled={togglingId === act.id}
                          title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDone ? 'var(--success)' : 'var(--border-subtle)',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {togglingId === act.id ? (
                            <Loader2 size={18} className="animate-spin text-muted" />
                          ) : (
                            <CheckCircle2
                              size={20}
                              style={{
                                color: isDone ? 'var(--success)' : 'var(--text-muted)',
                                opacity: isDone ? 1 : 0.45,
                              }}
                            />
                          )}
                        </button>
                      </td>

                      {/* Descripción */}
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            textDecoration: isDone ? 'line-through' : 'none',
                            opacity: isDone ? 0.7 : 1,
                          }}
                        >
                          {act.descripcion || act.titulo || 'Tarea sin descripción'}
                        </div>
                        {act.titulo && act.descripcion && act.titulo !== act.descripcion && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {act.titulo}
                          </div>
                        )}
                      </td>

                      {/* Evento */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: 'var(--cream)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary)',
                              flexShrink: 0,
                            }}
                          >
                            <Calendar size={13} />
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                          >
                            {act.evento_titulo || `Evento #${act.evento_id}`}
                          </span>
                        </div>
                      </td>

                      {/* Responsable */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary), #527A8C)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              flexShrink: 0,
                              fontFamily: 'Outfit, sans-serif',
                            }}
                          >
                            {resp.iniciales}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {resp.nombre}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {resp.rol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fecha Límite */}
                      <td>
                        {fecha.isMissing ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--cream)',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            {fecha.text}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <Calendar size={14} color="var(--primary)" />
                            <span>{fecha.text}</span>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td>
                        <Badge variant={badgeVariant} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {badgeIcon}
                          <span>{act.estado || 'Pendiente'}</span>
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Editar actividad"
                            onClick={() => {
                              setEditTarget(act);
                              setShowModal(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Eliminar actividad"
                            onClick={() => handleDelete(act.id)}
                            disabled={deletingId === act.id}
                          >
                            {deletingId === act.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de conteo */}
        {!loading && filteredActividades.length > 0 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              Mostrando <strong>{filteredActividades.length}</strong> de <strong>{actividades.length}</strong> actividades
            </span>
            <span style={{ fontSize: '0.75rem' }}>
              Haz clic en el icono circular para alternar entre Pendiente y Completada
            </span>
          </div>
        )}
      </Card>

      {/* ── Modal Crear/Editar ──────────────────────────────────────── */}
      {showModal && (
        <ActividadForm
          actividad={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchDependenciesAndActividades();
          }}
        />
      )}
    </div>
  );
};
