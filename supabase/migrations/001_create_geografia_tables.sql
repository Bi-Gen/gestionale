-- Tabella Regioni
CREATE TABLE IF NOT EXISTS regioni (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(2) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Province
CREATE TABLE IF NOT EXISTS province (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(3) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sigla VARCHAR(2) NOT NULL,
  regione_id INTEGER REFERENCES regioni(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Comuni
CREATE TABLE IF NOT EXISTS comuni (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(6) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  provincia_id INTEGER REFERENCES province(id) ON DELETE CASCADE,
  cap VARCHAR(5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_province_regione ON province(regione_id);
CREATE INDEX IF NOT EXISTS idx_comuni_provincia ON comuni(provincia_id);
CREATE INDEX IF NOT EXISTS idx_comuni_nome ON comuni(nome);
CREATE INDEX IF NOT EXISTS idx_province_nome ON province(nome);

-- RLS Policies (tutti possono leggere, solo admin possono modificare)
ALTER TABLE regioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE province ENABLE ROW LEVEL SECURITY;
ALTER TABLE comuni ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere
CREATE POLICY "Public read access for regioni" ON regioni FOR SELECT USING (true);
CREATE POLICY "Public read access for province" ON province FOR SELECT USING (true);
CREATE POLICY "Public read access for comuni" ON comuni FOR SELECT USING (true);

-- Policy: solo utenti autenticati possono modificare
CREATE POLICY "Authenticated users can insert regioni" ON regioni FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update regioni" ON regioni FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete regioni" ON regioni FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert province" ON province FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update province" ON province FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete province" ON province FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comuni" ON comuni FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update comuni" ON comuni FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete comuni" ON comuni FOR DELETE TO authenticated USING (true);
