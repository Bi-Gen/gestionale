-- =====================================================
-- MIGRAZIONE: Gestione Trasportatori
-- Data: 2025-12-09
-- Descrizione: Aggiunge campi per associare trasportatori
--              ai clienti e gestire costi trasporto per peso
-- =====================================================

-- 1. Aggiungi campo trasportatore_id al soggetto (per clienti)
-- Questo permette di associare un trasportatore predefinito ad ogni cliente
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS trasportatore_id INTEGER REFERENCES soggetto(id) ON DELETE SET NULL;

COMMENT ON COLUMN soggetto.trasportatore_id IS 'Trasportatore predefinito per questo cliente';

-- NOTA: Chi paga il trasporto si deduce da soggetto.incoterm_default_id (già esistente)
-- - incoterm.trasporto_a_carico = 'compratore' → cliente paga
-- - incoterm.trasporto_a_carico = 'venditore' → noi paghiamo

-- 2. Aggiungi campi per costi trasporto (per soggetti di tipo trasportatore)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS costo_trasporto_kg DECIMAL(10,4) DEFAULT NULL;

COMMENT ON COLUMN soggetto.costo_trasporto_kg IS 'Costo trasporto per kg (solo per trasportatori)';

-- 4. Aggiungi campo per peso minimo fatturabile (opzionale)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS peso_minimo_fatturabile DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN soggetto.peso_minimo_fatturabile IS 'Peso minimo fatturabile in kg (solo per trasportatori)';

-- 5. Aggiungi campo per costo minimo ordine (opzionale)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS costo_minimo_trasporto DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN soggetto.costo_minimo_trasporto IS 'Costo minimo per ordine indipendente dal peso (solo per trasportatori)';

-- 5. Indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_soggetto_trasportatore
ON soggetto(trasportatore_id)
WHERE trasportatore_id IS NOT NULL;

-- 6. Funzione per calcolare costo trasporto
CREATE OR REPLACE FUNCTION calcola_costo_trasporto(
  p_trasportatore_id INTEGER,
  p_peso_kg DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_costo_kg DECIMAL;
  v_peso_minimo DECIMAL;
  v_costo_minimo DECIMAL;
  v_costo_calcolato DECIMAL;
BEGIN
  -- Recupera i parametri del trasportatore
  SELECT
    costo_trasporto_kg,
    COALESCE(peso_minimo_fatturabile, 0),
    COALESCE(costo_minimo_trasporto, 0)
  INTO v_costo_kg, v_peso_minimo, v_costo_minimo
  FROM soggetto
  WHERE id = p_trasportatore_id;

  -- Se non trovato o senza costo, ritorna NULL
  IF v_costo_kg IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcola il peso effettivo (almeno il minimo)
  IF p_peso_kg < v_peso_minimo THEN
    v_costo_calcolato := v_peso_minimo * v_costo_kg;
  ELSE
    v_costo_calcolato := p_peso_kg * v_costo_kg;
  END IF;

  -- Applica il costo minimo se necessario
  IF v_costo_calcolato < v_costo_minimo THEN
    RETURN v_costo_minimo;
  END IF;

  RETURN ROUND(v_costo_calcolato, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calcola_costo_trasporto IS 'Calcola il costo di trasporto dato trasportatore e peso in kg';

-- 7. Verifica: mostra i tipi soggetto esistenti per confermare che esiste "trasporti"
DO $$
DECLARE
  v_tipo_trasporti_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM tipi_soggetto
    WHERE LOWER(nome) LIKE '%trasport%' OR LOWER(codice) LIKE '%tra%'
  ) INTO v_tipo_trasporti_exists;

  IF v_tipo_trasporti_exists THEN
    RAISE NOTICE 'Tipo soggetto trasporti trovato - OK';
  ELSE
    RAISE NOTICE 'ATTENZIONE: Tipo soggetto trasporti non trovato. Crearlo manualmente dalla UI.';
  END IF;
END $$;

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
