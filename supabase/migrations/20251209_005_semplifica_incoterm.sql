-- =====================================================
-- MIGRAZIONE: Semplificazione Incoterm
-- Data: 2025-12-09
-- Descrizione: Disattiva incoterm complessi, mantiene solo
--              EXW (cliente paga trasporto) e DDP (noi paghiamo)
-- =====================================================

-- Disattiva tutti gli incoterm
UPDATE incoterm SET attivo = false;

-- Riattiva solo EXW e DDP (i due casi classici)
-- EXW = Ex Works = Cliente paga trasporto (compratore)
-- DDP = Delivered Duty Paid = Noi paghiamo trasporto (venditore)
UPDATE incoterm SET attivo = true WHERE codice IN ('EXW', 'DDP');

-- Aggiorna descrizioni per essere più chiare in italiano
UPDATE incoterm
SET nome = 'Franco Fabbrica (Cliente paga)',
    descrizione = 'Il cliente si fa carico del trasporto. Noi prepariamo la merce, il cliente organizza e paga il ritiro e la consegna.'
WHERE codice = 'EXW';

UPDATE incoterm
SET nome = 'Franco Destino (Noi paghiamo)',
    descrizione = 'Noi ci facciamo carico del trasporto fino a destinazione. Il costo del trasporto è incluso o addebitato separatamente.'
WHERE codice = 'DDP';

-- Conferma modifiche
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM incoterm WHERE attivo = true;
  RAISE NOTICE 'Incoterm attivi: % (dovrebbero essere 2: EXW e DDP)', v_count;
END $$;

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
