-- Mes al que corresponde mensajes_chatbot_mes, para reiniciar el contador cada mes.
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS chatbot_mes_ref DATE;
