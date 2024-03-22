from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import random
import os
import time
import sqlite3

conn=sqlite3.connect('table.db')
cursor=conn.cursor()
class RequestHandler(BaseHTTPRequestHandler):
    def _send_response(self, message):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes(message, "utf8"))

    def check_if_exists(self,video_url):
        cursor.execute(f'SELECT * FROM videos WHERE url="{video_url}"')
        db_url=cursor.fetchone()
        if db_url is not None:
            return db_url
        return False
    
    def do_GET(self):
        vid_number=len(cursor.execute('SELECT * FROM videos').fetchall())+1
        age_ratings=cursor.execute('SELECT age_rating FROM videos').fetchall()
        age_ratings=[i[0] for i in age_ratings if type(i[0]) != str]
        data={"vid_number":vid_number,"age_ratings":age_ratings}
        self._send_response(str(data))
        
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        video_url=data['video_url']
        video_exists=self.check_if_exists(video_url)
        if video_exists: #if the video exists in the database
            print (video_exists)
            self._send_response(str(video_exists[2]))
            return
        
        try:
            frames=data['frames']
            age_rating=data['age_rating']
            #cursor.execute(f'INSERT INTO videos (url, frames, age_rating) VALUES("{video_url}","{frames}","{age_rating}")')
            #conn.commit()
            self._send_response("video added to database")
            
        except KeyError:
            self._send_response("not enough data to add to database")
    

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print (str(server_address))
    print(f"Starting httpd server on port {port}")
    httpd.serve_forever()

run()