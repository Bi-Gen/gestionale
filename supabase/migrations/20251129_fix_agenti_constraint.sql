-- =====================================================
-- MIGRATION: Fix Constraints per Agenti
-- Data: 2025-11-29
-- Descrizione: Aggiorna constraints per permettere tipo 'agente'
--              e agenti senza P.IVA/CF (dipendenti interni)
-- =====================================================

-- =====================================================
-- 1. FIX CONSTRAINT TIPO
-- =====================================================
-- Rimuovi il vecchio constraint che permetteva solo cliente/fornitore
ALTER TABLE soggetto DROP CONSTRAINT IF EXISTS chk_soggetto_tipo;

-- Ricrea il constraint includendo anche 'agente'
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_tipo
  CHECK (
    'cliente' = ANY(tipo) OR
    'fornitore' = ANY(tipo) OR
    'agente' = ANY(tipo)
  );

COMMENT ON CONSTRAINT chk_soggetto_tipo ON soggetto IS
  'Il tipo deve contenere almeno uno tra: cliente, fornitore, agente';

-- =====================================================
-- 2. FIX CONSTRAINT FISCAL CODE
-- =====================================================
-- Rimuovi tutti i possibili nomi del constraint
ALTER TABLE soggetto DROP CONSTRAINT IF EXISTS chk_soggetto_fiscal_code;
ALTER TABLE soggetto DROP CONSTRAINT IF EXISTS chk_soggetto_codice_fiscale;

-- Ricrea il constraint: P.IVA o CF obbligatori per tutti tranne persone fisiche
-- Gli agenti esterni DEVONO avere P.IVA/CF (dipendenti interni sono utenti, non agenti)
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_fiscal_code
  CHECK (
    partita_iva IS NOT NULL OR
    codice_fiscale IS NOT NULL OR
    tipo_persona = 'fisica'
  );

COMMENT ON CONSTRAINT chk_soggetto_fiscal_code ON soggetto IS
  'Richiede P.IVA o CF per soggetti giuridici (clienti, fornitori, agenti esterni), opzionale solo per persone fisiche';
