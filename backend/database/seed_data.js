import pool from '../src/config/db.js';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('--- Iniciando inserción de datos de prueba para EVENTRA ---');
    await client.query('BEGIN');

    const empresa_id = 1;

    // 1. Obtener usuarios clave para asignación
    const usersRes = await client.query(
      `SELECT id, email, rol_id, nombre_completo FROM usuarios WHERE empresa_id = $1`,
      [empresa_id]
    );
    const workerUser = usersRes.rows.find(u => u.rol_id === 3) || usersRes.rows[0];
    const managerUser = usersRes.rows.find(u => u.rol_id === 2) || usersRes.rows[0];
    const clientUser = usersRes.rows.find(u => u.rol_id === 4);

    console.log(`Usuario Trabajador asignado: ${workerUser.nombre_completo} (${workerUser.id})`);

    // 2. Clientes base para integridad referencial de cotizaciones, reservas y eventos
    const clientesData = [
      { nombres: 'Carlos', apellidos: 'Mendoza', email: 'carlos.mendoza@email.com', telefono: '+593 99 123 4567' },
      { nombres: 'Pablo', apellidos: 'Vayas', email: clientUser?.email || 'pablo.cliente@gmail.com', telefono: '+593 98 765 4321' },
      { nombres: 'Mariana', apellidos: 'Silva', email: 'mariana.s@techcorp.ec', telefono: '+593 95 334 8899' },
    ];

    const clientesMap = {};
    for (const c of clientesData) {
      let res = await client.query(
        `SELECT id FROM clientes WHERE empresa_id = $1 AND email = $2`,
        [empresa_id, c.email]
      );
      if (res.rowCount === 0) {
        res = await client.query(
          `INSERT INTO clientes (empresa_id, nombres, apellidos, email, telefono, estado_activo)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id`,
          [empresa_id, c.nombres, c.apellidos, c.email, c.telefono]
        );
        console.log(`Cliente insertado: ${c.nombres} ${c.apellidos}`);
      }
      clientesMap[c.email] = res.rows[0].id;
    }

    // 3. Catálogo de Servicios
    const serviciosData = [
      {
        nombre: 'Salón Imperial Platinum',
        descripcion: 'Capacidad para 300 invitados, climatización de alta potencia, suite para anfitriones y estacionamiento privado vigilado.',
        precio_base: 1200.00
      },
      {
        nombre: 'Banquete Gourmet 3 Tiempos',
        descripcion: 'Entrada fría/caliente, plato fuerte internacional, postre artesanal y estación de bebidas ilimitadas.',
        precio_base: 1500.00
      },
      {
        nombre: 'DJ Profesional, Iluminación Robótica y Efectos',
        descripcion: 'Cabina LED de última generación, 6 horas continuas de animación, cabezas móviles robóticas, máquina de humo bajo y pirotecnia fría.',
        precio_base: 650.00
      },
      {
        nombre: 'Cobertura Audiovisual Cinemática 4K',
        descripcion: '2 fotógrafos profesionales, dron para tomas aéreas 4K, video teaser editado para redes sociales y álbum fotográfico de lujo.',
        precio_base: 550.00
      },
      {
        nombre: 'Decoración Floral Temática & Backing',
        descripcion: 'Centros de mesa con flores naturales de estación, arco ceremonial personalizado y letras gigantes iluminadas.',
        precio_base: 450.00
      },
      {
        nombre: 'Mesa de Dulces Finos y Pastel Nupcial',
        descripcion: 'Variedad de 200 bocaditos dulces artesanales de autor y tarta temática personalizada de 3 niveles.',
        precio_base: 320.00
      },
      {
        nombre: 'Servicio de Coctelería de Autor & Open Bar',
        descripcion: 'Bartender profesional certificado, barra móvil luminosa y 4 variedades de cócteles exclusivos por 5 horas.',
        precio_base: 480.00
      }
    ];

    const serviciosMap = {};
    for (const s of serviciosData) {
      let res = await client.query(
        `SELECT id FROM servicios WHERE empresa_id = $1 AND nombre = $2`,
        [empresa_id, s.nombre]
      );
      if (res.rowCount === 0) {
        res = await client.query(
          `INSERT INTO servicios (empresa_id, nombre, descripcion, precio_base, estado_activo)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [empresa_id, s.nombre, s.descripcion, s.precio_base]
        );
        console.log(`Servicio insertado: ${s.nombre}`);
      }
      serviciosMap[s.nombre] = res.rows[0].id;
    }

    // 4. Paquetes Comerciales y Relación paquete_servicios
    const paquetesData = [
      {
        nombre: 'Paquete Boda de Ensueño (Todo Incluido)',
        descripcion: 'Experiencia nupcial integral de alta gama con salón de lujo, banquete gourmet, DJ robotizado, cobertura 4K y ambientación floral.',
        precio_total: 4800.00,
        servicios: [
          'Salón Imperial Platinum',
          'Banquete Gourmet 3 Tiempos',
          'DJ Profesional, Iluminación Robótica y Efectos',
          'Cobertura Audiovisual Cinemática 4K',
          'Decoración Floral Temática & Backing',
          'Mesa de Dulces Finos y Pastel Nupcial'
        ]
      },
      {
        nombre: 'Paquete Quinceañera Glamour',
        descripcion: 'Celebración mágica de XV años con pista iluminada, banquete gourmet, show de luces, fotografía 4K y decoración personalizada.',
        precio_total: 3900.00,
        servicios: [
          'Salón Imperial Platinum',
          'Banquete Gourmet 3 Tiempos',
          'DJ Profesional, Iluminación Robótica y Efectos',
          'Cobertura Audiovisual Cinemática 4K',
          'Decoración Floral Temática & Backing'
        ]
      },
      {
        nombre: 'Convención & Gala Corporativa',
        descripcion: 'Montaje ejecutivo para cenas de fin de año, congresos y ceremonias de premiación corporativa.',
        precio_total: 2200.00,
        servicios: [
          'Salón Imperial Platinum',
          'Banquete Gourmet 3 Tiempos',
          'DJ Profesional, Iluminación Robótica y Efectos',
          'Servicio de Coctelería de Autor & Open Bar'
        ]
      }
    ];

    const paquetesMap = {};
    for (const p of paquetesData) {
      let res = await client.query(
        `SELECT id FROM paquetes WHERE empresa_id = $1 AND nombre = $2`,
        [empresa_id, p.nombre]
      );
      let paqueteId;
      if (res.rowCount === 0) {
        res = await client.query(
          `INSERT INTO paquetes (empresa_id, nombre, descripcion, precio_total, estado_activo)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [empresa_id, p.nombre, p.descripcion, p.precio_total]
        );
        paqueteId = res.rows[0].id;
        console.log(`Paquete insertado: ${p.nombre}`);

        for (const servNombre of p.servicios) {
          const sId = serviciosMap[servNombre];
          if (sId) {
            await client.query(
              `INSERT INTO paquete_servicios (paquete_id, servicio_id)
               VALUES ($1, $2)
               ON CONFLICT (paquete_id, servicio_id) DO NOTHING`,
              [paqueteId, sId]
            );
          }
        }
      } else {
        paqueteId = res.rows[0].id;
      }
      paquetesMap[p.nombre] = paqueteId;
    }

    // 5. Proveedores
    const proveedoresData = [
      {
        nombre: 'AudioLuz Pro - Sonido & Iluminación Robótica',
        especialidad: 'Música e Iluminación',
        telefono: '0991238844',
        email: 'contacto@audioluzpro.com'
      },
      {
        nombre: 'Gourmet Banquetes & Alta Cocina',
        especialidad: 'Gastronomía y Catering',
        telefono: '0987654321',
        email: 'eventos@gourmetcatering.ec'
      },
      {
        nombre: 'Floristería & Decoraciones Bella Época',
        especialidad: 'Decoración Floral y Ambientación',
        telefono: '0995544332',
        email: 'pedidos@bellaepoca.com'
      },
      {
        nombre: 'Cinematics 4K Studio & Drone',
        especialidad: 'Fotografía y Video',
        telefono: '0981122334',
        email: 'estudio@cinematics4k.ec'
      },
      {
        nombre: 'Barra Libre & Coctelería Mix Master',
        especialidad: 'Bebidas y Coctelería',
        telefono: '0978899001',
        email: 'bar@cocteleriamix.com'
      }
    ];

    for (const pr of proveedoresData) {
      const exists = await client.query(
        `SELECT id FROM proveedores WHERE empresa_id = $1 AND nombre_empresa_o_contacto = $2`,
        [empresa_id, pr.nombre]
      );
      if (exists.rowCount === 0) {
        await client.query(
          `INSERT INTO proveedores (empresa_id, nombre_empresa_o_contacto, especialidad, telefono, email, estado_activo)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [empresa_id, pr.nombre, pr.especialidad, pr.telefono, pr.email]
        );
        console.log(`Proveedor insertado: ${pr.nombre}`);
      }
    }

    // 6. Cotizaciones, Reservas y Eventos (Conexión referencial completa)
    const eventosData = [
      {
        cliente_email: 'carlos.mendoza@email.com',
        paquete_nombre: 'Paquete Boda de Ensueño (Todo Incluido)',
        fecha_evento: '2026-10-24',
        hora_inicio: '18:00:00',
        hora_fin: '02:00:00',
        salon: 'Salón Imperial Platinum',
        total_calculado: 4850.00,
        cotizacion_estado: 'Aprobada',
        reserva_estado: 'Confirmada',
        evento_titulo: 'Boda Alejandra & Carlos',
        evento_desc: 'Boda nupcial elegante para 120 invitados con protocolo tradicional, banquete gourmet, hora loca y DJ.',
        estado_progreso: 'En Progreso',
        pagos: [
          { monto: 2500.00, concepto: 'Anticipo', metodo: 'Transferencia Bancaria', estado: 'Completado', fecha: '2026-09-15' },
          { monto: 1000.00, concepto: 'Abono', metodo: 'Transferencia Bancaria', estado: 'Completado', fecha: '2026-10-01' },
          { monto: 1350.00, concepto: 'Liquidación', metodo: 'Efectivo', estado: 'Pendiente', fecha: '2026-10-24' }
        ],
        actividades: [
          { titulo: 'Verificación de climatización e iluminación — Salón Imperial', desc: 'Asegurar correcto funcionamiento de aire acondicionado y luces cálidas.', dias: -4, estado: 'Completada', responsable_id: workerUser.id },
          { titulo: 'Confirmación con chef: menú gourmet (120 raciones)', desc: 'Validar mesa de quesos, plato fuerte de lomo y postre artesanal.', dias: -2, estado: 'Completada', responsable_id: workerUser.id },
          { titulo: 'Prueba de sonido y cabina de DJ profesional', desc: 'Pruebas de micrófonos inalámbricos para votos matrimoniales y pista.', dias: -1, estado: 'En Progreso', responsable_id: workerUser.id },
          { titulo: 'Montaje de backing floral y letras gigantes iluminadas', desc: 'Instalación de flores blancas y letras LOVE luminosas en recepción.', dias: 0, estado: 'Pendiente', responsable_id: workerUser.id },
          { titulo: 'Revisión de lista de invitados y protocolo de bienvenida', desc: 'Coordinación del personal de recepción y asignación de mesas.', dias: 0, estado: 'Pendiente', responsable_id: managerUser.id }
        ],
        solicitudes: [
          { desc: 'Cambio de color en mantelería de Marfil a Azul Medianoche y adición de pista de baile acrílica.', estado: 'Aprobada' }
        ]
      },
      {
        cliente_email: clientUser?.email || 'pablo.cliente@gmail.com',
        paquete_nombre: 'Paquete Quinceañera Glamour',
        fecha_evento: '2026-11-14',
        hora_inicio: '19:00:00',
        hora_fin: '01:00:00',
        salon: 'Salón Imperial Platinum',
        total_calculado: 3900.00,
        cotizacion_estado: 'Aprobada',
        reserva_estado: 'Confirmada',
        evento_titulo: 'Mis XV Años - Valentina',
        evento_desc: 'Celebración de 15 años temática con vals tradicional, cambio de zapatilla, cena buffet para 90 invitados y show de luces.',
        estado_progreso: 'En Planificación',
        pagos: [
          { monto: 1950.00, concepto: 'Anticipo', metodo: 'Transferencia Bancaria', estado: 'Completado', fecha: '2026-09-28' },
          { monto: 1000.00, concepto: 'Abono', metodo: 'Deuna', estado: 'En Revisión', fecha: '2026-10-10' }
        ],
        actividades: [
          { titulo: 'Diseño y aprobación de backing temático para fotos', desc: 'Coordinar con diseñador el backing fotográfico de mariposas y luces LED.', dias: 10, estado: 'Completada', responsable_id: workerUser.id },
          { titulo: 'Degustación de mesa de postres y pastel con el cliente', desc: 'Cita con la familia para elegir sabores del pastel de 3 pisos.', dias: 15, estado: 'En Progreso', responsable_id: managerUser.id },
          { titulo: 'Ensayo general de vals y protocolo de entrada', desc: 'Coordinar con la quinceañera y chambelanes el ensayo en pista.', dias: 25, estado: 'Pendiente', responsable_id: workerUser.id },
          { titulo: 'Montaje de pista iluminada y cabezas móviles', desc: 'Instalación técnica el día previo al evento.', dias: 30, estado: 'Pendiente', responsable_id: workerUser.id }
        ],
        solicitudes: [
          { desc: 'Solicita aumentar 15 comensales adicionales al banquete gourmet y extender 1 hora extra de DJ.', estado: 'Pendiente' }
        ]
      },
      {
        cliente_email: 'mariana.s@techcorp.ec',
        paquete_nombre: 'Convención & Gala Corporativa',
        fecha_evento: '2026-12-18',
        hora_inicio: '20:00:00',
        hora_fin: '02:00:00',
        salon: 'Salón Bellavista & Terraza',
        total_calculado: 2200.00,
        cotizacion_estado: 'Aprobada',
        reserva_estado: 'Confirmada',
        evento_titulo: 'Cena de Fin de Año - TechCorp',
        evento_desc: 'Gala corporativa de fin de año para 60 colaboradores con entrega de reconocimientos, cena ejecutiva y barra de cócteles.',
        estado_progreso: 'En Planificación',
        pagos: [
          { monto: 1100.00, concepto: 'Anticipo', metodo: 'Transferencia Bancaria', estado: 'Completado', fecha: '2026-10-12' }
        ],
        actividades: [
          { titulo: 'Prueba de proyectores, pantallas y micrófonos para discursos', desc: 'Asegurar calidad de audio para presentación anual del CEO.', dias: 60, estado: 'Pendiente', responsable_id: workerUser.id },
          { titulo: 'Selección de cócteles de bienvenida para ejecutivos', desc: 'Definir 4 tragos de autor con el proveedor de coctelería.', dias: 62, estado: 'Pendiente', responsable_id: workerUser.id }
        ],
        solicitudes: [
          { desc: 'Adición de opción vegetariana para 8 personas en el menú corporativo.', estado: 'Pendiente' }
        ]
      }
    ];

    for (const evt of eventosData) {
      const clienteId = clientesMap[evt.cliente_email];
      const paqueteId = paquetesMap[evt.paquete_nombre];

      // A) Cotización
      let cotRes = await client.query(
        `SELECT id FROM cotizaciones 
         WHERE empresa_id = $1 AND cliente_id = $2 AND fecha_estimada_evento = $3`,
        [empresa_id, clienteId, evt.fecha_evento]
      );
      let cotizacionId;
      if (cotRes.rowCount === 0) {
        cotRes = await client.query(
          `INSERT INTO cotizaciones (empresa_id, cliente_id, paquete_id, fecha_estimada_evento, total_calculado, estado)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [empresa_id, clienteId, paqueteId, evt.fecha_evento, evt.total_calculado, evt.cotizacion_estado]
        );
        cotizacionId = cotRes.rows[0].id;
        console.log(`Cotización insertada para evento: ${evt.evento_titulo}`);
      } else {
        cotizacionId = cotRes.rows[0].id;
      }

      // B) Reserva
      let resRes = await client.query(
        `SELECT id FROM reservas 
         WHERE empresa_id = $1 AND salon_o_lugar = $2 AND fecha_evento = $3`,
        [empresa_id, evt.salon, evt.fecha_evento]
      );
      let reservaId;
      if (resRes.rowCount === 0) {
        resRes = await client.query(
          `INSERT INTO reservas (empresa_id, cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [empresa_id, cotizacionId, evt.salon, evt.fecha_evento, evt.hora_inicio, evt.hora_fin, evt.reserva_estado]
        );
        reservaId = resRes.rows[0].id;
        console.log(`Reserva confirmada en ${evt.salon} para fecha ${evt.fecha_evento}`);
      } else {
        reservaId = resRes.rows[0].id;
      }

      // C) Evento
      let evRes = await client.query(
        `SELECT id FROM eventos WHERE empresa_id = $1 AND reserva_id = $2`,
        [empresa_id, reservaId]
      );
      let eventoId;
      if (evRes.rowCount === 0) {
        evRes = await client.query(
          `INSERT INTO eventos (empresa_id, reserva_id, titulo, descripcion, estado_progreso)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [empresa_id, reservaId, evt.evento_titulo, evt.evento_desc, evt.estado_progreso]
        );
        eventoId = evRes.rows[0].id;
        console.log(`Evento registrado: ${evt.evento_titulo} (${eventoId})`);
      } else {
        eventoId = evRes.rows[0].id;
      }

      // D) Actividades
      for (const act of evt.actividades) {
        const actExists = await client.query(
          `SELECT id FROM actividades WHERE empresa_id = $1 AND evento_id = $2 AND titulo = $3`,
          [empresa_id, eventoId, act.titulo]
        );
        if (actExists.rowCount === 0) {
          const vDate = new Date();
          vDate.setDate(vDate.getDate() + act.dias);
          const vDateStr = vDate.toISOString().split('T')[0];

          await client.query(
            `INSERT INTO actividades (empresa_id, evento_id, responsable_id, titulo, descripcion, fecha_vencimiento, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [empresa_id, eventoId, act.responsable_id, act.titulo, act.desc, vDateStr, act.estado]
          );
        }
      }

      // E) Pagos
      for (const pgo of evt.pagos) {
        const pgoExists = await client.query(
          `SELECT id FROM pagos WHERE empresa_id = $1 AND evento_id = $2 AND concepto = $3 AND monto = $4`,
          [empresa_id, eventoId, pgo.concepto, pgo.monto]
        );
        if (pgoExists.rowCount === 0) {
          await client.query(
            `INSERT INTO pagos (empresa_id, evento_id, monto, concepto, metodo_pago, fecha_pago, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [empresa_id, eventoId, pgo.monto, pgo.concepto, pgo.metodo, pgo.fecha, pgo.estado]
          );
        }
      }

      // F) Solicitudes de modificación
      for (const sol of evt.solicitudes) {
        const solExists = await client.query(
          `SELECT id FROM solicitudes_modificacion WHERE empresa_id = $1 AND evento_id = $2 AND descripcion_cambio = $3`,
          [empresa_id, eventoId, sol.desc]
        );
        if (solExists.rowCount === 0) {
          await client.query(
            `INSERT INTO solicitudes_modificacion (empresa_id, evento_id, cliente_id, descripcion_cambio, estado)
             VALUES ($1, $2, $3, $4, $5)`,
            [empresa_id, eventoId, clienteId, sol.desc, sol.estado]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Inserción de datos completada exitosamente sin errores.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la inserción de datos:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
