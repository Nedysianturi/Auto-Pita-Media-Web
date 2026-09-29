import os, subprocess

audio_base = os.path.join(os.getcwd(), 'assets', 'audio')

# Generates clean, rich instrumental background loops using FFmpeg aevalsrc mathematical harmonics
tracks = [
    {
        'dir': 'misteri',
        'file': 'Misteri_Dark_Ambient_Horor.mp3',
        'expr': '(sin(2*PI*55*t)*0.45 + sin(2*PI*82.5*t)*0.25 + sin(2*PI*110*t)*0.2 + sin(2*PI*165*t)*0.1)*(0.8 + 0.2*sin(2*PI*0.2*t))'
    },
    {
        'dir': 'misteri',
        'file': 'Misteri_Detak_Tegang_Klimaks.mp3',
        'expr': '(sin(2*PI*65*t)*0.5 + sin(2*PI*98*t)*0.3)*(0.5 + 0.5*sin(2*PI*1.5*t))'
    },
    {
        'dir': 'podcast',
        'file': 'Podcast_Warm_LoFi_Chill.mp3',
        'expr': '(sin(2*PI*220*t)*0.35 + sin(2*PI*277.18*t)*0.25 + sin(2*PI*329.63*t)*0.25 + sin(2*PI*440*t)*0.15)*(0.85 + 0.15*sin(2*PI*0.4*t))'
    },
    {
        'dir': 'podcast',
        'file': 'Podcast_Acoustic_Storytelling.mp3',
        'expr': '(sin(2*PI*196*t)*0.35 + sin(2*PI*246.94*t)*0.25 + sin(2*PI*293.66*t)*0.25 + sin(2*PI*392*t)*0.15)*(0.9 + 0.1*sin(2*PI*0.3*t))'
    },
    {
        'dir': 'inspiratif',
        'file': 'Inspiratif_Cinematic_Piano_Haru.mp3',
        'expr': '(sin(2*PI*261.63*t)*0.35 + sin(2*PI*329.63*t)*0.25 + sin(2*PI*392*t)*0.25 + sin(2*PI*523.25*t)*0.15)*(0.85 + 0.15*sin(2*PI*0.25*t))'
    },
    {
        'dir': 'inspiratif',
        'file': 'Inspiratif_Deep_Emotional_String.mp3',
        'expr': '(sin(2*PI*174.61*t)*0.35 + sin(2*PI*220*t)*0.25 + sin(2*PI*261.63*t)*0.25 + sin(2*PI*349.23*t)*0.15)*(0.8 + 0.2*sin(2*PI*0.15*t))'
    },
    {
        'dir': 'ceria',
        'file': 'Ceria_Upbeat_Komedi_Fun.mp3',
        'expr': '(sin(2*PI*329.63*t)*0.4 + sin(2*PI*440*t)*0.3 + sin(2*PI*554.37*t)*0.2)*(0.6 + 0.4*sin(2*PI*3.0*t))'
    },
    {
        'dir': 'ceria',
        'file': 'Ceria_Lively_Playful_Mood.mp3',
        'expr': '(sin(2*PI*293.66*t)*0.4 + sin(2*PI*369.99*t)*0.3 + sin(2*PI*440*t)*0.2)*(0.7 + 0.3*sin(2*PI*2.5*t))'
    }
]

for t in tracks:
    target_dir = os.path.join(audio_base, t['dir'])
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, t['file'])
    
    # 60 second seamless looping ambient track
    cmd = [
        'ffmpeg', '-y', '-f', 'lavfi',
        '-i', f"aevalsrc={t['expr']}:d=60",
        '-af', 'lowpass=f=2500,volume=0.6',
        '-c:a', 'libmp3lame', '-b:a', '192k',
        target_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"OK: {t['file']} ({os.path.getsize(target_path)} bytes)")
    else:
        print(f"ERR: {t['file']} -> {res.stderr[:200]}")
