-- Creazione tabelle per il gestionale

-- Tabella Clienti
CREATE TABLE IF NOT EXISTS clienti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(11),
  codice_fiscale VARCHAR(16),
  email VARCHAR(255),
  telefono VARCHAR(20),
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(2),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabella Fornitori
CREATE TABLE IF NOT EXISTS fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(11),
  email VARCHAR(255),
  telefono VARCHAR(20),
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(2),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabella Prodotti
CREATE TABLE IF NOT EXISTS prodotti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  prezzo_acquisto DECIMAL(10, 2),
  prezzo_vendita DECIMAL(10, 2) NOT NULL,
  quantita_magazzino INTEGER DEFAULT 0,
  unita_misura VARCHAR(20) DEFAULT 'pz',
  fornitore_id UUID REFERENCES fornitori(id) ON DELETE SET NULL,
  categoria VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabella Ordini
CREATE TABLE IF NOT EXISTS ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ordine VARCHAR(50) UNIQUE NOT NULL,
  data_ordine DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id UUID REFERENCES clienti(id) ON DELETE SET NULL,
  stato VARCHAR(50) DEFAULT 'bozza',
  totale DECIMAL(10, 2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabella Dettagli Ordini
CREATE TABLE IF NOT EXISTS dettagli_ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordine_id UUID REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id UUID REFERENCES prodotti(id) ON DELETE SET NULL,
  quantita INTEGER NOT NULL,
  prezzo_unitario DECIMAL(10, 2) NOT NULL,
  subtotale DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_clienti_user_id ON clienti(user_id);
CREATE INDEX IF NOT EXISTS idx_fornitori_user_id ON fornitori(user_id);
CREATE INDEX IF NOT EXISTS idx_prodotti_user_id ON prodotti(user_id);
CREATE INDEX IF NOT EXISTS idx_prodotti_codice ON prodotti(codice);
CREATE INDEX IF NOT EXISTS idx_ordini_user_id ON ordini(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_numero ON ordini(numero_ordine);
CREATE INDEX IF NOT EXISTS idx_dettagli_ordini_ordine_id ON dettagli_ordini(ordine_id);

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON clienti
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornitori_updated_at BEFORE UPDATE ON fornitori
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prodotti_updated_at BEFORE UPDATE ON prodotti
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordini_updated_at BEFORE UPDATE ON ordini
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Gli utenti vedono solo i loro dati
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE prodotti ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE dettagli_ordini ENABLE ROW LEVEL SECURITY;

-- Policy per clienti
CREATE POLICY "Users can view their own clienti"
  ON clienti FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clienti"
  ON clienti FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clienti"
  ON clienti FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clienti"
  ON clienti FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per fornitori
CREATE POLICY "Users can view their own fornitori"
  ON fornitori FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fornitori"
  ON fornitori FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fornitori"
  ON fornitori FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fornitori"
  ON fornitori FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per prodotti
CREATE POLICY "Users can view their own prodotti"
  ON prodotti FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prodotti"
  ON prodotti FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prodotti"
  ON prodotti FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prodotti"
  ON prodotti FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per ordini
CREATE POLICY "Users can view their own ordini"
  ON ordini FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ordini"
  ON ordini FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ordini"
  ON ordini FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ordini"
  ON ordini FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per dettagli_ordini
CREATE POLICY "Users can view dettagli of their own ordini"
  ON dettagli_ordini FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ordini
    WHERE ordini.id = dettagli_ordini.ordine_id
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert dettagli for their own ordini"
  ON dettagli_ordini FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordini
    WHERE ordini.id = dettagli_ordini.ordine_id
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can update dettagli of their own ordini"
  ON dettagli_ordini FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM ordini
    WHERE ordini.id = dettagli_ordini.ordine_id
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete dettagli of their own ordini"
  ON dettagli_ordini FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM ordini
    WHERE ordini.id = dettagli_ordini.ordine_id
    AND ordini.user_id = auth.uid()
  ));
