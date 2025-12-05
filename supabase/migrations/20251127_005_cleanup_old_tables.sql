-- =====================================================
-- MIGRATION: Cleanup Vecchie Tabelle
-- Data: 2025-11-27
-- Descrizione: Elimina viste e tabelle old di clienti/fornitori
-- =====================================================

-- =====================================================
-- ELIMINA VISTE DI COMPATIBILITÀ
-- =====================================================

DO $$
BEGIN
  DROP VIEW IF EXISTS clienti CASCADE;
  DROP VIEW IF EXISTS fornitori CASCADE;
  RAISE NOTICE 'Viste clienti e fornitori eliminate';
END $$;

-- =====================================================
-- ELIMINA TABELLE OLD (BACKUP)
-- =====================================================

DO $$
BEGIN
  DROP TABLE IF EXISTS clienti_old CASCADE;
  DROP TABLE IF EXISTS fornitori_old CASCADE;
  RAISE NOTICE 'Tabelle clienti_old e fornitori_old eliminate';
END $$;

-- =====================================================
-- ELIMINA TABELLE ORIGINALI (se ancora presenti)
-- =====================================================

DO $$
BEGIN
  DROP TABLE IF EXISTS clienti CASCADE;
  DROP TABLE IF EXISTS fornitori CASCADE;
  RAISE NOTICE 'Tabelle clienti e fornitori eliminate (se presenti)';
END $$;

-- =====================================================
-- VERIFICA FINALE
-- =====================================================

DO $$
DECLARE
  v_count INT;
BEGIN
  -- Conta le tabelle rimaste con questi nomi
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_name IN ('clienti', 'fornitori', 'clienti_old', 'fornitori_old');

  IF v_count = 0 THEN
    RAISE NOTICE '✅ Cleanup completato: tutte le vecchie tabelle eliminate';
  ELSE
    RAISE WARNING '⚠️  Alcune tabelle potrebbero essere ancora presenti: %', v_count;
  END IF;
END $$;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
