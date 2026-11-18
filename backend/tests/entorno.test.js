import { validarEntorno } from '../src/config/validarEntorno.js';

describe('validarEntorno', () => {
  const base = { DB_HOST: 'h', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'n', JWT_SECRET: 'x'.repeat(40) };

  it('acepta una configuración completa', () => {
    expect(validarEntorno(base)).toEqual([]);
  });

  it('informa cada variable faltante', () => {
    const problemas = validarEntorno({ JWT_SECRET: 'x'.repeat(40) });
    expect(problemas).toHaveLength(4);
    expect(problemas.join(' ')).toMatch(/DB_HOST/);
  });

  it('rechaza un JWT_SECRET corto o de ejemplo', () => {
    expect(validarEntorno({ ...base, JWT_SECRET: 'corto' }).join(' ')).toMatch(/corto/);
    expect(validarEntorno({ ...base, JWT_SECRET: 'tu_super_secreto_jwt_de_ejemplo' }).join(' ')).toMatch(/ejemplo/);
  });
});
