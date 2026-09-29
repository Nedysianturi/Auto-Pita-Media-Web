import os, sys, subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sfx_base = os.path.join(os.getcwd(), 'assets', 'sfx')

# Generates pristine, crisp, punchy, studio-grade 3-second hook SFX using FFmpeg
sfx_list = [
    # PODCAST HOOKS
    {
        'dir': 'podcast',
        'file': 'Hook_Cinematic_Deep_Impact.mp3',
        'duration': '2.0',
        'expr': '(sin(2*PI*(32 + 90*exp(-10*t))*t)*0.7 + sin(2*PI*(64 + 180*exp(-12*t))*t)*0.3)*exp(-3.2*t)',
        'af': 'lowpass=f=1800,volume=1.2'
    },
    {
        'dir': 'podcast',
        'file': 'Hook_Fast_Dynamic_Whoosh.mp3',
        'duration': '1.2',
        'expr': '(sin(2*PI*(160 + 350*sin(PI*t/1.2))*t)*0.55 + sin(2*PI*(280 + 400*sin(PI*t/1.2))*t)*0.45)*(sin(PI*t/1.2)^2)',
        'af': 'volume=1.1'
    },
    {
        'dir': 'podcast',
        'file': 'Hook_Tape_Stop_Record_Scratch.mp3',
        'duration': '1.0',
        'expr': 'sin(2*PI*(40 + 760*exp(-7*t))*t)*(0.7 + 0.3*sin(2*PI*45*t))*exp(-3.0*t)',
        'af': 'volume=1.1'
    },
    
    # MISTERI / HOROR HOOKS
    {
        'dir': 'misteri',
        'file': 'Hook_Heartbeat_Tension_Thump.mp3',
        'duration': '1.6',
        'expr': 'sin(2*PI*52*t)*exp(-10*t) + sin(2*PI*46*t)*exp(-8*(t-0.3)*(t-0.3)*10)',
        'af': 'lowpass=f=600,volume=1.3'
    },
    {
        'dir': 'misteri',
        'file': 'Hook_Horror_High_Tension_Riser.mp3',
        'duration': '2.2',
        'expr': '(sin(2*PI*(140 + 340*t*t)*t)*0.5 + sin(2*PI*(147 + 355*t*t)*t)*0.5)*(0.15 + 0.85*(t/2.2))',
        'af': 'highpass=f=200,volume=1.0'
    },
    {
        'dir': 'misteri',
        'file': 'Hook_Ghostly_Sub_Drop.mp3',
        'duration': '2.0',
        'expr': 'sin(2*PI*(85*exp(-1.8*t))*t)*(0.75*exp(-1.4*t) + 0.25*sin(2*PI*14*t))',
        'af': 'lowpass=f=800,volume=1.2'
    },

    # INSPIRATIF HOOKS
    {
        'dir': 'inspiratif',
        'file': 'Hook_Crystal_Clean_Ding.mp3',
        'duration': '1.8',
        'expr': 'sin(2*PI*1046.5*t)*0.5*exp(-3.2*t) + sin(2*PI*2093*t)*0.32*exp(-5.0*t) + sin(2*PI*3135.9*t)*0.18*exp(-7.0*t)',
        'af': 'volume=1.1'
    },
    {
        'dir': 'inspiratif',
        'file': 'Hook_Emotional_Shimmer_Swell.mp3',
        'duration': '1.8',
        'expr': '(sin(2*PI*440*t)*0.35 + sin(2*PI*554.37*t)*0.35 + sin(2*PI*659.25*t)*0.3)*sin(PI*t/1.8)',
        'af': 'volume=1.0'
    },

    # CERIA / KOMEDI HOOKS
    {
        'dir': 'ceria',
        'file': 'Hook_Comedic_Cartoon_Boing.mp3',
        'duration': '1.4',
        'expr': 'sin(2*PI*(200 + 220*exp(-2.2*t) + 55*sin(2*PI*24*t))*t)*exp(-1.8*t)',
        'af': 'volume=1.1'
    },
    {
        'dir': 'ceria',
        'file': 'Hook_Bubble_Pop_Fun.mp3',
        'duration': '0.6',
        'expr': 'sin(2*PI*(280 + 1400*t)*t)*exp(-16*t)',
        'af': 'volume=1.2'
    }
]

print("=== GENERATING STUDIO HOOK SOUND EFFECTS (ROYALTY-FREE) ===")
for s in sfx_list:
    target_dir = os.path.join(sfx_base, s['dir'])
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, s['file'])
    
    cmd = [
        'ffmpeg', '-y', '-f', 'lavfi',
        '-i', f"aevalsrc={s['expr']}:d={s['duration']}",
        '-af', s['af'],
        '-c:a', 'libmp3lame', '-b:a', '192k',
        target_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"✅ OK: {s['dir']}/{s['file']} ({os.path.getsize(target_path)} bytes)")
    else:
        print(f"❌ ERR: {s['file']} -> {res.stderr[:200]}")

print("=== ALL HOOK SOUND EFFECTS GENERATED SUCCESSFULLY! ===")
