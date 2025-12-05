-- =====================================================
-- MIGRATION: Magazzino e Giacenze
-- Data: 2025-11-27
-- Descrizione: Tabelle per gestione magazzino e movimenti
-- =====================================================

-- =====================================================
-- TABELLA: magazzino (warehouses)
-- =====================================================

CREATE TABLE IF NOT EXISTS magazzino (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Indirizzo
  indirizzo VARCHAR(255),
  citta VARCHAR(100),
  provincia VARCHAR(2),
  cap VARCHAR(5),

  -- Responsabile
  responsabile_id INT REFERENCES soggetto(id),
  telefono VARCHAR(50),
  email VARCHAR(255),

  -- Configurazione
  principale BOOLEAN DEFAULT false,  -- Magazzino principale
  gestione_ubicazioni BOOLEAN DEFAULT false,  -- Se tracciare ubicazioni scaffali

  -- Flags
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_magazzino_azienda ON magazzino(azienda_id);
CREATE INDEX idx_magazzino_attivo ON magazzino(attivo) WHERE attivo = true;

COMMENT ON TABLE magazzino IS 'Magazzini/Depositi per gestione multi-magazzino';

-- Seed: crea magazzino principale per ogni azienda
INSERT INTO magazzino (azienda_id, codice, nome, principale, attivo)
SELECT id, 'MAG01', 'Magazzino Principale', true, true
FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

-- =====================================================
-- TABELLA: lotto (batch/lot tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS lotto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE CASCADE,
  magazzino_id INT NOT NULL REFERENCES magazzino(id),

  -- Identificazione lotto
  codice_lotto VARCHAR(50) NOT NULL,
  codice_seriale VARCHAR(100),  -- Per tracking seriali

  -- Date
  data_produzione DATE,
  data_scadenza DATE,
  data_carico DATE DEFAULT CURRENT_DATE,

  -- Quantità
  quantita_iniziale DECIMAL(12,3) NOT NULL,
  quantita_residua DECIMAL(12,3) NOT NULL,

  -- Costo specifico del lotto
  costo_unitario DECIMAL(12,2),

  -- Ubicazione specifica
  ubicazione VARCHAR(50),

  -- Note
  note TEXT,

  -- Flags
  bloccato BOOLEAN DEFAULT false,  -- Lotto non utilizzabile (richiamo, difetti)
  scaduto BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice_lotto, prodotto_id)
);

CREATE INDEX idx_lotto_azienda ON lotto(azienda_id);
CREATE INDEX idx_lotto_prodotto ON lotto(prodotto_id);
CREATE INDEX idx_lotto_magazzino ON lotto(magazzino_id);
CREATE INDEX idx_lotto_scadenza ON lotto(data_scadenza) WHERE data_scadenza IS NOT NULL;
CREATE INDEX idx_lotto_residua ON lotto(quantita_residua) WHERE quantita_residua > 0;

COMMENT ON TABLE lotto IS 'Lotti e seriali prodotti per tracciabilità';

-- =====================================================
-- TABELLA: movimento_magazzino (stock movements)
-- =====================================================

CREATE TABLE IF NOT EXISTS movimento_magazzino (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Riferimenti
  prodotto_id INT NOT NULL REFERENCES prodotto(id),
  magazzino_id INT NOT NULL REFERENCES magazzino(id),
  causale_id INT NOT NULL REFERENCES causale_movimento(id),

  -- Lotto (opzionale)
  lotto_id INT REFERENCES lotto(id),

  -- Dati movimento
  data_movimento DATE NOT NULL DEFAULT CURRENT_DATE,
  quantita DECIMAL(12,3) NOT NULL,  -- Sempre positiva, il segno viene dalla causale
  segno INT NOT NULL CHECK (segno IN (1, -1)),  -- 1=carico, -1=scarico

  -- Costi
  costo_unitario DECIMAL(12,2),
  costo_totale DECIMAL(15,2),

  -- Trasferimenti (se causale è trasferimento)
  magazzino_destinazione_id INT REFERENCES magazzino(id),

  -- Riferimenti documento (fattura, DDT, ordine)
  documento_tipo VARCHAR(20),  -- 'fattura', 'ddt', 'ordine'
  documento_id INT,
  documento_numero VARCHAR(50),
  documento_data DATE,

  -- Soggetto (cliente/fornitore)
  soggetto_id INT REFERENCES soggetto(id),

  -- Note
  note TEXT,

  -- Utente che ha fatto il movimento
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Non modificabile dopo inserimento (audit)
  CONSTRAINT chk_movimento_quantita CHECK (quantita > 0)
);

