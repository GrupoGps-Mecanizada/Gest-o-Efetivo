from playwright.sync_api import sync_playwright
import time

def test_sge():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))
        
        print("Navigating to http://localhost:8081/")
        page.goto("http://localhost:8081/")
        time.sleep(3) # wait for load
        print("Checking login...")
        
        # Log in if needed
        try:
            if page.locator('#login-screen').is_visible(timeout=2000):
                page.fill('#login-email', 'warlison.abreu19@gmail.com')
                page.fill('#login-password', '@14112014@Breu')
                page.click('#btn-login')
                time.sleep(3) # wait for data load
        except Exception as e:
            print("Login check error/skipped", e)
            
        print("Calling SGE.ferias.render()...")
        page.evaluate("""
            if(window.SGE && SGE.ferias) {
                SGE.ferias.render().then(() => console.log('RENDER_SUCCESS')).catch(e => console.error('RENDER_ERROR', e));
            } else {
                console.log('SGE.ferias not found');
            }
        """)
        time.sleep(2)
        
        ferias_html = page.evaluate("document.getElementById('ferias-view') ? document.getElementById('ferias-view').innerHTML : 'No element'")
        print(f"Férias HTML length: {len(ferias_html)}")
        if len(ferias_html) < 200:
            print("Férias HTML:", ferias_html)
            
        print("Done.")
        browser.close()

if __name__ == "__main__":
    test_sge()
