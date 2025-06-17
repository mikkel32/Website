import urllib.request

CDN_URL = 'https://cdn.jsdelivr.net/npm/react-router-dom@6/umd/react-router-dom.production.min.js'

def test_react_router_dom_cdn_is_reachable():
    req = urllib.request.Request(CDN_URL, method='HEAD')
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
