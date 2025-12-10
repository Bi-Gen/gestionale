-- =====================================================
-- MIGRATION: Auto-seed completo per nuove aziende
-- Data: 2025-12-10
-- Descrizione: Aggiunge trigger auto-seed per metodi pagamento e tipi soggetto
-- =====================================================

-- =====================================================
-- TRIGGER AUTO-SEED: Metodi Pagamento
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_metodi_pagamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea metodi pagamento standard
  INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, predefinito, attivo) VALUES
    (NEW.id, 'CONT', 'Contanti', 'contanti', 0, true, true),
    (NEW.id, 'BON30', 'Bonifico 30 giorni', 'bonifico', 30, false, true),
    (NEW.id, 'BON60', 'Bonifico 60 giorni', 'bonifico', 60, false, true),
    (NEW.id, 'BON90', 'Bonifico 90 giorni', 'bonifico', 90, false, true),
    (NEW.id, 'RIBA30', 'Ri.Ba. 30 giorni', 'riba', 30, false, true),
    (NEW.id, 'RIBA60', 'Ri.Ba. 60 giorni', 'riba', 60, false, true),
    (NEW.id, 'CARTA', 'Carta di credito', 'carta', 0, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_metodi_pagamento ON azienda;

CREATE TRIGGER trigger_auto_seed_metodi_pagamento
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_metodi_pagamento();

COMMENT ON FUNCTION auto_seed_metodi_pagamento() IS
'Crea automaticamente i metodi di pagamento standard quando viene creata una nuova azienda';

-- =====================================================
-- TRIGGER AUTO-SEED: Tipi Soggetto
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_tipi_soggetto()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea tipi soggetto standard
  INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo) VALUES
    (NEW.id, 'CLI', 'Cliente', 'Clienti e committenti', '#3B82F6', true, true),
    (NEW.id, 'FOR', 'Fornitore', 'Fornitori di beni e servizi', '#F59E0B', true, true),
    (NEW.id, 'AGE', 'Agente', 'Agenti e rappresentanti di commercio', '#8B5CF6', true, true),
    (NEW.id, 'TRA', 'Trasportatore', 'Vettori e corrieri', '#10B981', true, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_tipi_soggetto ON azienda;

CREATE TRIGGER trigger_auto_seed_tipi_soggetto
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_tipi_soggetto();

COMMENT ON FUNCTION auto_seed_tipi_soggetto() IS
'Crea automaticamente i tipi soggetto standard quando viene creata una nuova azienda';

-- =====================================================
-- TRIGGER AUTO-SEED: Causali Documento
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_causali_documento()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea causali documento standard
  INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo) VALUES
    -- ORDINI
    (NEW.id, 'ORD_VEN', 'Ordine Cliente', 'ordine', 'vendita', 1, true, false, true, true),
    (NEW.id, 'ORD_ACQ', 'Ordine Fornitore', 'ordine', 'acquisto', -1, true, false, true, true),
    -- FATTURE
    (NEW.id, 'FT_ATT', 'Fattura Immediata', 'fattura', 'vendita', 1, false, true, true, true),
    (NEW.id, 'FT_DIFF', 'Fattura Differita', 'fattura', 'vendita', 1, false, true, true, true),
    (NEW.id, 'FT_PASS', 'Fattura Acquisto', 'fattura', 'acquisto', -1, false, true, true, true),
    -- NOTE CREDITO
    (NEW.id, 'NC_ATT', 'Nota Credito a Cliente', 'nota_credito', 'vendita', -1, false, true, true, true),
    (NEW.id, 'NC_PASS', 'Nota Credito da Fornitore', 'nota_credito', 'acquisto', 1, false, true, true, true),
    -- DDT
    (NEW.id, 'DDT_VEN', 'DDT Vendita', 'bolla', 'vendita', 1, true, false, true, true),
    (NEW.id, 'DDT_ACQ', 'DDT Acquisto', 'bolla', 'acquisto', -1, true, false, true, true),
    -- PREVENTIVI
    (NEW.id, 'PREV', 'Preventivo', 'preventivo', 'vendita', 0, false, false, true, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_causali_documento ON azienda;

CREATE TRIGGER trigger_auto_seed_causali_documento
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_causali_documento();

COMMENT ON FUNCTION auto_seed_causali_documento() IS
'Crea automaticamente le causali documento standard quando viene creata una nuova azienda';

-- =====================================================
-- BACKFILL: Applica seed alle aziende esistenti che non li hanno
-- =====================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM azienda LOOP
    -- Metodi pagamento
    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, predefinito, attivo)
    SELECT r.id, 'CONT', 'Contanti', 'contanti', 0, true, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'CONT');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'BON30', 'Bonifico 30 giorni', 'bonifico', 30, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'BON30');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'BON60', 'Bonifico 60 giorni', 'bonifico', 60, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'BON60');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'BON90', 'Bonifico 90 giorni', 'bonifico', 90, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'BON90');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'RIBA30', 'Ri.Ba. 30 giorni', 'riba', 30, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'RIBA30');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'RIBA60', 'Ri.Ba. 60 giorni', 'riba', 60, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'RIBA60');

    INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, attivo)
    SELECT r.id, 'CARTA', 'Carta di credito', 'carta', 0, true
    WHERE NOT EXISTS (SELECT 1 FROM metodo_pagamento WHERE azienda_id = r.id AND codice = 'CARTA');

    -- Tipi soggetto
    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo)
    SELECT r.id, 'CLI', 'Cliente', 'Clienti e committenti', '#3B82F6', true, true
    WHERE NOT EXISTS (SELECT 1 FROM tipi_soggetto WHERE azienda_id = r.id AND codice = 'CLI');

    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo)
    SELECT r.id, 'FOR', 'Fornitore', 'Fornitori di beni e servizi', '#F59E0B', true, true
    WHERE NOT EXISTS (SELECT 1 FROM tipi_soggetto WHERE azienda_id = r.id AND codice = 'FOR');

    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo)
    SELECT r.id, 'AGE', 'Agente', 'Agenti e rappresentanti di commercio', '#8B5CF6', true, true
    WHERE NOT EXISTS (SELECT 1 FROM tipi_soggetto WHERE azienda_id = r.id AND codice = 'AGE');

    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo)
    SELECT r.id, 'TRA', 'Trasportatore', 'Vettori e corrieri', '#10B981', true, true
    WHERE NOT EXISTS (SELECT 1 FROM tipi_soggetto WHERE azienda_id = r.id AND codice = 'TRA');

    -- Causali documento
    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'ORD_VEN', 'Ordine Cliente', 'ordine', 'vendita', 1, true, false, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'ORD_VEN');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'ORD_ACQ', 'Ordine Fornitore', 'ordine', 'acquisto', -1, true, false, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'ORD_ACQ');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'FT_ATT', 'Fattura Immediata', 'fattura', 'vendita', 1, false, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'FT_ATT');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'FT_DIFF', 'Fattura Differita', 'fattura', 'vendita', 1, false, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'FT_DIFF');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'FT_PASS', 'Fattura Acquisto', 'fattura', 'acquisto', -1, false, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'FT_PASS');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'NC_ATT', 'Nota Credito a Cliente', 'nota_credito', 'vendita', -1, false, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'NC_ATT');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'NC_PASS', 'Nota Credito da Fornitore', 'nota_credito', 'acquisto', 1, false, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'NC_PASS');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'DDT_VEN', 'DDT Vendita', 'bolla', 'vendita', 1, true, false, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'DDT_VEN');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'DDT_ACQ', 'DDT Acquisto', 'bolla', 'acquisto', -1, true, false, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'DDT_ACQ');

    INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo)
    SELECT r.id, 'PREV', 'Preventivo', 'preventivo', 'vendita', 0, false, false, true, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_documento WHERE azienda_id = r.id AND codice = 'PREV');
  END LOOP;
END $$;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
