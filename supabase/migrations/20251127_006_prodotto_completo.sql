-- =====================================================
-- MIGRATION: Tabella Prodotto Completa
-- Data: 2025-11-27
-- Descrizione: Crea tabella prodotto da zero (elimina vecchia)
-- =====================================================

-- =====================================================
-- ELIMINA TABELLA VECCHIA
-- =====================================================

DO $$
BEGIN
  DROP TABLE IF EXISTS prodotti CASCADE;
  DROP TABLE IF EXISTS prodotti_old CASCADE;
  RAISE NOTICE 'Tabelle prodotti vecchie eliminate';
END $$;

-- =====================================================
-- TABELLA: prodotto (completa)
-- =====================================================

CREATE TABLE IF NOT EXISTS prodotto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- === IDENTIFICAZIONE ===
  codice VARCHAR(50) NOT NULL,  -- Codice interno prodotto
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  descrizione_breve VARCHAR(500),  -- Per e-commerce/cataloghi

  -- Codici alternativi
  codice_ean VARCHAR(13),  -- Barcode EAN13
  codice_fornitore VARCHAR(100),  -- Codice del fornitore principale
  codice_doganale VARCHAR(20),  -- Codice nomenclatura doganale
  sku VARCHAR(100),  -- Stock Keeping Unit

  -- === CLASSIFICAZIONE ===
  categoria VARCHAR(100),
  sottocategoria VARCHAR(100),
  famiglia VARCHAR(100),  -- Famiglia prodotto
  brand_id INT,  -- REFERENCES brand(id) - da creare dopo

  -- === MISURE E DIMENSIONI ===
  unita_misura VARCHAR(10) DEFAULT 'PZ',  -- PZ, KG, LT, MT, etc.
  peso_kg DECIMAL(10,3),  -- Peso in kg
  volume_m3 DECIMAL(10,4),  -- Volume in m³
  lunghezza_cm DECIMAL(10,2),  -- Dimensioni
  larghezza_cm DECIMAL(10,2),
  altezza_cm DECIMAL(10,2),
  colli INT DEFAULT 1,  -- Numero colli per unità

  -- === PREZZI E COSTI ===
  costo_ultimo DECIMAL(12,2),  -- Ultimo costo di acquisto
  costo_medio DECIMAL(12,2),  -- Costo medio ponderato
  prezzo_acquisto DECIMAL(12,2),  -- Prezzo acquisto standard
  prezzo_vendita DECIMAL(12,2) NOT NULL,  -- Prezzo vendita base

  -- Listini multipli (fino a 5 listini)
  prezzo_listino1 DECIMAL(12,2),
  prezzo_listino2 DECIMAL(12,2),
  prezzo_listino3 DECIMAL(12,2),
  prezzo_listino4 DECIMAL(12,2),
  prezzo_listino5 DECIMAL(12,2),

  -- Margini
  margine_percentuale DECIMAL(5,2),  -- Margine % calcolato
  sconto_massimo DECIMAL(5,2) DEFAULT 0.00,  -- Sconto massimo applicabile

  -- === FISCALE ===
  aliquota_iva DECIMAL(5,2) DEFAULT 22.00,  -- Aliquota IVA %
  conto_contabile VARCHAR(20),  -- Codice conto contabile

  -- === FORNITORI ===
  fornitore_principale_id INT REFERENCES soggetto(id),
  fornitori_alternativi JSONB,  -- Array di {fornitore_id, codice_fornitore, prezzo}
  tempo_riordino_giorni INT DEFAULT 7,  -- Lead time in giorni
  quantita_minima_ordine INT DEFAULT 1,  -- MOQ - Minimum Order Quantity

  -- === MAGAZZINO E GIACENZE ===
  quantita_magazzino DECIMAL(12,3) DEFAULT 0,  -- Giacenza attuale
  giacenza_minima DECIMAL(12,3) DEFAULT 0,  -- Scorta minima
  giacenza_massima DECIMAL(12,3),  -- Scorta massima
  punto_riordino DECIMAL(12,3),  -- Quando riordinare
  ubicazione VARCHAR(50),  -- Posizione nel magazzino (es: "A-12-3")
  magazzino_id INT,  -- REFERENCES magazzino(id) - da creare dopo

  -- === GESTIONE LOTTI E SCADENZE ===
  gestione_lotti BOOLEAN DEFAULT false,  -- Se tracciare i lotti
  gestione_seriali BOOLEAN DEFAULT false,  -- Se tracciare i seriali
  gestione_scadenze BOOLEAN DEFAULT false,  -- Se prodotto deperibile
  giorni_scadenza INT,  -- Giorni validità dalla produzione

  -- === VARIANTI ===
  ha_varianti BOOLEAN DEFAULT false,  -- Se prodotto ha varianti
  prodotto_padre_id INT REFERENCES prodotto(id),  -- Se è una variante
  attributi_variante JSONB,  -- es: {"colore": "Rosso", "taglia": "L"}

  -- === IMMAGINI E ALLEGATI ===
  immagine_url VARCHAR(500),  -- URL immagine principale
  immagini JSONB,  -- Array di URL immagini aggiuntive
  allegati JSONB,  -- Schede tecniche, certificati, etc.

  -- === VENDITA ===
  vendibile BOOLEAN DEFAULT true,
  visibile_catalogo BOOLEAN DEFAULT true,
  visibile_ecommerce BOOLEAN DEFAULT false,
  disponibile_magazzino BOOLEAN DEFAULT true,  -- Se in stock

  -- === ACQUISTO ===
  acquistabile BOOLEAN DEFAULT true,

  -- === NOTE E METADATA ===
  note TEXT,
  note_interne TEXT,  -- Note non visibili al cliente
  tag JSONB,  -- Array di tag per ricerca
  custom_fields JSONB,  -- Campi personalizzati

  -- === STATISTICHE (calcolate) ===
  volte_venduto INT DEFAULT 0,
  ultima_vendita DATE,
  ultimo_acquisto DATE,
  valore_giacenza DECIMAL(15,2) DEFAULT 0,  -- giacenza * costo_medio

  -- === FLAGS ===
  attivo BOOLEAN DEFAULT true,
  obsoleto BOOLEAN DEFAULT false,
  in_promozione BOOLEAN DEFAULT false,
  novita BOOLEAN DEFAULT false,

  -- === METADATA ===
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: codice univoco per azienda
  UNIQUE(azienda_id, codice)
);

