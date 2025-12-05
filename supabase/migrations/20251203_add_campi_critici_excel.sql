-- =====================================================
-- MIGRATION: Campi Critici da Excel/PowerBI
-- Data: 2025-12-03
-- Descrizione: Aggiunge 29 campi critici mancanti
--              identificati nell'analisi GAP
-- =====================================================

-- =====================================================
-- PARTE 1: PRODOTTO - Campi critici magazzino e UdM
-- =====================================================

-- Prezzo magazzino (CRITICO per valorizzazione giacenze)
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS prezzo_magazzino DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Conversioni Unità di Misura (CRITICHE per Power BI)
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS pezzi_per_busta INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS buste_per_cartone INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS pezzi_per_cartone INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS cartoni_per_pedana INT;

-- Planning e Logistica
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS lead_time_giorni INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS transit_time_giorni INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS scorta_minima INT DEFAULT 0;

-- Caratteristiche prodotto
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS stampa VARCHAR(255);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS descrizione_oggetto TEXT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS colore_fondo VARCHAR(50);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(50);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS hs_code VARCHAR(10);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS codice_fornitore VARCHAR(50);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS peso_kg DECIMAL(10,3);
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS gsm INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS linea VARCHAR(100);

COMMENT ON COLUMN prodotto.prezzo_magazzino IS 'Prezzo/costo medio per valorizzazione magazzino (critico per Power BI)';
COMMENT ON COLUMN prodotto.pezzi_per_busta IS 'Conversione UdM: quanti pezzi in una busta';
COMMENT ON COLUMN prodotto.buste_per_cartone IS 'Conversione UdM: quante buste in un cartone';
COMMENT ON COLUMN prodotto.pezzi_per_cartone IS 'Conversione UdM: pezzi totali in un cartone (calcolato)';
COMMENT ON COLUMN prodotto.cartoni_per_pedana IS 'Conversione UdM: quanti cartoni in una pedana/pallet';
COMMENT ON COLUMN prodotto.scorta_minima IS 'Scorta di sicurezza per calcolo fabbisogno MRP';
COMMENT ON COLUMN prodotto.lead_time_giorni IS 'Tempo di approvvigionamento dal fornitore';
COMMENT ON COLUMN prodotto.transit_time_giorni IS 'Tempo di transito/spedizione';

-- =====================================================
-- PARTE 2: DETTAGLIO_MOVIMENTO - Quantità con segno
-- =====================================================

-- Campo CRITICO per tutte le misure DAX Power BI
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS quantita_con_segno DECIMAL(12,3);

COMMENT ON COLUMN dettaglio_movimento.quantita_con_segno IS
'Quantità con segno: positiva per carico, negativa per scarico (CRITICO per Power BI)';

-- =====================================================
-- PARTE 3: MOVIMENTO - Date multiple (Time Intelligence)
-- =====================================================

-- 3 dimensioni temporali Power BI
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS data_consegna DATE;
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS data_pagamento DATE;
-- data_documento già esiste come data_movimento

COMMENT ON COLUMN movimento.data_consegna IS 'Data consegna prevista (dimensione temporale Power BI)';
COMMENT ON COLUMN movimento.data_pagamento IS 'Data pagamento effettivo (dimensione temporale Power BI)';

-- =====================================================
-- PARTE 4: MOVIMENTO - Logistica e Commerciale
-- =====================================================

-- Agente e commerciale
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS agente VARCHAR(100);

-- Logistica
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS vettore VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS termini_resa VARCHAR(50);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS costo_trasporto DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS etd VARCHAR(50);

-- Amministrativo
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS centro_costo VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS valuta VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS listino_id INT REFERENCES listino(id);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS ove_confermato VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20);

