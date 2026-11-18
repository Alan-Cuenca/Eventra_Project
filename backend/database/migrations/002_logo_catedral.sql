-- Corrección de datos: logo por defecto para el tenant Helados Catedral.
UPDATE empresas
SET logo_url = '/logo_Helados_Catedral.jpg'
WHERE (nombre_comercial ILIKE '%Catedral%' OR slug ILIKE '%catedral%' OR portal_titulo ILIKE '%Catedral%')
  AND (logo_url IS NULL OR logo_url = '');