-- =====================================================
-- INDICI per performance
-- =====================================================

-- Multi-tenancy (CRITICAL)
CREATE INDEX idx_prodotto_azienda_id ON prodotto(azienda_id);

-- Ricerca per codice
CREATE INDEX idx_prodotto_codice ON prodotto(codice);
CREATE INDEX idx_prodotto_codice_azienda ON prodotto(azienda_id, codice);

-- Ricerca per nome (full-text)
CREATE INDEX idx_prodotto_nome ON prodotto(nome);
CREATE INDEX idx_prodotto_nome_trgm ON prodotto USING gin(nome gin_trgm_ops);

-- Ricerca per barcode
CREATE INDEX idx_prodotto_ean ON prodotto(codice_ean) WHERE codice_ean IS NOT NULL;

-- Filtro per categoria
CREATE INDEX idx_prodotto_categoria ON prodotto(categoria);
CREATE INDEX idx_prodotto_brand ON prodotto(brand_id) WHERE brand_id IS NOT NULL;

-- Filtro per fornitore
CREATE INDEX idx_prodotto_fornitore ON prodotto(fornitore_principale_id) WHERE fornitore_principale_id IS NOT NULL;

-- Filtro prodotti attivi e vendibili
CREATE INDEX idx_prodotto_attivo_vendibile ON prodotto(attivo, vendibile) WHERE attivo = true AND vendibile = true;

-- Giacenza (per controllo stock)
CREATE INDEX idx_prodotto_giacenza ON prodotto(quantita_magazzino) WHERE attivo = true;