COMMENT ON COLUMN movimento.agente IS 'Agente commerciale assegnato';
COMMENT ON COLUMN movimento.termini_resa IS 'Incoterms: EXW, FOB, CIF, DDP, etc.';
COMMENT ON COLUMN movimento.etd IS 'Estimated Time of Departure (per export)';
COMMENT ON COLUMN movimento.centro_costo IS 'Centro di costo per contabilità analitica';

-- =====================================================
-- PARTE 5: MOVIMENTO - Sistema Provvigioni (12 campi)
-- =====================================================

-- Provvigione Agente
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_pagata DECIMAL(10,2) DEFAULT 0;

-- Provvigione Direzione Acquisti
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS direzione_acquisti VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_pagata DECIMAL(10,2) DEFAULT 0;

-- Provvigione Logistica, Amministrazione & Spedizioni
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS logistica_amm VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_pagata DECIMAL(10,2) DEFAULT 0;

-- Provvigione Direzione Commerciale
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS direzione_commerciale VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_pagata DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN movimento.provvigione_agente_perc IS 'Percentuale provvigione agente commerciale';
COMMENT ON COLUMN movimento.provvigione_agente_valore IS 'Valore calcolato provvigione agente';
COMMENT ON COLUMN movimento.provvigione_agente_pagata IS 'Importo già pagato all''agente';

COMMENT ON COLUMN movimento.provvigione_da_perc IS 'Percentuale provvigione Direzione Acquisti';
COMMENT ON COLUMN movimento.provvigione_las_perc IS 'Percentuale provvigione Logistica/Amm/Spedizioni';
COMMENT ON COLUMN movimento.provvigione_dc_perc IS 'Percentuale provvigione Direzione Commerciale';

-- =====================================================
-- PARTE 6: SOGGETTO - Provvigioni e Commerciale
-- =====================================================

-- Provvigioni default per soggetto
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS agente VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_agente_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS direzione_acquisti VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_da_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS logistica_amm VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_las_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS direzione_commerciale VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_dc_perc DECIMAL(5,2);

-- Commerciale
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS listino_id INT REFERENCES listino(id);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS trattamento_iva VARCHAR(50);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS giorni_pagamento INT DEFAULT 0;
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS note_consegna TEXT;
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS settore VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS macrofamiglia VARCHAR(100);

COMMENT ON COLUMN soggetto.agente IS 'Agente commerciale assegnato al cliente';
COMMENT ON COLUMN soggetto.provvigione_agente_perc IS 'Percentuale provvigione default per questo cliente';
COMMENT ON COLUMN soggetto.listino_id IS 'Listino prezzi assegnato al cliente';
COMMENT ON COLUMN soggetto.trattamento_iva IS 'Trattamento IVA: Ordinario, Split Payment, Reverse Charge, Esente';
COMMENT ON COLUMN soggetto.giorni_pagamento IS 'Dilazione pagamento in giorni (es: 30, 60, 90)';

-- =====================================================
-- PARTE 7: DETTAGLIO_MOVIMENTO - Campi aggiuntivi
-- =====================================================

ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS stampa VARCHAR(255);
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS descrizione_oggetto TEXT;
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS colore_fondo VARCHAR(50);
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS costo_stampa DECIMAL(10,2);
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS prezzo_listino DECIMAL(10,2);

COMMENT ON COLUMN dettaglio_movimento.stampa IS 'Personalizzazione stampa (layout cliente)';
COMMENT ON COLUMN dettaglio_movimento.costo_stampa IS 'Costo aggiuntivo per stampa personalizzata';
COMMENT ON COLUMN dettaglio_movimento.prezzo_listino IS 'Prezzo originale da listino (prima di sconti)';

-- =====================================================
-- PARTE 8: TRIGGER per quantita_con_segno automatico
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_quantita_con_segno()
RETURNS TRIGGER AS $$
DECLARE
  v_segno INT;