CREATE INDEX idx_movimento_azienda ON movimento_magazzino(azienda_id);
CREATE INDEX idx_movimento_prodotto ON movimento_magazzino(prodotto_id);
CREATE INDEX idx_movimento_magazzino ON movimento_magazzino(magazzino_id);
CREATE INDEX idx_movimento_data ON movimento_magazzino(data_movimento DESC);
CREATE INDEX idx_movimento_causale ON movimento_magazzino(causale_id);
CREATE INDEX idx_movimento_soggetto ON movimento_magazzino(soggetto_id) WHERE soggetto_id IS NOT NULL;
CREATE INDEX idx_movimento_documento ON movimento_magazzino(documento_tipo, documento_id) WHERE documento_id IS NOT NULL;

COMMENT ON TABLE movimento_magazzino IS
'Movimenti di magazzino (carichi, scarichi, trasferimenti).
IMMUTABILE dopo inserimento per audit trail.';

-- =====================================================
-- TRIGGER: Aggiorna giacenza prodotto dopo movimento
-- =====================================================

CREATE OR REPLACE FUNCTION aggiorna_giacenza_prodotto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_delta DECIMAL(12,3);
BEGIN
  -- Calcola variazione: quantita * segno
  v_delta := NEW.quantita * NEW.segno;

  -- Aggiorna giacenza prodotto
  UPDATE prodotto
  SET
    quantita_magazzino = quantita_magazzino + v_delta,
    ultimo_acquisto = CASE WHEN NEW.segno = 1 THEN NEW.data_movimento ELSE ultimo_acquisto END,
    ultima_vendita = CASE WHEN NEW.segno = -1 THEN NEW.data_movimento ELSE ultima_vendita END,
    updated_at = NOW()
  WHERE id = NEW.prodotto_id;

  -- Se c'è un lotto, aggiorna anche quello
  IF NEW.lotto_id IS NOT NULL THEN
    UPDATE lotto
    SET
      quantita_residua = quantita_residua + v_delta,
      updated_at = NOW()
    WHERE id = NEW.lotto_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimento_aggiorna_giacenza
  AFTER INSERT ON movimento_magazzino
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_giacenza_prodotto();

COMMENT ON FUNCTION aggiorna_giacenza_prodotto() IS
'Aggiorna automaticamente la giacenza del prodotto quando viene inserito un movimento.
Aggiorna anche il lotto se presente.';

-- =====================================================
-- TRIGGER: Calcola costo totale movimento
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_costo_movimento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se non specificato, usa costo medio del prodotto
  IF NEW.costo_unitario IS NULL THEN
    SELECT costo_medio INTO NEW.costo_unitario
    FROM prodotto
    WHERE id = NEW.prodotto_id;
  END IF;

  -- Calcola costo totale
  IF NEW.costo_unitario IS NOT NULL THEN
    NEW.costo_totale := NEW.quantita * NEW.costo_unitario;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimento_calcola_costo
  BEFORE INSERT ON movimento_magazzino
  FOR EACH ROW
  EXECUTE FUNCTION calcola_costo_movimento();

-- =====================================================
-- VISTA MATERIALIZZATA: giacenza_per_magazzino
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS giacenza_per_magazzino AS
SELECT
  m.azienda_id,
  m.prodotto_id,
  m.magazzino_id,
  p.codice AS prodotto_codice,
  p.nome AS prodotto_nome,
  mag.nome AS magazzino_nome,
  SUM(m.quantita * m.segno) AS giacenza,
  COUNT(*) AS num_movimenti,
  MAX(m.data_movimento) AS ultimo_movimento,
  AVG(CASE WHEN m.costo_unitario IS NOT NULL THEN m.costo_unitario END) AS costo_medio