-- Prodotti con varianti
CREATE INDEX idx_prodotto_padre ON prodotto(prodotto_padre_id) WHERE prodotto_padre_id IS NOT NULL;

-- =====================================================
-- CONSTRAINT
-- =====================================================

-- Prezzo vendita deve essere positivo
ALTER TABLE prodotto ADD CONSTRAINT chk_prodotto_prezzo_vendita
  CHECK (prezzo_vendita >= 0);

-- Giacenza non può essere negativa
ALTER TABLE prodotto ADD CONSTRAINT chk_prodotto_giacenza
  CHECK (quantita_magazzino >= 0);

-- Se ha varianti, non può essere lui stesso una variante
ALTER TABLE prodotto ADD CONSTRAINT chk_prodotto_varianti
  CHECK (NOT (ha_varianti = true AND prodotto_padre_id IS NOT NULL));

-- Aliquota IVA valida
ALTER TABLE prodotto ADD CONSTRAINT chk_prodotto_iva
  CHECK (aliquota_iva >= 0 AND aliquota_iva <= 100);

-- EAN13 deve essere 13 cifre
ALTER TABLE prodotto ADD CONSTRAINT chk_prodotto_ean
  CHECK (codice_ean IS NULL OR codice_ean ~ '^\d{13}$');

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_prodotto_updated_at
  BEFORE UPDATE ON prodotto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Calcola margine percentuale automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_margine_prodotto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcola margine solo se abbiamo sia prezzo vendita che costo
  IF NEW.prezzo_vendita > 0 AND NEW.costo_ultimo > 0 THEN
    NEW.margine_percentuale := ROUND(
      ((NEW.prezzo_vendita - NEW.costo_ultimo) / NEW.prezzo_vendita * 100)::numeric,
      2
    );
  END IF;

  -- Calcola valore giacenza
  IF NEW.quantita_magazzino > 0 AND NEW.costo_medio > 0 THEN
    NEW.valore_giacenza := NEW.quantita_magazzino * NEW.costo_medio;
  ELSE
    NEW.valore_giacenza := 0;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prodotto_calcola_margine
  BEFORE INSERT OR UPDATE ON prodotto
  FOR EACH ROW
  EXECUTE FUNCTION calcola_margine_prodotto();

COMMENT ON FUNCTION calcola_margine_prodotto() IS
'Calcola automaticamente il margine percentuale e il valore della giacenza quando viene inserito/aggiornato un prodotto.';

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE prodotto IS
'Tabella prodotti completa per gestionale.
Include: identificazione, prezzi, costi, margini, fornitori, giacenze, lotti, varianti.';

COMMENT ON COLUMN prodotto.costo_medio IS
'Costo medio ponderato calcolato con FIFO/LIFO.
Aggiornato automaticamente dai movimenti di magazzino.';

COMMENT ON COLUMN prodotto.punto_riordino IS
'Quando la giacenza scende sotto questo valore, il sistema genera un alert per riordinare.';

COMMENT ON COLUMN prodotto.fornitori_alternativi IS
'Array JSON di fornitori alternativi:
[{"soggetto_id": 123, "codice_fornitore": "ABC", "prezzo": 10.50, "priorita": 2}]';

COMMENT ON COLUMN prodotto.attributi_variante IS
'Attributi che distinguono questa variante dal prodotto padre:
{"colore": "Rosso", "taglia": "L", "materiale": "Cotone"}';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE prodotto ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo prodotti della propria azienda
CREATE POLICY prodotto_select_policy ON prodotto
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- Policy: utenti con permesso 'prodotti/write' possono inserire
CREATE POLICY prodotto_insert_policy ON prodotto
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'write')
  );

-- Policy: utenti con permesso 'prodotti/write' possono aggiornare
CREATE POLICY prodotto_update_policy ON prodotto
  FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'write')
  );

-- Policy: utenti con permesso 'prodotti/delete' possono eliminare
CREATE POLICY prodotto_delete_policy ON prodotto
  FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'delete')
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON prodotto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE prodotto_id_seq TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