BEGIN
  -- Ottieni il segno dalla causale del movimento
  SELECT c.segno INTO v_segno
  FROM movimento m
  INNER JOIN causale_documento c ON m.causale_id = c.id
  WHERE m.id = NEW.movimento_id;

  -- Calcola quantità con segno
  NEW.quantita_con_segno := NEW.quantita * COALESCE(v_segno, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcola_quantita_con_segno() IS
'Calcola automaticamente quantita_con_segno moltiplicando quantita per il segno della causale';

-- Applica trigger
DROP TRIGGER IF EXISTS trg_dettaglio_movimento_quantita_segno ON dettaglio_movimento;
CREATE TRIGGER trg_dettaglio_movimento_quantita_segno
  BEFORE INSERT OR UPDATE ON dettaglio_movimento
  FOR EACH ROW
  EXECUTE FUNCTION calcola_quantita_con_segno();

-- =====================================================
-- PARTE 9: TRIGGER per calcolo pezzi_per_cartone
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_pezzi_per_cartone()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcola automaticamente se entrambi i campi sono valorizzati
  IF NEW.pezzi_per_busta IS NOT NULL AND NEW.buste_per_cartone IS NOT NULL THEN
    NEW.pezzi_per_cartone := NEW.pezzi_per_busta * NEW.buste_per_cartone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcola_pezzi_per_cartone() IS
'Calcola automaticamente pezzi_per_cartone = pezzi_per_busta * buste_per_cartone';

DROP TRIGGER IF EXISTS trg_prodotto_pezzi_cartone ON prodotto;
CREATE TRIGGER trg_prodotto_pezzi_cartone
  BEFORE INSERT OR UPDATE ON prodotto
  FOR EACH ROW
  EXECUTE FUNCTION calcola_pezzi_per_cartone();

-- =====================================================
-- PARTE 10: Indici per performance
-- =====================================================

-- Indici su campi di ricerca frequenti
CREATE INDEX IF NOT EXISTS idx_movimento_agente ON movimento(agente) WHERE agente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimento_data_consegna ON movimento(data_consegna) WHERE data_consegna IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimento_data_pagamento ON movimento(data_pagamento) WHERE data_pagamento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimento_centro_costo ON movimento(centro_costo) WHERE centro_costo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soggetto_agente ON soggetto(agente) WHERE agente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soggetto_settore ON soggetto(settore) WHERE settore IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prodotto_codice_fornitore ON prodotto(codice_fornitore) WHERE codice_fornitore IS NOT NULL;

-- =====================================================
-- PARTE 11: Constraint per validazione dati
-- =====================================================

-- Percentuali provvigioni tra 0 e 100
ALTER TABLE movimento ADD CONSTRAINT chk_provvigione_agente_perc
  CHECK (provvigione_agente_perc IS NULL OR (provvigione_agente_perc >= 0 AND provvigione_agente_perc <= 100));
ALTER TABLE movimento ADD CONSTRAINT chk_provvigione_da_perc
  CHECK (provvigione_da_perc IS NULL OR (provvigione_da_perc >= 0 AND provvigione_da_perc <= 100));
ALTER TABLE movimento ADD CONSTRAINT chk_provvigione_las_perc
  CHECK (provvigione_las_perc IS NULL OR (provvigione_las_perc >= 0 AND provvigione_las_perc <= 100));
ALTER TABLE movimento ADD CONSTRAINT chk_provvigione_dc_perc
  CHECK (provvigione_dc_perc IS NULL OR (provvigione_dc_perc >= 0 AND provvigione_dc_perc <= 100));

-- Valuta tra codici validi
ALTER TABLE movimento ADD CONSTRAINT chk_movimento_valuta
  CHECK (valuta IN ('EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY'));

-- =====================================================
-- FINE MIGRATION
-- =====================================================

-- Riepilogo campi aggiunti:
-- PRODOTTO: 15 campi
-- DETTAGLIO_MOVIMENTO: 7 campi
-- MOVIMENTO: 25 campi
-- SOGGETTO: 12 campi
-- TOTALE: 59 campi + 2 trigger + vincoli
