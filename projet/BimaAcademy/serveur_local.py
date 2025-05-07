#J'ai besoin d'un serveur local pour tester, et comme c'est local je dois autoriser le CORS s'ou ce script
from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')  # Autorise toutes les origines
        return super().end_headers()

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f"✔ Serveur avec CORS actif lancé sur http://localhost:{port}")
    httpd.serve_forever()