FROM movimento_magazzino m
JOIN prodotto p ON m.prodotto_id = p.id
JOIN magazzino mag ON m.magazzino_id = mag.id
GROUP BY m.azienda_id, m.prodotto_id, m.magazzino_id, p.codice, p.nome, mag.nome;

CREATE UNIQUE INDEX idx_giacenza_prodotto_magazzino
  ON giacenza_per_magazzino(azienda_id, prodotto_id, magazzino_id);

CREATE INDEX idx_giacenza_azienda
  ON giacenza_per_magazzino(azienda_id);

COMMENT ON MATERIALIZED VIEW giacenza_per_magazzino IS
'Vista materializzata con giacenze attuali per prodotto/magazzino.
Refresh con: REFRESH MATERIALIZED VIEW CONCURRENTLY giacenza_per_magazzino;';

-- =====================================================
-- FUNZIONE: Refresh giacenze
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_giacenze()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY giacenza_per_magazzino;
$$;

COMMENT ON FUNCTION refresh_giacenze() IS
'Aggiorna la vista materializzata delle giacenze.
Chiamare periodicamente o dopo batch di movimenti.';

-- =====================================================
-- VISTA: prodotti_sotto_scorta
-- =====================================================

CREATE OR REPLACE VIEW prodotti_sotto_scorta AS
SELECT
  p.id,
  p.azienda_id,
  p.codice,
  p.nome,
  p.quantita_magazzino AS giacenza_attuale,
  p.punto_riordino,
  p.giacenza_minima,
  p.fornitore_principale_id,
  s.ragione_sociale AS fornitore_nome,
  p.tempo_riordino_giorni,
  CASE
    WHEN p.quantita_magazzino <= 0 THEN 'ESAURITO'
    WHEN p.quantita_magazzino < p.giacenza_minima THEN 'CRITICO'
    WHEN p.quantita_magazzino < p.punto_riordino THEN 'DA_RIORDINARE'
  END AS stato
FROM prodotto p
LEFT JOIN soggetto s ON p.fornitore_principale_id = s.id
WHERE
  p.attivo = true
  AND p.acquistabile = true
  AND (
    p.quantita_magazzino <= 0
    OR p.quantita_magazzino < p.punto_riordino
  )
ORDER BY
  CASE
    WHEN p.quantita_magazzino <= 0 THEN 1
    WHEN p.quantita_magazzino < p.giacenza_minima THEN 2
    ELSE 3
  END,
  p.quantita_magazzino;

COMMENT ON VIEW prodotti_sotto_scorta IS
'Prodotti sotto scorta minima o punto di riordino.
Stati: ESAURITO, CRITICO, DA_RIORDINARE';

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_magazzino_updated_at
  BEFORE UPDATE ON magazzino FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lotto_updated_at
  BEFORE UPDATE ON lotto FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Magazzino
ALTER TABLE magazzino ENABLE ROW LEVEL SECURITY;
CREATE POLICY magazzino_select_policy ON magazzino FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY magazzino_insert_policy ON magazzino FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'));
CREATE POLICY magazzino_update_policy ON magazzino FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'));

-- Lotto
ALTER TABLE lotto ENABLE ROW LEVEL SECURITY;
CREATE POLICY lotto_select_policy ON lotto FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY lotto_insert_policy ON lotto FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'));
CREATE POLICY lotto_update_policy ON lotto FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'));

-- Movimento magazzino
ALTER TABLE movimento_magazzino ENABLE ROW LEVEL SECURITY;
CREATE POLICY movimento_select_policy ON movimento_magazzino FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY movimento_insert_policy ON movimento_magazzino FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'));
-- NO UPDATE/DELETE per audit trail

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON magazzino TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lotto TO authenticated;
GRANT SELECT, INSERT ON movimento_magazzino TO authenticated;  -- NO UPDATE/DELETE
GRANT SELECT ON giacenza_per_magazzino TO authenticated;
GRANT SELECT ON prodotti_sotto_scorta TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
