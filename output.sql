ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_escala_check;

-- Supervisors
INSERT INTO public.supervisors (name) VALUES ('ISRAEL') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('OZIAS') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('SEBASTIÃO') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('SEM REGISTRO') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('ASPIRADOR') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('JUNIOR PEREIRA') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('16 HORAS') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('WELLISON') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.supervisors (name) VALUES ('MATUSALEM') ON CONFLICT (name) DO NOTHING;
-- Equipment

DO $$
DECLARE
    sup_id uuid;
    eq_id uuid;
BEGIN
    -- Employee: ABNER ARAUJO DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'EM AVISO',
        telefone = '31971116958',
        matricula_usiminas = '82193573',
        matricula_gps = '982922',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ABNER ARAUJO DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ABNER ARAUJO DOS SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'EM AVISO', '31971116958', '82193573', '982922', sup_id, eq_id);
    END IF;
    -- Employee: ADAO DOS SANTOS DE GODOI
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31971169364',
        matricula_usiminas = '82158243',
        matricula_gps = '123881',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADAO DOS SANTOS DE GODOI';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADAO DOS SANTOS DE GODOI', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '31971169364', '82158243', '123881', sup_id, eq_id);
    END IF;
    -- Employee: ADAO GERALDO GOUVEA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '986245',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADAO GERALDO GOUVEA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADAO GERALDO GOUVEA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '', '', '986245', sup_id, eq_id);
    END IF;
    -- Employee: ADELSON ALVES DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31995312059',
        matricula_usiminas = '82130289',
        matricula_gps = '973104',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADELSON ALVES DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADELSON ALVES DE SOUZA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-A', 'ATIVO', '31995312059', '82130289', '973104', sup_id, eq_id);
    END IF;
    -- Employee: ADELSON DA SILVA CONCEICAO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82110939',
        matricula_gps = '966121',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADELSON DA SILVA CONCEICAO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADELSON DA SILVA CONCEICAO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '', '82110939', '966121', sup_id, eq_id);
    END IF;
    -- Employee: ADENILSON TEIXEIRA MENDES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'FÉRIAS',
        telefone = '31988656234',
        matricula_usiminas = '82110879',
        matricula_gps = '966089',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADENILSON TEIXEIRA MENDES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADENILSON TEIXEIRA MENDES', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'FÉRIAS', '31988656234', '82110879', '966089', sup_id, eq_id);
    END IF;
    -- Employee: ADILSON DAMASCENO SIQUEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-5X2',
        status = 'ATIVO',
        telefone = '31987807500',
        matricula_usiminas = '82110687',
        matricula_gps = '986244',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADILSON DAMASCENO SIQUEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADILSON DAMASCENO SIQUEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-5X2', 'ATIVO', '31987807500', '82110687', '986244', sup_id, eq_id);
    END IF;
    -- Employee: ADSON RENNAN MARQUES CHAVES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31997717901',
        matricula_usiminas = '82192862',
        matricula_gps = '966307',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ADSON RENNAN MARQUES CHAVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ADSON RENNAN MARQUES CHAVES', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31997717901', '82192862', '966307', sup_id, eq_id);
    END IF;
    -- Employee: ALDERINO ALVES DE QUEIROZ
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82110931',
        matricula_gps = '129375',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ALDERINO ALVES DE QUEIROZ';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ALDERINO ALVES DE QUEIROZ', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '', '82110931', '129375', sup_id, eq_id);
    END IF;
    -- Employee: ALEX PEREIRA SANTANA CORDEIRO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '82197810',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ALEX PEREIRA SANTANA CORDEIRO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ALEX PEREIRA SANTANA CORDEIRO', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '82197810', '', sup_id, eq_id);
    END IF;
    -- Employee: ANDRE HENRIQUE LIMA SILVA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '82199891',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ANDRE HENRIQUE LIMA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ANDRE HENRIQUE LIMA SILVA', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '82199891', '', sup_id, eq_id);
    END IF;
    -- Employee: ANGELICA MARIA DA SILVA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PLANEJADOR DE MANUTENCAO',
        cr = '48367',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ANGELICA MARIA DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ANGELICA MARIA DA SILVA', 'PLANEJADOR DE MANUTENCAO', '48367', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: ANTONIO CARLOS FERREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82168850',
        matricula_gps = '983025',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ANTONIO CARLOS FERREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ANTONIO CARLOS FERREIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'EM AVISO', '', '82168850', '983025', sup_id, eq_id);
    END IF;
    -- Employee: ARAO ALVES RODRIGUES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31991092600',
        matricula_usiminas = '82194087',
        matricula_gps = '985895',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ARAO ALVES RODRIGUES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ARAO ALVES RODRIGUES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31991092600', '82194087', '985895', sup_id, eq_id);
    END IF;
    -- Employee: ARTHUR RODRIGUES OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-5X2',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82195456',
        matricula_gps = '986255',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ARTHUR RODRIGUES OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ARTHUR RODRIGUES OLIVEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-5X2', 'ATIVO', '', '82195456', '986255', sup_id, eq_id);
    END IF;
    -- Employee: AUGUSTO SOUZA SERTAO COFFRAN
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'EM AVISO',
        telefone = '33998736747',
        matricula_usiminas = '82193265',
        matricula_gps = '981901',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'AUGUSTO SOUZA SERTAO COFFRAN';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('AUGUSTO SOUZA SERTAO COFFRAN', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'EM AVISO', '33998736747', '82193265', '981901', sup_id, eq_id);
    END IF;
    -- Employee: BONIEX SILVA NUNES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '06' OR (numero IS NULL AND '06' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '06') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82158504',
        matricula_gps = '123921',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'BONIEX SILVA NUNES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('BONIEX SILVA NUNES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '', '82158504', '123921', sup_id, eq_id);
    END IF;
    -- Employee: BRUNO MATIAS DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '33998736747',
        matricula_usiminas = '82193265',
        matricula_gps = '992172',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'BRUNO MATIAS DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('BRUNO MATIAS DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '33998736747', '82193265', '992172', sup_id, eq_id);
    END IF;
    -- Employee: BRUNO RIBEIRO DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82158504',
        matricula_gps = '969592',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'BRUNO RIBEIRO DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('BRUNO RIBEIRO DOS SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '', '82158504', '969592', sup_id, eq_id);
    END IF;
    -- Employee: CADMIEL MENESES DE OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82187369',
        matricula_gps = '985894',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CADMIEL MENESES DE OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CADMIEL MENESES DE OLIVEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82187369', '985894', sup_id, eq_id);
    END IF;
    -- Employee: CESAR SILVA MACIEL
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'EM AVISO',
        telefone = '31985750563',
        matricula_usiminas = '82120907',
        matricula_gps = '986233',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CESAR SILVA MACIEL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CESAR SILVA MACIEL', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'EM AVISO', '31985750563', '82120907', '986233', sup_id, eq_id);
    END IF;
    -- Employee: CHARLES FERREIRA DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82186739',
        matricula_gps = '980568',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CHARLES FERREIRA DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CHARLES FERREIRA DOS SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'EM AVISO', '', '82186739', '980568', sup_id, eq_id);
    END IF;
    -- Employee: CLAUDIONOR SOTO CAETANO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CLAUDIONOR SOTO CAETANO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CLAUDIONOR SOTO CAETANO', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: CLEVERSON GARCIA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31996357007',
        matricula_usiminas = '82192856',
        matricula_gps = '981852',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CLEVERSON GARCIA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CLEVERSON GARCIA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'ATIVO', '31996357007', '82192856', '981852', sup_id, eq_id);
    END IF;
    -- Employee: CRISTIANO DE ABREU CEVIDANES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31988649739',
        matricula_usiminas = '82110703',
        matricula_gps = '971126',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CRISTIANO DE ABREU CEVIDANES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CRISTIANO DE ABREU CEVIDANES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31988649739', '82110703', '971126', sup_id, eq_id);
    END IF;
    -- Employee: CRISTIANO DE OLIVEIRA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82148237',
        matricula_gps = '973102',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CRISTIANO DE OLIVEIRA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CRISTIANO DE OLIVEIRA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82148237', '973102', sup_id, eq_id);
    END IF;
    -- Employee: CRISTIANO FERREIRA DE HOLANDA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CRISTIANO FERREIRA DE HOLANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CRISTIANO FERREIRA DE HOLANDA', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: CRYSTHIAN MARCELINO SILVA FERREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-5X2',
        status = 'ATIVO',
        telefone = '31996357007',
        matricula_usiminas = '82192856',
        matricula_gps = '123700',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'CRYSTHIAN MARCELINO SILVA FERREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('CRYSTHIAN MARCELINO SILVA FERREIRA', 'MOTORISTA DE CAMINHAO', '19259', '16HS-5X2', 'ATIVO', '31996357007', '82192856', '123700', sup_id, eq_id);
    END IF;
    -- Employee: DANIEL MAURICIO CHECCUCCI
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DANIEL MAURICIO CHECCUCCI';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DANIEL MAURICIO CHECCUCCI', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: DAVI RODRIGUES MARTINS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DAVI RODRIGUES MARTINS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DAVI RODRIGUES MARTINS', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: DAVID SILVEIRA VASCONCELOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-A',
        status = 'EM AVISO',
        telefone = '31997930123',
        matricula_usiminas = '82124631',
        matricula_gps = '453',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DAVID SILVEIRA VASCONCELOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DAVID SILVEIRA VASCONCELOS', 'MOTORISTA DE CAMINHAO', '19259', '24HS-A', 'EM AVISO', '31997930123', '82124631', '453', sup_id, eq_id);
    END IF;
    -- Employee: DEIVISON LUIZ DE ABREU
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '05' OR (numero IS NULL AND '05' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '05') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31972175712',
        matricula_usiminas = '82130287',
        matricula_gps = '981835',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DEIVISON LUIZ DE ABREU';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DEIVISON LUIZ DE ABREU', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31972175712', '82130287', '981835', sup_id, eq_id);
    END IF;
    -- Employee: DENILSON DE LIMA ROCHA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31997247212',
        matricula_usiminas = '82153818',
        matricula_gps = '499',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DENILSON DE LIMA ROCHA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DENILSON DE LIMA ROCHA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31997247212', '82153818', '499', sup_id, eq_id);
    END IF;
    -- Employee: DHENIS MARTINS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31987957455',
        matricula_usiminas = '82146075',
        matricula_gps = '495',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DHENIS MARTINS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DHENIS MARTINS', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'ATIVO', '31987957455', '82146075', '495', sup_id, eq_id);
    END IF;
    -- Employee: DIEGO CLAUDIO GOMES SANTANA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '33991681463',
        matricula_usiminas = '82192859',
        matricula_gps = '981850',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DIEGO CLAUDIO GOMES SANTANA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DIEGO CLAUDIO GOMES SANTANA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-C', 'ATIVO', '33991681463', '82192859', '981850', sup_id, eq_id);
    END IF;
    -- Employee: DONIZETE DIAS GONCALVES
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31986045752',
        matricula_usiminas = '82141660',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DONIZETE DIAS GONCALVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DONIZETE DIAS GONCALVES', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31986045752', '82141660', '', sup_id, eq_id);
    END IF;
    -- Employee: DOUGLAS ALVES DA SILVA DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31987488557',
        matricula_usiminas = '82146879',
        matricula_gps = '966155',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'DOUGLAS ALVES DA SILVA DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('DOUGLAS ALVES DA SILVA DE SOUZA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '31987488557', '82146879', '966155', sup_id, eq_id);
    END IF;
    -- Employee: EBERTON RAFAEL DE ARAUJO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31987888932',
        matricula_usiminas = '82141662',
        matricula_gps = '970312',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EBERTON RAFAEL DE ARAUJO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EBERTON RAFAEL DE ARAUJO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31987888932', '82141662', '970312', sup_id, eq_id);
    END IF;
    -- Employee: EDIMILSON MENEZES DE BARROS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '31985411898',
        matricula_usiminas = '82192855',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EDIMILSON MENEZES DE BARROS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EDIMILSON MENEZES DE BARROS', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'EM AVISO', '31985411898', '82192855', '', sup_id, eq_id);
    END IF;
    -- Employee: EDMAR EMANOEL DE ALMEIDA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EDMAR EMANOEL DE ALMEIDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EDMAR EMANOEL DE ALMEIDA', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: EDSON GONCALVES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '04' OR (numero IS NULL AND '04' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '04') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31987236277',
        matricula_usiminas = '82110623',
        matricula_gps = '991617',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EDSON GONCALVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EDSON GONCALVES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31987236277', '82110623', '991617', sup_id, eq_id);
    END IF;
    -- Employee: EDSON MARTINS VIEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '31985903533',
        matricula_usiminas = '82122931',
        matricula_gps = '123704',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EDSON MARTINS VIEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EDSON MARTINS VIEIRA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'EM AVISO', '31985903533', '82122931', '123704', sup_id, eq_id);
    END IF;
    -- Employee: EDUARDO DA SILVA GABRIEL
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31996472689',
        matricula_usiminas = '82185719',
        matricula_gps = '966156',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EDUARDO DA SILVA GABRIEL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EDUARDO DA SILVA GABRIEL', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31996472689', '82185719', '966156', sup_id, eq_id);
    END IF;
    -- Employee: ELBERT GONCALVES COSTA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '04' OR (numero IS NULL AND '04' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '04') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31988800779',
        matricula_usiminas = '82153814',
        matricula_gps = '985891',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ELBERT GONCALVES COSTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ELBERT GONCALVES COSTA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31988800779', '82153814', '985891', sup_id, eq_id);
    END IF;
    -- Employee: ELIAS DA SILVA SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82112588',
        matricula_gps = '463',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ELIAS DA SILVA SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ELIAS DA SILVA SOUZA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82112588', '463', sup_id, eq_id);
    END IF;
    -- Employee: ELSON CARDOSO DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31988522491',
        matricula_usiminas = '82111327',
        matricula_gps = '473',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ELSON CARDOSO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ELSON CARDOSO DA SILVA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31988522491', '82111327', '473', sup_id, eq_id);
    END IF;
    -- Employee: ERICK HENRIQUE SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31985822667',
        matricula_usiminas = '82187328',
        matricula_gps = '992152',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ERICK HENRIQUE SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ERICK HENRIQUE SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '31985822667', '82187328', '992152', sup_id, eq_id);
    END IF;
    -- Employee: ERISON MARTINS DE CASTRO ALMEIDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'EM AVISO',
        telefone = '31982746597',
        matricula_usiminas = '82146416',
        matricula_gps = '986238',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ERISON MARTINS DE CASTRO ALMEIDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ERISON MARTINS DE CASTRO ALMEIDA', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'EM AVISO', '31982746597', '82146416', '986238', sup_id, eq_id);
    END IF;
    -- Employee: ERNANDO GILBERT DE ANDRADE
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '09' OR (numero IS NULL AND '09' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '09') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31997761178',
        matricula_usiminas = '82146905',
        matricula_gps = '966159',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ERNANDO GILBERT DE ANDRADE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ERNANDO GILBERT DE ANDRADE', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31997761178', '82146905', '966159', sup_id, eq_id);
    END IF;
    -- Employee: EVALDO JOSE DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '04' OR (numero IS NULL AND '04' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '04') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31985822667',
        matricula_usiminas = '82187328',
        matricula_gps = '982919',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EVALDO JOSE DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EVALDO JOSE DOS SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31985822667', '82187328', '982919', sup_id, eq_id);
    END IF;
    -- Employee: EVALDO SOUZA ABREU
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31981136128',
        matricula_usiminas = '82146690',
        matricula_gps = '985903',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EVALDO SOUZA ABREU';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EVALDO SOUZA ABREU', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31981136128', '82146690', '985903', sup_id, eq_id);
    END IF;
    -- Employee: EVERTON ANDRADE FONSECA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-5X2',
        status = 'EM AVISO',
        telefone = '31985850210',
        matricula_usiminas = '82194088',
        matricula_gps = '983024',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'EVERTON ANDRADE FONSECA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('EVERTON ANDRADE FONSECA', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-5X2', 'EM AVISO', '31985850210', '82194088', '983024', sup_id, eq_id);
    END IF;
    -- Employee: FABIO PEREIRA DE ANDRADE
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '⁠31989455716',
        matricula_usiminas = '82110662',
        matricula_gps = '986397',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'FABIO PEREIRA DE ANDRADE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('FABIO PEREIRA DE ANDRADE', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '⁠31989455716', '82110662', '986397', sup_id, eq_id);
    END IF;
    -- Employee: FABRICIO FABIANO DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31982758691',
        matricula_usiminas = '82193605',
        matricula_gps = '983480',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'FABRICIO FABIANO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('FABRICIO FABIANO DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31982758691', '82193605', '983480', sup_id, eq_id);
    END IF;
    -- Employee: FELIPE MARTINS DE OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '33991278817',
        matricula_usiminas = '82177824',
        matricula_gps = '985892',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'FELIPE MARTINS DE OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('FELIPE MARTINS DE OLIVEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '33991278817', '82177824', '985892', sup_id, eq_id);
    END IF;
    -- Employee: FERNANDO MARIA VENTURA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'EM AVISO',
        telefone = '31985850210',
        matricula_usiminas = '82194088',
        matricula_gps = '129241',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'FERNANDO MARIA VENTURA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('FERNANDO MARIA VENTURA', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'EM AVISO', '31985850210', '82194088', '129241', sup_id, eq_id);
    END IF;
    -- Employee: GABRIEL AFONSO DE SOUZA COSTA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '985914',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GABRIEL AFONSO DE SOUZA COSTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GABRIEL AFONSO DE SOUZA COSTA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '', '', '985914', sup_id, eq_id);
    END IF;
    -- Employee: GABRIEL CARRABBA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GABRIEL CARRABBA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GABRIEL CARRABBA', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: GABRIEL JUNIOR GOMES ARAUJO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82197790',
        matricula_gps = '496',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GABRIEL JUNIOR GOMES ARAUJO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GABRIEL JUNIOR GOMES ARAUJO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82197790', '496', sup_id, eq_id);
    END IF;
    -- Employee: GABRIELL VICTOR SANTOS AMARAL
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31984180387',
        matricula_usiminas = '82110958',
        matricula_gps = '965966',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GABRIELL VICTOR SANTOS AMARAL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GABRIELL VICTOR SANTOS AMARAL', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '31984180387', '82110958', '965966', sup_id, eq_id);
    END IF;
    -- Employee: GEIDER MORAIS MIRANDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31995885855',
        matricula_usiminas = '82164665',
        matricula_gps = '966125',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GEIDER MORAIS MIRANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GEIDER MORAIS MIRANDA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31995885855', '82164665', '966125', sup_id, eq_id);
    END IF;
    -- Employee: GENESIO ADAO MIRANDA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE OBRA I',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31981208648',
        matricula_usiminas = '82199896',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GENESIO ADAO MIRANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GENESIO ADAO MIRANDA', 'SUPERVISOR DE OBRA I', '18512', '', '', '31981208648', '82199896', '', sup_id, eq_id);
    END IF;
    -- Employee: GENILSON FAUSTINO DO CARMO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31994468854',
        matricula_usiminas = '82193880',
        matricula_gps = '981982',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GENILSON FAUSTINO DO CARMO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GENILSON FAUSTINO DO CARMO', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31994468854', '82193880', '981982', sup_id, eq_id);
    END IF;
    -- Employee: GERALDO DOS SANTOS BOTELHO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31984180387',
        matricula_usiminas = '82110958',
        matricula_gps = '124104',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GERALDO DOS SANTOS BOTELHO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GERALDO DOS SANTOS BOTELHO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31984180387', '82110958', '124104', sup_id, eq_id);
    END IF;
    -- Employee: GERALDO HILTON MOREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '33991439416',
        matricula_usiminas = '82144551',
        matricula_gps = '966950',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GERALDO HILTON MOREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GERALDO HILTON MOREIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '33991439416', '82144551', '966950', sup_id, eq_id);
    END IF;
    -- Employee: GERLANIO SIELVES FERNANDES
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31986694999',
        matricula_usiminas = '82110674',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GERLANIO SIELVES FERNANDES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GERLANIO SIELVES FERNANDES', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31986694999', '82110674', '', sup_id, eq_id);
    END IF;
    -- Employee: GESIEL DE OLIVEIRA COSTA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31986787487',
        matricula_usiminas = '82110903',
        matricula_gps = '966162',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GESIEL DE OLIVEIRA COSTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GESIEL DE OLIVEIRA COSTA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31986787487', '82110903', '966162', sup_id, eq_id);
    END IF;
    -- Employee: GILBERTO ALVES DOS SANTOS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31984671528',
        matricula_usiminas = '82119862',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GILBERTO ALVES DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GILBERTO ALVES DOS SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31984671528', '82119862', '', sup_id, eq_id);
    END IF;
    -- Employee: GILIARDES REINALDO ALMEIDA MIRANDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31994601476',
        matricula_usiminas = '82110955',
        matricula_gps = '992151',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GILIARDES REINALDO ALMEIDA MIRANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GILIARDES REINALDO ALMEIDA MIRANDA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'ATIVO', '31994601476', '82110955', '992151', sup_id, eq_id);
    END IF;
    -- Employee: GILKIARLEY RODRIGUES MAIA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31994468854',
        matricula_usiminas = '82193880',
        matricula_gps = '986442',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GILKIARLEY RODRIGUES MAIA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GILKIARLEY RODRIGUES MAIA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '31994468854', '82193880', '986442', sup_id, eq_id);
    END IF;
    -- Employee: GILSON DO CARMO ABREU
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82112585',
        matricula_gps = '966088',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GILSON DO CARMO ABREU';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GILSON DO CARMO ABREU', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'ATIVO', '', '82112585', '966088', sup_id, eq_id);
    END IF;
    -- Employee: GISELE SOCORRO LACERDA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO I',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GISELE SOCORRO LACERDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GISELE SOCORRO LACERDA', 'PROGRAMADOR DE MANUTENCAO I', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: GLEISON RIBEIRO CANDIDO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '986242',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GLEISON RIBEIRO CANDIDO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GLEISON RIBEIRO CANDIDO', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '', '', '986242', sup_id, eq_id);
    END IF;
    -- Employee: GRAZIELA MAGALHAES MONTEIRO DE AMORIM
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO I',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '31986878320',
        matricula_usiminas = '82194832',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GRAZIELA MAGALHAES MONTEIRO DE AMORIM';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GRAZIELA MAGALHAES MONTEIRO DE AMORIM', 'PROGRAMADOR DE MANUTENCAO I', '44428', '', '', '31986878320', '82194832', '', sup_id, eq_id);
    END IF;
    -- Employee: GUSTAVO HENRIQUE LIMA SOUSA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '31982036119',
        matricula_usiminas = '82187186',
        matricula_gps = '985896',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GUSTAVO HENRIQUE LIMA SOUSA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GUSTAVO HENRIQUE LIMA SOUSA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'EM AVISO', '31982036119', '82187186', '985896', sup_id, eq_id);
    END IF;
    -- Employee: GUSTAVO HENRIQUE MIRANDA DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '31989871149',
        matricula_usiminas = '82110705',
        matricula_gps = '123922',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'GUSTAVO HENRIQUE MIRANDA DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('GUSTAVO HENRIQUE MIRANDA DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'FÉRIAS', '31989871149', '82110705', '123922', sup_id, eq_id);
    END IF;
    -- Employee: HERMES JORGE DE FIGUEIREDO FILHO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31986540595',
        matricula_usiminas = '82131069',
        matricula_gps = '972341',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'HERMES JORGE DE FIGUEIREDO FILHO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('HERMES JORGE DE FIGUEIREDO FILHO', 'MOTORISTA DE CAMINHAO', '19259', 'SEM REGISTRO', 'ATIVO', '31986540595', '82131069', '972341', sup_id, eq_id);
    END IF;
    -- Employee: HUDSON DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82151782',
        matricula_gps = '968845',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'HUDSON DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('HUDSON DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '', '82151782', '968845', sup_id, eq_id);
    END IF;
    -- Employee: HUDSON RODRIGO CAMPOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'FÉRIAS',
        telefone = '31985056807',
        matricula_usiminas = '82110891',
        matricula_gps = '969595',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'HUDSON RODRIGO CAMPOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('HUDSON RODRIGO CAMPOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'FÉRIAS', '31985056807', '82110891', '969595', sup_id, eq_id);
    END IF;
    -- Employee: HUMBERTO MARQUES SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31987799402',
        matricula_usiminas = '82110667',
        matricula_gps = '966071',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'HUMBERTO MARQUES SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('HUMBERTO MARQUES SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '31987799402', '82110667', '966071', sup_id, eq_id);
    END IF;
    -- Employee: ICARO BERNARDO FAUSTO LOURENCO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'COORDENADOR DE OPERACOES',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31985528921',
        matricula_usiminas = '82189055',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ICARO BERNARDO FAUSTO LOURENCO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ICARO BERNARDO FAUSTO LOURENCO', 'COORDENADOR DE OPERACOES', '18512', '', '', '31985528921', '82189055', '', sup_id, eq_id);
    END IF;
    -- Employee: ILES BERNARDES DE SENA JUNIOR
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31988056961',
        matricula_usiminas = '82158588',
        matricula_gps = '969598',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ILES BERNARDES DE SENA JUNIOR';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ILES BERNARDES DE SENA JUNIOR', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31988056961', '82158588', '969598', sup_id, eq_id);
    END IF;
    -- Employee: ISAAC CRISTIAN SILVA ALVES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'EM AVISO',
        telefone = '31986689623',
        matricula_usiminas = '82187308',
        matricula_gps = '992150',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ISAAC CRISTIAN SILVA ALVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ISAAC CRISTIAN SILVA ALVES', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'EM AVISO', '31986689623', '82187308', '992150', sup_id, eq_id);
    END IF;
    -- Employee: ISRAEL BENTO DA COSTA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE AREA',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31989905908',
        matricula_usiminas = '82197786',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ISRAEL BENTO DA COSTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ISRAEL BENTO DA COSTA', 'SUPERVISOR DE AREA', '18512', '', '', '31989905908', '82197786', '', sup_id, eq_id);
    END IF;
    -- Employee: IVAN LUIZ MONTEIRO JUNIOR
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PLANEJADOR DE MANUTENCAO',
        cr = '48367',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '82187427',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'IVAN LUIZ MONTEIRO JUNIOR';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('IVAN LUIZ MONTEIRO JUNIOR', 'PLANEJADOR DE MANUTENCAO', '48367', '', '', '', '82187427', '', sup_id, eq_id);
    END IF;
    -- Employee: JADIR ANDRADE MEDEIROS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-5X2',
        status = 'ATIVO',
        telefone = '997986986',
        matricula_usiminas = '82128838',
        matricula_gps = '983179',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JADIR ANDRADE MEDEIROS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JADIR ANDRADE MEDEIROS', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-5X2', 'ATIVO', '997986986', '82128838', '983179', sup_id, eq_id);
    END IF;
    -- Employee: JEAN SIDNEI SANTOS SANCHES
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JEAN SIDNEI SANTOS SANCHES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JEAN SIDNEI SANTOS SANCHES', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: JEFERSON CARVALHO SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-5X2',
        status = 'FÉRIAS',
        telefone = '',
        matricula_usiminas = '82120908',
        matricula_gps = '981550',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JEFERSON CARVALHO SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JEFERSON CARVALHO SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '16HS-5X2', 'FÉRIAS', '', '82120908', '981550', sup_id, eq_id);
    END IF;
    -- Employee: JEFERSON LIMA OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31987799402',
        matricula_usiminas = '82110667',
        matricula_gps = '966152',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JEFERSON LIMA OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JEFERSON LIMA OLIVEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '31987799402', '82110667', '966152', sup_id, eq_id);
    END IF;
    -- Employee: JENESSI ASSUNCAO MIRANDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '31996388506',
        matricula_usiminas = '82120909',
        matricula_gps = '966147',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JENESSI ASSUNCAO MIRANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JENESSI ASSUNCAO MIRANDA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'FÉRIAS', '31996388506', '82120909', '966147', sup_id, eq_id);
    END IF;
    -- Employee: JESUS JOSE DE MEDEIROS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JESUS JOSE DE MEDEIROS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JESUS JOSE DE MEDEIROS', 'MOTORISTA', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: JHONATAN HENRIQUE SANTOS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'TECNICO DE SEGURANCA DO TRABALHO',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JHONATAN HENRIQUE SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JHONATAN HENRIQUE SANTOS', 'TECNICO DE SEGURANCA DO TRABALHO', '18512', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: JOAO AMBROSIO DE MENEZES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31986689623',
        matricula_usiminas = '82187308',
        matricula_gps = '986243',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO AMBROSIO DE MENEZES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO AMBROSIO DE MENEZES', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'ATIVO', '31986689623', '82187308', '986243', sup_id, eq_id);
    END IF;
    -- Employee: JOAO BATISTA SOARES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82194815',
        matricula_gps = '966157',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO BATISTA SOARES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO BATISTA SOARES', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'EM AVISO', '', '82194815', '966157', sup_id, eq_id);
    END IF;
    -- Employee: JOAO EVANGELISTA DOS REIS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82110995',
        matricula_gps = '985902',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO EVANGELISTA DOS REIS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO EVANGELISTA DOS REIS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82110995', '985902', sup_id, eq_id);
    END IF;
    -- Employee: JOAO FERREIRA SANTANA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31996658839',
        matricula_usiminas = '82192339',
        matricula_gps = '985913',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO FERREIRA SANTANA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO FERREIRA SANTANA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-C', 'ATIVO', '31996658839', '82192339', '985913', sup_id, eq_id);
    END IF;
    -- Employee: JOAO MOREIRA DE BARROS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '',
        matricula_usiminas = '82110976',
        matricula_gps = '966003',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO MOREIRA DE BARROS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO MOREIRA DE BARROS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'FÉRIAS', '', '82110976', '966003', sup_id, eq_id);
    END IF;
    -- Employee: JOAO PAULO DE CASTRO VASCONCELOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31986434492',
        matricula_usiminas = '966147',
        matricula_gps = '966343',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO PAULO DE CASTRO VASCONCELOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO PAULO DE CASTRO VASCONCELOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31986434492', '966147', '966343', sup_id, eq_id);
    END IF;
    -- Employee: JOAO RICARDO ROQUE DA FONSECA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82115057',
        matricula_gps = '967644',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAO RICARDO ROQUE DA FONSECA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAO RICARDO ROQUE DA FONSECA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'EM AVISO', '', '82115057', '967644', sup_id, eq_id);
    END IF;
    -- Employee: JOAQUIM FRANCISCO DE ALMEIDA NETO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31999181280',
        matricula_usiminas = '82110768',
        matricula_gps = '454',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOAQUIM FRANCISCO DE ALMEIDA NETO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOAQUIM FRANCISCO DE ALMEIDA NETO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31999181280', '82110768', '454', sup_id, eq_id);
    END IF;
    -- Employee: JOHNATAN SOUZA DE JESUS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '986232',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOHNATAN SOUZA DE JESUS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOHNATAN SOUZA DE JESUS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'EM AVISO', '', '', '986232', sup_id, eq_id);
    END IF;
    -- Employee: JOSE ALVES DA SILVA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31983650505',
        matricula_usiminas = '82157219',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE ALVES DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE ALVES DA SILVA', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31983650505', '82157219', '', sup_id, eq_id);
    END IF;
    -- Employee: JOSE APARECIDO DA ROCHA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82133717',
        matricula_gps = '123759',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE APARECIDO DA ROCHA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE APARECIDO DA ROCHA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'EM AVISO', '', '82133717', '123759', sup_id, eq_id);
    END IF;
    -- Employee: JOSE APARECIDO DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31984685054',
        matricula_usiminas = '82110861',
        matricula_gps = '973029',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE APARECIDO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE APARECIDO DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31984685054', '82110861', '973029', sup_id, eq_id);
    END IF;
    -- Employee: JOSE CARLOS DIAS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31988156216',
        matricula_usiminas = '82110997',
        matricula_gps = '983019',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE CARLOS DIAS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE CARLOS DIAS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31988156216', '82110997', '983019', sup_id, eq_id);
    END IF;
    -- Employee: JOSE EUGENIO DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82115057',
        matricula_gps = '966116',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE EUGENIO DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE EUGENIO DE SOUZA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '', '82115057', '966116', sup_id, eq_id);
    END IF;
    -- Employee: JOSE EUSTAQUIO DOMINGUES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82146137',
        matricula_gps = '981865',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE EUSTAQUIO DOMINGUES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE EUSTAQUIO DOMINGUES', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'ATIVO', '', '82146137', '981865', sup_id, eq_id);
    END IF;
    -- Employee: JOSE GERALDO GOMES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '986486',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE GERALDO GOMES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE GERALDO GOMES', 'MOTORISTA DE CAMINHAO', '19259', '24HS-A', 'ATIVO', '', '', '986486', sup_id, eq_id);
    END IF;
    -- Employee: JOSE RAIMUNDO MAGALHAES SANTOS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE RAIMUNDO MAGALHAES SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE RAIMUNDO MAGALHAES SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: JOSE ROBERTO COELHO CARVALHO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82154779',
        matricula_gps = '986007',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE ROBERTO COELHO CARVALHO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE ROBERTO COELHO CARVALHO', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '', '82154779', '986007', sup_id, eq_id);
    END IF;
    -- Employee: JOSE ROBERTO MIGUEL
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82130031',
        matricula_gps = '129377',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSE ROBERTO MIGUEL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSE ROBERTO MIGUEL', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '', '82130031', '129377', sup_id, eq_id);
    END IF;
    -- Employee: JOSUE DO NASCIMENTO CUPERTINO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '27999194457',
        matricula_usiminas = '82194044',
        matricula_gps = '985904',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOSUE DO NASCIMENTO CUPERTINO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOSUE DO NASCIMENTO CUPERTINO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '27999194457', '82194044', '985904', sup_id, eq_id);
    END IF;
    -- Employee: JOVIANO RIBEIRO DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-5X2',
        status = 'EM AVISO',
        telefone = '31986297304',
        matricula_usiminas = '82200112',
        matricula_gps = '443',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JOVIANO RIBEIRO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JOVIANO RIBEIRO DA SILVA', 'MOTORISTA DE CAMINHAO', '19259', '16HS-5X2', 'EM AVISO', '31986297304', '82200112', '443', sup_id, eq_id);
    END IF;
    -- Employee: JUNIO RODRIGUES DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31998613061',
        matricula_usiminas = '82192866',
        matricula_gps = '973086',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JUNIO RODRIGUES DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JUNIO RODRIGUES DE SOUZA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'ATIVO', '31998613061', '82192866', '973086', sup_id, eq_id);
    END IF;
    -- Employee: JUNIOR PEREIRA DO CARMO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE OBRA I',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31973326787',
        matricula_usiminas = '82110694',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'JUNIOR PEREIRA DO CARMO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('JUNIOR PEREIRA DO CARMO', 'SUPERVISOR DE OBRA I', '18512', '', '', '31973326787', '82110694', '', sup_id, eq_id);
    END IF;
    -- Employee: KARINA SOARES PIRES FERREIRA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'KARINA SOARES PIRES FERREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('KARINA SOARES PIRES FERREIRA', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: KELVSLAYNE DAMASCENO SOARES MARTINS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'KELVSLAYNE DAMASCENO SOARES MARTINS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('KELVSLAYNE DAMASCENO SOARES MARTINS', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: KENEDY WISLEY DA SILVA VALENTIM
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '33988195965',
        matricula_usiminas = '82199890',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'KENEDY WISLEY DA SILVA VALENTIM';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('KENEDY WISLEY DA SILVA VALENTIM', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '33988195965', '82199890', '', sup_id, eq_id);
    END IF;
    -- Employee: KEVIN PAULO RIBEIRO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31985564816',
        matricula_usiminas = '82168851',
        matricula_gps = '965904',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'KEVIN PAULO RIBEIRO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('KEVIN PAULO RIBEIRO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '31985564816', '82168851', '965904', sup_id, eq_id);
    END IF;
    -- Employee: KLARCSON DIEGO A DE S NARCISO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '985920',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'KLARCSON DIEGO A DE S NARCISO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('KLARCSON DIEGO A DE S NARCISO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '', '', '985920', sup_id, eq_id);
    END IF;
    -- Employee: LARISSA SILVA BOLONHA DE SOUZA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PLANEJADOR DE MANUTENCAO',
        cr = '48367',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LARISSA SILVA BOLONHA DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LARISSA SILVA BOLONHA DE SOUZA', 'PLANEJADOR DE MANUTENCAO', '48367', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: LEANDRO ANDRE DE JESUS BATISTA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '05' OR (numero IS NULL AND '05' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '05') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82142777',
        matricula_gps = '981863',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LEANDRO ANDRE DE JESUS BATISTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LEANDRO ANDRE DE JESUS BATISTA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'EM AVISO', '', '82142777', '981863', sup_id, eq_id);
    END IF;
    -- Employee: LEONARDO DE SOUZA CAMPOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31988178489',
        matricula_usiminas = '82130295',
        matricula_gps = '984146',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LEONARDO DE SOUZA CAMPOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LEONARDO DE SOUZA CAMPOS', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'ATIVO', '31988178489', '82130295', '984146', sup_id, eq_id);
    END IF;
    -- Employee: LEONARDO PROCOPIO DE ANDRADE
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '05' OR (numero IS NULL AND '05' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '05') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31999228653',
        matricula_usiminas = '82174977',
        matricula_gps = '986436',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LEONARDO PROCOPIO DE ANDRADE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LEONARDO PROCOPIO DE ANDRADE', 'MOTORISTA DE CAMINHAO', '19259', 'SEM REGISTRO', 'ATIVO', '31999228653', '82174977', '986436', sup_id, eq_id);
    END IF;
    -- Employee: LUAN CALDEIRA DUTRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '33999729082',
        matricula_usiminas = '82192847',
        matricula_gps = '981855',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LUAN CALDEIRA DUTRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LUAN CALDEIRA DUTRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'EM AVISO', '33999729082', '82192847', '981855', sup_id, eq_id);
    END IF;
    -- Employee: LUCAS JACINTO DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31988790780',
        matricula_usiminas = '82111002',
        matricula_gps = '973096',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LUCAS JACINTO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LUCAS JACINTO DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31988790780', '82111002', '973096', sup_id, eq_id);
    END IF;
    -- Employee: LUCAS MARTINS SOUZA PAIVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'EM AVISO',
        telefone = '31971986214',
        matricula_usiminas = '82146135',
        matricula_gps = '456',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LUCAS MARTINS SOUZA PAIVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LUCAS MARTINS SOUZA PAIVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'EM AVISO', '31971986214', '82146135', '456', sup_id, eq_id);
    END IF;
    -- Employee: LUCAS PEREIRA DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31973395923',
        matricula_usiminas = '82193268',
        matricula_gps = '968844',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LUCAS PEREIRA DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LUCAS PEREIRA DOS SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'ATIVO', '31973395923', '82193268', '968844', sup_id, eq_id);
    END IF;
    -- Employee: LUIS GUILHERME DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82199900',
        matricula_gps = '123702',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'LUIS GUILHERME DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('LUIS GUILHERME DE SOUZA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82199900', '123702', sup_id, eq_id);
    END IF;
    -- Employee: MAGNO DA SILVA ROBERTO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '12' OR (numero IS NULL AND '12' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '12') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '985999128',
        matricula_usiminas = '82191626',
        matricula_gps = '966165',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAGNO DA SILVA ROBERTO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAGNO DA SILVA ROBERTO', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '985999128', '82191626', '966165', sup_id, eq_id);
    END IF;
    -- Employee: MAIK PEREIRA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '33999729082',
        matricula_usiminas = '82192847',
        matricula_gps = '985907',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAIK PEREIRA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAIK PEREIRA SILVA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-A', 'ATIVO', '33999729082', '82192847', '985907', sup_id, eq_id);
    END IF;
    -- Employee: MAKSON WILLEN DO NASCIMENTO COURA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31997109969',
        matricula_usiminas = '82192852',
        matricula_gps = '123699',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAKSON WILLEN DO NASCIMENTO COURA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAKSON WILLEN DO NASCIMENTO COURA', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'ATIVO', '31997109969', '82192852', '123699', sup_id, eq_id);
    END IF;
    -- Employee: MARCELO LEANDRO PEREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '12' OR (numero IS NULL AND '12' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '12') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31988255651',
        matricula_usiminas = '82110761',
        matricula_gps = '985890',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCELO LEANDRO PEREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCELO LEANDRO PEREIRA', 'MOTORISTA DE CAMINHAO', '19259', 'SEM REGISTRO', 'ATIVO', '31988255651', '82110761', '985890', sup_id, eq_id);
    END IF;
    -- Employee: MARCIA LAURENTINO DA SILVA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31985377588',
        matricula_usiminas = '82136021',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCIA LAURENTINO DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCIA LAURENTINO DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '31985377588', '82136021', '', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS ANTONIO SANTIAGO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '33998228196',
        matricula_usiminas = '82130285',
        matricula_gps = '984026',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS ANTONIO SANTIAGO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS ANTONIO SANTIAGO', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '33998228196', '82130285', '984026', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS BRUNO BARBOSA COSTA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31987943313',
        matricula_usiminas = '82192865',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS BRUNO BARBOSA COSTA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS BRUNO BARBOSA COSTA', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31987943313', '82192865', '', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS DINIS DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82111133',
        matricula_gps = '966309',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS DINIS DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS DINIS DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '', '82111133', '966309', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS VINICIUS ALMEIDA DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-5X2',
        status = 'EM AVISO',
        telefone = '31971986214',
        matricula_usiminas = '82146135',
        matricula_gps = '459',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS VINICIUS ALMEIDA DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS VINICIUS ALMEIDA DE SOUZA', 'MOTORISTA DE CAMINHAO', '19259', '16HS-5X2', 'EM AVISO', '31971986214', '82146135', '459', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS VINICIUS DA SILVA FERREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31987934197',
        matricula_usiminas = '82190195',
        matricula_gps = '465',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS VINICIUS DA SILVA FERREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS VINICIUS DA SILVA FERREIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31987934197', '82190195', '465', sup_id, eq_id);
    END IF;
    -- Employee: MARCOS VINICIUS RODRIGUES DE OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31997057627',
        matricula_usiminas = '82153816',
        matricula_gps = '971125',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARCOS VINICIUS RODRIGUES DE OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARCOS VINICIUS RODRIGUES DE OLIVEIRA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-C', 'ATIVO', '31997057627', '82153816', '971125', sup_id, eq_id);
    END IF;
    -- Employee: MARILYS CRISTINA FERNANDES DE SOUZA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARILYS CRISTINA FERNANDES DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARILYS CRISTINA FERNANDES DE SOUZA', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: MARLEY LISBOA VIEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '985999128',
        matricula_usiminas = '82191626',
        matricula_gps = '973089',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MARLEY LISBOA VIEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MARLEY LISBOA VIEIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '985999128', '82191626', '973089', sup_id, eq_id);
    END IF;
    -- Employee: MATEUS DA SILVA BASILIO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'CJ' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('CJ', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'TECNICO DE SEGURANCA DO TRABALHO',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31986923537',
        matricula_usiminas = '82154802',
        matricula_gps = '981851',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MATEUS DA SILVA BASILIO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MATEUS DA SILVA BASILIO', 'TECNICO DE SEGURANCA DO TRABALHO', '18512', 'ADM', 'ATIVO', '31986923537', '82154802', '981851', sup_id, eq_id);
    END IF;
    -- Employee: MATEUS PEREIRA TAVARES GOMES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82111336',
        matricula_gps = '966292',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MATEUS PEREIRA TAVARES GOMES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MATEUS PEREIRA TAVARES GOMES', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '', '82111336', '966292', sup_id, eq_id);
    END IF;
    -- Employee: MATHEUS DE OLIVEIRA FIGUEIREDO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31986620076',
        matricula_usiminas = '82153811',
        matricula_gps = '985932',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MATHEUS DE OLIVEIRA FIGUEIREDO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MATHEUS DE OLIVEIRA FIGUEIREDO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31986620076', '82153811', '985932', sup_id, eq_id);
    END IF;
    -- Employee: MATHEUS HENRIQUE DE ANDRADE ALMEIDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82199899',
        matricula_gps = '984106',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MATHEUS HENRIQUE DE ANDRADE ALMEIDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MATHEUS HENRIQUE DE ANDRADE ALMEIDA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '', '82199899', '984106', sup_id, eq_id);
    END IF;
    -- Employee: MATUSALEM JOSE DOS SANTOS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE OBRA I',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31988424006',
        matricula_usiminas = '82110690',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MATUSALEM JOSE DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MATUSALEM JOSE DOS SANTOS', 'SUPERVISOR DE OBRA I', '18512', '', '', '31988424006', '82110690', '', sup_id, eq_id);
    END IF;
    -- Employee: MAURO HENRIQUE RIBEIRO DE ABREU
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'ALMOXARIFE I',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '82193569',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAURO HENRIQUE RIBEIRO DE ABREU';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAURO HENRIQUE RIBEIRO DE ABREU', 'ALMOXARIFE I', '18512', '', '', '', '82193569', '', sup_id, eq_id);
    END IF;
    -- Employee: MAX WEL SOUZA MACHADO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31986751249',
        matricula_usiminas = '82111756',
        matricula_gps = '966543',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAX WEL SOUZA MACHADO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAX WEL SOUZA MACHADO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31986751249', '82111756', '966543', sup_id, eq_id);
    END IF;
    -- Employee: MAXIMILIANO BARBOSA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82199895',
        matricula_gps = '123590',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MAXIMILIANO BARBOSA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MAXIMILIANO BARBOSA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82199895', '123590', sup_id, eq_id);
    END IF;
    -- Employee: MESSIAS PATRICIO HONORATO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82111133',
        matricula_gps = '966083',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'MESSIAS PATRICIO HONORATO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('MESSIAS PATRICIO HONORATO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82111133', '966083', sup_id, eq_id);
    END IF;
    -- Employee: NOEL DE FREITAS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31987072154',
        matricula_usiminas = '82146325',
        matricula_gps = '966256',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'NOEL DE FREITAS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('NOEL DE FREITAS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31987072154', '82146325', '966256', sup_id, eq_id);
    END IF;
    -- Employee: OSVALDO DE JESUS BARBOSA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82151415',
        matricula_gps = '1948',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'OSVALDO DE JESUS BARBOSA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('OSVALDO DE JESUS BARBOSA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '', '82151415', '1948', sup_id, eq_id);
    END IF;
    -- Employee: OZIAS GOMES DE OLIVEIRA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE AREA',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31994383506',
        matricula_usiminas = '82110779',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'OZIAS GOMES DE OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('OZIAS GOMES DE OLIVEIRA', 'SUPERVISOR DE AREA', '18512', '', '', '31994383506', '82110779', '', sup_id, eq_id);
    END IF;
    -- Employee: PAULO BRAZ DE AQUINO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31986269088',
        matricula_usiminas = '82146820',
        matricula_gps = '965939',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PAULO BRAZ DE AQUINO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PAULO BRAZ DE AQUINO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31986269088', '82146820', '965939', sup_id, eq_id);
    END IF;
    -- Employee: PAULO CESAR BORGES EMBURANA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31989396725',
        matricula_usiminas = '82124627',
        matricula_gps = '983348',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PAULO CESAR BORGES EMBURANA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PAULO CESAR BORGES EMBURANA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31989396725', '82124627', '983348', sup_id, eq_id);
    END IF;
    -- Employee: PAULO GOMES DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31987427684',
        matricula_usiminas = '82130233',
        matricula_gps = '461',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PAULO GOMES DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PAULO GOMES DOS SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31987427684', '82130233', '461', sup_id, eq_id);
    END IF;
    -- Employee: PAULO LUCIANO MARTINS DE ALMEIDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82111336',
        matricula_gps = '966040',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PAULO LUCIANO MARTINS DE ALMEIDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PAULO LUCIANO MARTINS DE ALMEIDA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82111336', '966040', sup_id, eq_id);
    END IF;
    -- Employee: PAULO VICTOR SOUZA FERREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '07' OR (numero IS NULL AND '07' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '07') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31985377615',
        matricula_usiminas = '82110809',
        matricula_gps = '966018',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PAULO VICTOR SOUZA FERREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PAULO VICTOR SOUZA FERREIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31985377615', '82110809', '966018', sup_id, eq_id);
    END IF;
    -- Employee: PEDRO AUGUSTO DE SOUZA ALVES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82199899',
        matricula_gps = '462',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PEDRO AUGUSTO DE SOUZA ALVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PEDRO AUGUSTO DE SOUZA ALVES', 'MOTORISTA DE CAMINHAO', '19259', '24HS-B', 'ATIVO', '', '82199899', '462', sup_id, eq_id);
    END IF;
    -- Employee: PRISCILA FONTES PRIETO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'PRISCILA FONTES PRIETO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('PRISCILA FONTES PRIETO', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: RAUL OLIVEIRA MIRANDA RAFAEL
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31986751249',
        matricula_usiminas = '82111756',
        matricula_gps = '460',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RAUL OLIVEIRA MIRANDA RAFAEL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RAUL OLIVEIRA MIRANDA RAFAEL', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31986751249', '82111756', '460', sup_id, eq_id);
    END IF;
    -- Employee: RAYLANDER MAIKON DE SOUZA FERNANDES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31985749071',
        matricula_usiminas = '82151370',
        matricula_gps = '966173',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RAYLANDER MAIKON DE SOUZA FERNANDES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RAYLANDER MAIKON DE SOUZA FERNANDES', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'ATIVO', '31985749071', '82151370', '966173', sup_id, eq_id);
    END IF;
    -- Employee: REDILSON BENTO COELHO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '06' OR (numero IS NULL AND '06' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '06') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31999654547',
        matricula_usiminas = '82110781',
        matricula_gps = '981857',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'REDILSON BENTO COELHO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('REDILSON BENTO COELHO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31999654547', '82110781', '981857', sup_id, eq_id);
    END IF;
    -- Employee: REGINALDO ALVES DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31982434914',
        matricula_usiminas = '82110762',
        matricula_gps = '966185',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'REGINALDO ALVES DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('REGINALDO ALVES DA SILVA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31982434914', '82110762', '966185', sup_id, eq_id);
    END IF;
    -- Employee: RENAN MICHEL DE SOUSA MARTINS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'CJ' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('CJ', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82137436',
        matricula_gps = '172',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RENAN MICHEL DE SOUSA MARTINS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RENAN MICHEL DE SOUSA MARTINS', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '', '82137436', '172', sup_id, eq_id);
    END IF;
    -- Employee: RENATA DA COSTA SILVA
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PLANEJADOR DE MANUTENCAO',
        cr = '48367',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RENATA DA COSTA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RENATA DA COSTA SILVA', 'PLANEJADOR DE MANUTENCAO', '48367', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: RENATO SILVA RAMOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31971279526',
        matricula_usiminas = '82110626',
        matricula_gps = '966021',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RENATO SILVA RAMOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RENATO SILVA RAMOS', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'ATIVO', '31971279526', '82110626', '966021', sup_id, eq_id);
    END IF;
    -- Employee: RENATO TORRES DE MENEZES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'CJ' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('CJ', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '33999500668',
        matricula_usiminas = '82195765',
        matricula_gps = '397',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RENATO TORRES DE MENEZES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RENATO TORRES DE MENEZES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '33999500668', '82195765', '397', sup_id, eq_id);
    END IF;
    -- Employee: RICARDO MARCIO VALENTE
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RICARDO MARCIO VALENTE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RICARDO MARCIO VALENTE', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: RILDON DO CARMO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'MATUSALEM' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-B',
        status = 'ATIVO',
        telefone = '31991897350',
        matricula_usiminas = '82146328',
        matricula_gps = '973080',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RILDON DO CARMO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RILDON DO CARMO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-B', 'ATIVO', '31991897350', '82146328', '973080', sup_id, eq_id);
    END IF;
    -- Employee: ROBSON RAFAEL DE ARAUJO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ROBSON RAFAEL DE ARAUJO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ROBSON RAFAEL DE ARAUJO', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: ROGERIO AUGUSTO FELIPE
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31989641222',
        matricula_usiminas = '82110881',
        matricula_gps = '982958',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ROGERIO AUGUSTO FELIPE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ROGERIO AUGUSTO FELIPE', 'MOTORISTA DE CAMINHAO', '19259', '16HS-6X3', 'ATIVO', '31989641222', '82110881', '982958', sup_id, eq_id);
    END IF;
    -- Employee: ROGILDO MIGUEL DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '31985377615',
        matricula_usiminas = '82110809',
        matricula_gps = '123701',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ROGILDO MIGUEL DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ROGILDO MIGUEL DOS SANTOS', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'FÉRIAS', '31985377615', '82110809', '123701', sup_id, eq_id);
    END IF;
    -- Employee: ROMULO DE SOUZA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-A',
        status = 'ATIVO',
        telefone = '31987213044',
        matricula_usiminas = '82146342',
        matricula_gps = '992168',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'ROMULO DE SOUZA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('ROMULO DE SOUZA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-A', 'ATIVO', '31987213044', '82146342', '992168', sup_id, eq_id);
    END IF;
    -- Employee: RONALD APARECIDO ALVES FIGUEIREDO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31986963991',
        matricula_usiminas = '82146326',
        matricula_gps = '966024',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RONALD APARECIDO ALVES FIGUEIREDO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RONALD APARECIDO ALVES FIGUEIREDO', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31986963991', '82146326', '966024', sup_id, eq_id);
    END IF;
    -- Employee: RONEY PETERSON MOREIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '31992495443',
        matricula_usiminas = '82110660',
        matricula_gps = '977502',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RONEY PETERSON MOREIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RONEY PETERSON MOREIRA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'FÉRIAS', '31992495443', '82110660', '977502', sup_id, eq_id);
    END IF;
    -- Employee: RUAN PEDRO SIQUEIRA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82192863',
        matricula_gps = '983943',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'RUAN PEDRO SIQUEIRA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('RUAN PEDRO SIQUEIRA SILVA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'EM AVISO', '', '82192863', '983943', sup_id, eq_id);
    END IF;
    -- Employee: SANDRO ALCANTARA DE PAULA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '31989461987',
        matricula_usiminas = '82110784',
        matricula_gps = '966289',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SANDRO ALCANTARA DE PAULA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SANDRO ALCANTARA DE PAULA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'EM AVISO', '31989461987', '82110784', '966289', sup_id, eq_id);
    END IF;
    -- Employee: SANDRO CRUZ DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '33999251196',
        matricula_usiminas = '82110634',
        matricula_gps = '123624',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SANDRO CRUZ DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SANDRO CRUZ DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '33999251196', '82110634', '123624', sup_id, eq_id);
    END IF;
    -- Employee: SARLEY ALVES BRAGANCA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '11' OR (numero IS NULL AND '11' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '11') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31988020828',
        matricula_usiminas = '82151695',
        matricula_gps = '986346',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SARLEY ALVES BRAGANCA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SARLEY ALVES BRAGANCA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-D', 'ATIVO', '31988020828', '82151695', '986346', sup_id, eq_id);
    END IF;
    -- Employee: SEBASTIAO RIBEIRO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE AREA',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31985228434',
        matricula_usiminas = '82110770',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SEBASTIAO RIBEIRO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SEBASTIAO RIBEIRO', 'SUPERVISOR DE AREA', '18512', '', '', '31985228434', '82110770', '', sup_id, eq_id);
    END IF;
    -- Employee: SERGIO JOSE NEVES GONCALVES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31989773299',
        matricula_usiminas = '82110661',
        matricula_gps = '123851',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SERGIO JOSE NEVES GONCALVES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SERGIO JOSE NEVES GONCALVES', 'MOTORISTA DE CAMINHAO', '19259', '24HS-C', 'ATIVO', '31989773299', '82110661', '123851', sup_id, eq_id);
    END IF;
    -- Employee: SILVANIL MATEUS DAS GRACAS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '06' OR (numero IS NULL AND '06' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '06') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82139043',
        matricula_gps = '481',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'SILVANIL MATEUS DAS GRACAS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('SILVANIL MATEUS DAS GRACAS', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'EM AVISO', '', '82139043', '481', sup_id, eq_id);
    END IF;
    -- Employee: STEPHANIE VERDE DE MELO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PROGRAMADOR DE MANUTENCAO',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'STEPHANIE VERDE DE MELO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('STEPHANIE VERDE DE MELO', 'PROGRAMADOR DE MANUTENCAO', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: THIAGO RAMOS DE OLIVEIRA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEBASTIÃO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '04' OR (numero IS NULL AND '04' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '04') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31992541540',
        matricula_usiminas = '82130288',
        matricula_gps = '464',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'THIAGO RAMOS DE OLIVEIRA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('THIAGO RAMOS DE OLIVEIRA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31992541540', '82130288', '464', sup_id, eq_id);
    END IF;
    -- Employee: TIAGO GONCALVES FONSECA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-C',
        status = 'EM AVISO',
        telefone = '',
        matricula_usiminas = '82193881',
        matricula_gps = '966020',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'TIAGO GONCALVES FONSECA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('TIAGO GONCALVES FONSECA', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-C', 'EM AVISO', '', '82193881', '966020', sup_id, eq_id);
    END IF;
    -- Employee: TIAGO SILVA SOARES
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31991505085',
        matricula_usiminas = '82153813',
        matricula_gps = '986315',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'TIAGO SILVA SOARES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('TIAGO SILVA SOARES', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31991505085', '82153813', '986315', sup_id, eq_id);
    END IF;
    -- Employee: UDSON LUIZ SANTOS ROSA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '09' OR (numero IS NULL AND '09' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '09') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '33998702832',
        matricula_usiminas = '82153810',
        matricula_gps = '129641',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'UDSON LUIZ SANTOS ROSA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('UDSON LUIZ SANTOS ROSA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '33998702832', '82153810', '129641', sup_id, eq_id);
    END IF;
    -- Employee: VALDECI ROSA DO NASCIMENTO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '01' OR (numero IS NULL AND '01' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '01') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-6X3',
        status = 'ATIVO',
        telefone = '31988438354',
        matricula_usiminas = '82187343',
        matricula_gps = '966054',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'VALDECI ROSA DO NASCIMENTO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('VALDECI ROSA DO NASCIMENTO', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-6X3', 'ATIVO', '31988438354', '82187343', '966054', sup_id, eq_id);
    END IF;
    -- Employee: VALDIR DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '02' OR (numero IS NULL AND '02' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '02') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31986781661',
        matricula_usiminas = '82110710',
        matricula_gps = '986653',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'VALDIR DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('VALDIR DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '31986781661', '82110710', '986653', sup_id, eq_id);
    END IF;
    -- Employee: VINICIUS JUNIO DA COSTA MARTINS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'WELLISON' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AP' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AP', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '24HS-D',
        status = 'ATIVO',
        telefone = '31998614565',
        matricula_usiminas = '82167106',
        matricula_gps = '123591',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'VINICIUS JUNIO DA COSTA MARTINS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('VINICIUS JUNIO DA COSTA MARTINS', 'OPERADOR DE EQUIPAMENTOS', '18512', '24HS-D', 'ATIVO', '31998614565', '82167106', '123591', sup_id, eq_id);
    END IF;
    -- Employee: VINICIUS VALENTIM RIBEIRO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'ASP' AND (numero = '05' OR (numero IS NULL AND '05' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('ASP', '05') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '',
        matricula_usiminas = '82199892',
        matricula_gps = '965960',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'VINICIUS VALENTIM RIBEIRO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('VINICIUS VALENTIM RIBEIRO', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '', '82199892', '965960', sup_id, eq_id);
    END IF;
    -- Employee: VITORIA WELLINDA ALMEIDA AMARAL
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE AREA',
        cr = '44428',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'VITORIA WELLINDA ALMEIDA AMARAL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('VITORIA WELLINDA ALMEIDA AMARAL', 'SUPERVISOR DE AREA', '44428', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: WALACE DAS GRACAS SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'OZIAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-A',
        status = 'EM AVISO',
        telefone = '31995998068',
        matricula_usiminas = '82151927',
        matricula_gps = '986654',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WALACE DAS GRACAS SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WALACE DAS GRACAS SILVA', 'MOTORISTA DE CAMINHAO', '19259', '24HS-A', 'EM AVISO', '31995998068', '82151927', '986654', sup_id, eq_id);
    END IF;
    -- Employee: WALISSON LUCAS DOS SANTOS
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ISRAEL' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'AV' AND (numero = '08' OR (numero IS NULL AND '08' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('AV', '08') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '24HS-C',
        status = 'ATIVO',
        telefone = '31988359975',
        matricula_usiminas = '82110929',
        matricula_gps = '966294',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WALISSON LUCAS DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WALISSON LUCAS DOS SANTOS', 'MOTORISTA DE CAMINHAO', '19259', '24HS-C', 'ATIVO', '31988359975', '82110929', '966294', sup_id, eq_id);
    END IF;
    -- Employee: WALQUER ANTONIO LUCAS DE OLIVE
    SELECT id INTO sup_id FROM public.supervisors WHERE name = '16 HORAS' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'MT' AND (numero = NULL OR (numero IS NULL AND NULL IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('MT', NULL) RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '16HS-5X2',
        status = 'EM AVISO',
        telefone = '31991505085',
        matricula_usiminas = '82153813',
        matricula_gps = '123703',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WALQUER ANTONIO LUCAS DE OLIVE';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WALQUER ANTONIO LUCAS DE OLIVE', 'OPERADOR DE EQUIPAMENTOS', '18512', '16HS-5X2', 'EM AVISO', '31991505085', '82153813', '123703', sup_id, eq_id);
    END IF;
    -- Employee: WANIO  FERREIRA DE ARANDA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'EM AVISO',
        telefone = '31981074208',
        matricula_usiminas = '82157747',
        matricula_gps = '965963',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WANIO  FERREIRA DE ARANDA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WANIO  FERREIRA DE ARANDA', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'EM AVISO', '31981074208', '82157747', '965963', sup_id, eq_id);
    END IF;
    -- Employee: WARLISON CRISTIAN SANTOS ABREU
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '31988089771',
        matricula_usiminas = '82158508',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WARLISON CRISTIAN SANTOS ABREU';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WARLISON CRISTIAN SANTOS ABREU', 'MOTORISTA DE CAMINHAO', '19259', '', '', '31988089771', '82158508', '', sup_id, eq_id);
    END IF;
    -- Employee: WASHINGTON BRUNO DA COSTA ALEXANDRINO
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '82146335',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WASHINGTON BRUNO DA COSTA ALEXANDRINO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WASHINGTON BRUNO DA COSTA ALEXANDRINO', 'OPERADOR DE EQUIPAMENTOS', '18512', '', '', '', '82146335', '', sup_id, eq_id);
    END IF;
    -- Employee: WASHINGTON PEREIRA BONIFACIO
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'ASPIRADOR' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'BK' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('BK', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '31984389101',
        matricula_usiminas = '82144466',
        matricula_gps = '966261',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WASHINGTON PEREIRA BONIFACIO';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WASHINGTON PEREIRA BONIFACIO', 'MOTORISTA DE CAMINHAO', '19259', 'ADM', 'ATIVO', '31984389101', '82144466', '966261', sup_id, eq_id);
    END IF;
    -- Employee: WEDERSON COSTA DE SOUZA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'FÉRIAS',
        telefone = '31986957034',
        matricula_usiminas = '82111074',
        matricula_gps = '983581',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WEDERSON COSTA DE SOUZA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WEDERSON COSTA DE SOUZA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'FÉRIAS', '31986957034', '82111074', '983581', sup_id, eq_id);
    END IF;
    -- Employee: WELINGTON COSTA DE SALES
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WELINGTON COSTA DE SALES';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WELINGTON COSTA DE SALES', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: WELITON WAGNER PEREIRA DA SILVA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'JUNIOR PEREIRA' LIMIT 1;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'ADM',
        status = 'ATIVO',
        telefone = '33999251196',
        matricula_usiminas = '82110634',
        matricula_gps = '965942',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WELITON WAGNER PEREIRA DA SILVA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WELITON WAGNER PEREIRA DA SILVA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'ADM', 'ATIVO', '33999251196', '82110634', '965942', sup_id, eq_id);
    END IF;
    -- Employee: WELLISON JOSE DOS SANTOS
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'SUPERVISOR DE AREA',
        cr = '18512',
        regime = '',
        status = '',
        telefone = '31985231476',
        matricula_usiminas = '82110956',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WELLISON JOSE DOS SANTOS';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WELLISON JOSE DOS SANTOS', 'SUPERVISOR DE AREA', '18512', '', '', '31985231476', '82110956', '', sup_id, eq_id);
    END IF;
    -- Employee: WEULER ALVES ALVARENGA
    SELECT id INTO sup_id FROM public.supervisors WHERE name = 'SEM REGISTRO' LIMIT 1;

    SELECT id INTO eq_id FROM public.equipment WHERE sigla = 'HV' AND (numero = '03' OR (numero IS NULL AND '03' IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('HV', '03') RETURNING id INTO eq_id;
    END IF;

    UPDATE public.employees SET
        function = 'OPERADOR DE EQUIPAMENTOS',
        cr = '18512',
        regime = 'SEM REGISTRO',
        status = 'ATIVO',
        telefone = '31981136128',
        matricula_usiminas = '82146690',
        matricula_gps = '466',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WEULER ALVES ALVARENGA';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WEULER ALVES ALVARENGA', 'OPERADOR DE EQUIPAMENTOS', '18512', 'SEM REGISTRO', 'ATIVO', '31981136128', '82146690', '466', sup_id, eq_id);
    END IF;
    -- Employee: WILIAM CARLOS FERNANDES CABRAL
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'PLANEJADOR DE MANUTENCAO',
        cr = '48367',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WILIAM CARLOS FERNANDES CABRAL';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WILIAM CARLOS FERNANDES CABRAL', 'PLANEJADOR DE MANUTENCAO', '48367', '', '', '', '', '', sup_id, eq_id);
    END IF;
    -- Employee: WILSON CARLOS DE SOUZA JUNIOR
    sup_id := NULL;
    eq_id := NULL;

    UPDATE public.employees SET
        function = 'MOTORISTA DE CAMINHAO',
        cr = '19259',
        regime = '',
        status = '',
        telefone = '',
        matricula_usiminas = '',
        matricula_gps = '',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = 'WILSON CARLOS DE SOUZA JUNIOR';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('WILSON CARLOS DE SOUZA JUNIOR', 'MOTORISTA DE CAMINHAO', '19259', '', '', '', '', '', sup_id, eq_id);
    END IF;
END $$;
UPDATE public.app_config SET value = '["MOTORISTA", "ALMOXARIFE I", "PLANEJADOR DE MANUTENCAO", "SUPERVISOR DE AREA", "PROGRAMADOR DE MANUTENCAO", "SUPERVISOR DE OBRA I", "PROGRAMADOR DE MANUTENCAO I", "OPERADOR DE EQUIPAMENTOS", "COORDENADOR DE OPERACOES", "TECNICO DE SEGURANCA DO TRABALHO", "MOTORISTA DE CAMINHAO"]'::jsonb WHERE key = 'funcoes';
UPDATE public.app_config SET value = '["24HS-A", "24HS-B", "ADM", "SEM REGISTRO", "16HS-5X2", "24HS-D", "16HS-6X3", "24HS-C"]'::jsonb WHERE key = 'regimes';
UPDATE public.app_config SET value = '["F\u00c9RIAS", "EM AVISO", "ATIVO"]'::jsonb WHERE key = 'statuses';