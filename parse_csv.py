import csv
import re
import uuid

def parse_equipment(eq_str):
    if not eq_str or eq_str.strip() == '':
        return None, None
    
    parts = eq_str.split('-')
    if len(parts) > 1:
        return parts[0].strip(), parts[1].strip()
    return eq_str.strip(), None

def run():
    with open('efetivo_sincronizado.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # 1. Discover unique supervisors
    supervisors = set()
    for r in data:
        sup = r.get('Supervisor', '').strip()
        if sup:
            supervisors.add(sup)
            
    # 2. Discover unique equipment
    equipment = set()
    for r in data:
        eq = r.get('Equipamento', '').strip()
        if eq:
            equipment.add(eq)
            
    # Generating SQL
    sql = []
    
    # Drop equipment constraint if any
    sql.append("ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_escala_check;\n")
    
    # Insert supervisors (Using ON CONFLICT DO NOTHING - requires unique constraint on name)
    sql.append("-- Supervisors")
    for s in supervisors:
        s_safe = s.replace("'", "''")
        sql.append(f"INSERT INTO public.supervisors (name) VALUES ('{s_safe}') ON CONFLICT (name) DO NOTHING;")
        
    # Insert equipment
    sql.append("-- Equipment")
    # For equipment, we don't have a unique constraint on sigla+numero, but let's assume table is mostly empty for now 
    # Or better yet, we can't easily upsert. Let's just create a temporary table or use PL/pgSQL block to upsert
    
    plpgsql = """
DO $$
DECLARE
    sup_id uuid;
    eq_id uuid;
BEGIN
"""
    # Create equipment and Employees
    for r in data:
        emp_id = r.get('ID', '').strip()  # like COL001
        
        # We need a predictable UUID for employees based on ID, but we can't. So we match by name.
        name = r.get('Nome', '').strip().replace("'", "''")
        func = r.get('Função', '').strip().replace("'", "''")
        cr = r.get('CR', '').strip().replace("'", "''")
        regime = r.get('Regime', '').strip().replace("'", "''")
        status = r.get('Status', '').strip().replace("'", "''")
        phone = r.get('Telefone', '').strip().replace("'", "''")
        mat_usi = r.get('Mat. Usiminas', '').strip().replace("'", "''")
        mat_gps = r.get('Mat. GPS', '').strip().replace("'", "''")
        
        sup_name = r.get('Supervisor', '').strip().replace("'", "''")
        eq_str = r.get('Equipamento', '').strip()
        
        sigla, num = parse_equipment(eq_str)
        
        plpgsql += f"    -- Employee: {name}\n"
        
        if sup_name:
            plpgsql += f"    SELECT id INTO sup_id FROM public.supervisors WHERE name = '{sup_name}' LIMIT 1;\n"
        else:
            plpgsql += f"    sup_id := NULL;\n"

        if sigla:
            sigla_safe = sigla.replace("'", "''")
            num_safe = f"'{num.replace('\"', '')}'" if num else "NULL"
            
            # Upsert equipment conceptually
            plpgsql += f"""
    SELECT id INTO eq_id FROM public.equipment WHERE sigla = '{sigla_safe}' AND (numero = {num_safe} OR (numero IS NULL AND {num_safe} IS NULL)) LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.equipment (sigla, numero) VALUES ('{sigla_safe}', {num_safe}) RETURNING id INTO eq_id;
    END IF;
"""
        else:
            plpgsql += f"    eq_id := NULL;\n"

        # Now upsert Employee by name
        plpgsql += f"""
    UPDATE public.employees SET
        function = '{func}',
        cr = '{cr}',
        regime = '{regime}',
        status = '{status}',
        telefone = '{phone}',
        matricula_usiminas = '{mat_usi}',
        matricula_gps = '{mat_gps}',
        supervisor_id = sup_id,
        equipment_id = eq_id,
        updated_at = now()
    WHERE name = '{name}';
    
    IF NOT FOUND THEN
        INSERT INTO public.employees (name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, supervisor_id, equipment_id)
        VALUES ('{name}', '{func}', '{cr}', '{regime}', '{status}', '{phone}', '{mat_usi}', '{mat_gps}', sup_id, eq_id);
    END IF;
"""

    plpgsql += "END $$;"
    sql.append(plpgsql)

    # Let's collect unique functions and regimes to update app_config
    functions = set(r.get('Função', '').strip() for r in data if r.get('Função', '').strip())
    regimes = set(r.get('Regime', '').strip() for r in data if r.get('Regime', '').strip())
    statuses = set(r.get('Status', '').strip() for r in data if r.get('Status', '').strip())
    
    import json
    func_json = json.dumps(list(functions))
    reg_json = json.dumps(list(regimes))
    stat_json = json.dumps(list(statuses))
    
    sql.append(f"UPDATE public.app_config SET value = '{func_json}'::jsonb WHERE key = 'funcoes';")
    sql.append(f"UPDATE public.app_config SET value = '{reg_json}'::jsonb WHERE key = 'regimes';")
    sql.append(f"UPDATE public.app_config SET value = '{stat_json}'::jsonb WHERE key = 'statuses';")
    
    # Write to output.sql
    with open('output.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))

if __name__ == '__main__':
    run()
