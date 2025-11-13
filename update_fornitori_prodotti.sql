-- ============================================
-- SCRIPT PER ASSEGNARE FORNITORI AI PRODOTTI
-- ============================================

-- STEP 1: Visualizza i fornitori disponibili
-- Copia gli ID dei fornitori che ti servono
SELECT
    id,
    ragione_sociale,
    created_at
FROM fornitori
ORDER BY created_at;

-- STEP 2: Visualizza i prodotti attuali
-- Copia gli ID dei prodotti
SELECT
    id,
    codice,
    nome,
    fornitore_id,
    created_at
FROM prodotti
ORDER BY created_at;

-- ============================================
-- OPZIONE A: Assegnazione Automatica
-- Assegna i fornitori ai prodotti in ordine di creazione
-- ============================================

-- Questa query usa CTE per assegnare automaticamente
-- il primo fornitore al primo prodotto, ecc.
WITH prodotti_numerati AS (
    SELECT
        id as prodotto_id,
        ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM prodotti
),
fornitori_numerati AS (
    SELECT
        id as fornitore_id,
        ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM fornitori
)
UPDATE prodotti
SET fornitore_id = f.fornitore_id
FROM prodotti_numerati p
JOIN fornitori_numerati f ON p.rn = f.rn
WHERE prodotti.id = p.prodotto_id;

-- ============================================
-- OPZIONE B: Assegnazione Manuale
-- Sostituisci gli UUID con gli ID reali dal tuo database
-- ============================================

-- Prodotto 1 → Fornitore 1
UPDATE prodotti
SET fornitore_id = 'FORNITORE_1_UUID_QUI'
WHERE id = 'PRODOTTO_1_UUID_QUI';

-- Prodotto 2 → Fornitore 2
UPDATE prodotti
SET fornitore_id = 'FORNITORE_2_UUID_QUI'
WHERE id = 'PRODOTTO_2_UUID_QUI';

-- Prodotto 3 → Fornitore 3
UPDATE prodotti
SET fornitore_id = 'FORNITORE_3_UUID_QUI'
WHERE id = 'PRODOTTO_3_UUID_QUI';

-- ============================================
-- VERIFICA: Controlla che l'assegnazione sia corretta
-- ============================================
SELECT
    p.id as prodotto_id,
    p.codice,
    p.nome,
    f.ragione_sociale as fornitore,
    p.fornitore_id
FROM prodotti p
LEFT JOIN fornitori f ON p.fornitore_id = f.id
ORDER BY p.created_at;
