from tkinter import *

window = Tk()


try:

    import json
    import sys
    import traceback
    import os
    import subprocess
    import struct
    from nsfw_detector import predict
    import threading
    import requests
    server = "http://localhost:8000"
    model = predict.load_model('models\\inception.h5')
    keep_sending=True
    
    def classify_img(image_path):
        
        prediction = predict.classify(model, image_path)[image_path] 

        return prediction

    def get_message():
        rawLength = sys.stdin.buffer.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
            
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.buffer.read(messageLength).decode('utf-8')
        return json.loads(message)

    def send_message(message):
        encodedContent = json.dumps(message).encode('utf-8')
        encodedLength = struct.pack('@I', len(encodedContent))
        try:
            sys.stdout.buffer.write(encodedLength)
            sys.stdout.buffer.write(encodedContent)
            sys.stdout.buffer.flush()
        except OSError:
           pass

    def download_video(url, name):
        try: 
            command = f'yt-dlp -N 5 --quiet -f worstvideo -o {name} {url}'
            output = subprocess.check_output(command.split())
            return 
        except subprocess.CalledProcessError:
            pass
        
        command=f'yt-dlp -N 5 --quiet -o {name} {url}'
        output=subprocess.check_output(command.split())
        
    def extract_frames(video, output_dir="."):
        command = f"ffmpeg -hide_banner -loglevel error -i {video} -vf fps=1 {output_dir}"

        output = subprocess.check_output(command.split())

    def check_if_exists(video_url):
        
        payload = {"video_url": video_url}
        json_payload = json.dumps(payload)
        response = requests.post(server, data=json_payload)
        return response.text

    def get_age_rating(frames):
        
        max_age=0
        for chance in frames:
            if chance['sexy'] > 0.8:
                return 18
            if chance['sexy'] > 0.5:
                max_age = 16
            if chance['porn'] > 0.7 and max_age==0:
                max_age = 13
            
        return max_age
    
    def send_age_rating(video_url, frames, age_rating):
        payload = {"video_url": video_url,
                   "frames": frames, "age_rating": age_rating}
        json_payload = json.dumps(payload)
        response = requests.post(server, data=json_payload)

        return response.text

    def go_over_frames(video_num, message):
       
        send_message({"WHAT":"THE"})
        template = {"type": "classification",
                    "status": "success", "sender": message['sender']}
        video_name = f'videos\\video{video_num}.mp4'
        os.makedirs(f'frames\\{video_num}', exist_ok=True)
        current_frame = 0
        extract_frames(video_name, f"frames\\{video_num}\\frame%05d.jpg")
        frame_list = []
                       
        for frame in os.listdir(f'frames\\{video_num}'):
            current_frame += 1
            frame_name = f'frames\\{video_num}\\{frame}'
            chance = classify_img(frame_name)
            template['second'] = current_frame
            template['chance'] = chance
            
            send_message(template)
            os.remove(frame_name)
            frame_list.append(chance)
        os.rmdir(f'frames\\{video_num}')
        os.remove(video_name)
        return frame_list, get_age_rating(frame_list)

    def classify_video(message):
        send_message({str(os.listdir('videos')):str(len(os.listdir('videos')))})
        template = {"type": "status", "status": "null", "sender": message['sender']}

        age_rating = check_if_exists(message['request']['url'])
        try:
            int(age_rating)
            template['status'] = 'is in database'
            template['type'] = "rating"
            template['rating'] = age_rating
            send_message(template)
            return
        except ValueError:
            pass
        try:
            
            video_num = len(os.listdir('videos'))
            video_name = f'videos\\video{video_num}.mp4'
            download_video(message['request']['url'], video_name)
            
        except subprocess.CalledProcessError as e:

            template['status'] = 'error'
            send_message(template)
            return

        template['status'] = 'downloaded'
        send_message(template)
        frame_list, age_rating = go_over_frames(video_num, message)

        send_age_rating(message['request']['url'], frame_list, age_rating)

    def main():
        global keep_sending
        while True:
            message = get_message()
            request = message['request']
            if request['type'] == 'download':
                keep_sending=True
                #threading.Thread(target=classify_video, args=(message,)).start()
                classify_video(message)
            if request['type'] == 'stop':
                keep_sending=False

    if __name__ == '__main__':
        main()

except Exception as e:
    error = Label(text=traceback.format_exc())
    error.pack()
    window.mainloop()

#demo video: https://www.youtube.com/watch?v=qEhLyk_-YmM&ab_channel=Maarya
