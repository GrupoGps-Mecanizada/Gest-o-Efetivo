import csv
import json
import urllib.request
import urllib.error

SUPABASE_URL = 'https://mgcjidryrjqiceielmzp.supabase.co'
# This is the anon key from config js
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nY2ppZHJ5cmpxaWNlaWVsbXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjEwNzEsImV4cCI6MjA4NzY5NzA3MX0.UAKkzy5fMIkrlmnqz9E9KknUw9xhoYpa3f1ptRpOuAA'

EMAIL = 'warlison@sge.com'
PASSWORD = '869464'

def api_request(path, method="GET", payload=None, token=None, extra_headers=None):
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token if token else ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if extra_headers:
        headers.update(extra_headers)
        
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            if res_body:
                return json.loads(res_body)
            return None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code} for {url}: {body}")
        return None
    except Exception as e:
        print(f"Error {url}: {str(e)}")
        return None

def login():
    res = api_request("/auth/v1/token?grant_type=password", "POST", {"email": EMAIL, "password": PASSWORD})
    if res and "access_token" in res:
        return res["access_token"]
    print("Login failed")
    return None

def parse_equipment(str_val):
    if not str_val:
        return None, None
    parts = str_val.split('-')
    if len(parts) > 1:
         return parts[0].strip(), parts[1].strip()
    return str_val.strip(), None

def run():
    token = login()
    if not token:
        return

    with open('efetivo_sincronizado.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # 1. Fetch existing Supervisors
    existing_supervisors = api_request("/rest/v1/supervisors?select=*", token=token) or []
    sup_map = { s['name']: s['id'] for s in existing_supervisors }

    # Sync missing supervisors
    for r in data:
        s_name = r.get('Supervisor', '').strip()
        if s_name and s_name not in sup_map:
            res = api_request("/rest/v1/supervisors", "POST", {"name": s_name}, token=token)
            if res and len(res) > 0:
                sup_map[s_name] = res[0]['id']
                print(f"Created supervisor: {s_name}")

    # 2. Fetch Equipment
    existing_equipment = api_request("/rest/v1/equipment?select=*", token=token) or []
    eq_map = {}
    for eq in existing_equipment:
        key = f"{eq['sigla']}-{eq['numero']}" if eq.get('numero') else eq['sigla']
        eq_map[key] = eq['id']

    # Sync missing equipment
    for r in data:
        eq_str = r.get('Equipamento', '').strip()
        if eq_str:
            sigla, num = parse_equipment(eq_str)
            key = f"{sigla}-{num}" if num else sigla
            if key not in eq_map:
                payload = {"sigla": sigla}
                if num:
                    payload["numero"] = num
                res = api_request("/rest/v1/equipment", "POST", payload, token=token)
                if res and len(res) > 0:
                    eq_map[key] = res[0]['id']
                    print(f"Created equipment: {key}")

    # 3. Fetch existing Employees
    existing_emps = api_request("/rest/v1/employees?select=id,name", token=token) or []
    emp_map = { e['name']: e['id'] for e in existing_emps }

    new_functions = set()
    new_regimes = set()
    new_statuses = set()

    for r in data:
        name = r.get('Nome', '').strip()
        if not name:
             continue
             
        func = r.get('Função', '').strip()
        cr = r.get('CR', '').strip()
        regime = r.get('Regime', '').strip()
        status = r.get('Status', '').strip()
        phone = r.get('Telefone', '').strip()
        mat_usi = r.get('Mat. Usiminas', '').strip()
        mat_gps = r.get('Mat. GPS', '').strip()
        sup_name = r.get('Supervisor', '').strip()
        eq_str = r.get('Equipamento', '').strip()
        
        if func: new_functions.add(func)
        if regime: new_regimes.add(regime)
        if status: new_statuses.add(status)

        sup_id = sup_map.get(sup_name)
        
        eq_id = None
        if eq_str:
            sigla, num = parse_equipment(eq_str)
            key = f"{sigla}-{num}" if num else sigla
            eq_id = eq_map.get(key)
        
        payload = {
            "name": name,
            "function": func,
            "cr": cr,
            "regime": regime,
            "status": status,
            "telefone": phone,
            "matricula_usiminas": mat_usi,
            "matricula_gps": mat_gps,
            "supervisor_id": sup_id,
            "equipment_id": eq_id
        }
        
        if name in emp_map:
            # Update
            uid = emp_map[name]
            url = f"/rest/v1/employees?id=eq.{uid}"
            # Need to disable standard Prefer for updates so it doesn't conflict
            api_request(url, "PATCH", payload, token=token, extra_headers={"Prefer": "return=minimal"})
        else:
            # Insert
            res = api_request("/rest/v1/employees", "POST", payload, token=token)
            if res and len(res) > 0:
                emp_map[name] = res[0]['id']

    print("Synced all employees!")

    # 4. Update App Configs
    # Fetch existing
    configs = api_request("/rest/v1/app_config?select=*", token=token) or []
    cfg_map = { c['key']: c['value'] for c in configs }
    
    def merge_lists(old_list, new_set):
        if not old_list: old_list = []
        final = list(set(old_list).union(new_set))
        return final

    api_request("/rest/v1/app_config?key=eq.funcoes", "PATCH", {"value": merge_lists(cfg_map.get('funcoes'), new_functions)}, token=token, extra_headers={"Prefer":"return=minimal"})
    api_request("/rest/v1/app_config?key=eq.regimes", "PATCH", {"value": merge_lists(cfg_map.get('regimes'), new_regimes)}, token=token, extra_headers={"Prefer":"return=minimal"})
    api_request("/rest/v1/app_config?key=eq.statuses", "PATCH", {"value": merge_lists(cfg_map.get('statuses'), new_statuses)}, token=token, extra_headers={"Prefer":"return=minimal"})

    print("Synced configs!")

if __name__ == '__main__':
    run()
