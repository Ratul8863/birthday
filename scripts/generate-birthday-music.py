"""Original birthday background loop. Warm piano, soft bells, no borrowed melody."""

from __future__ import annotations

import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 92
BEAT = 60.0 / BPM
BARS = 16
LOOP_BEATS = BARS * 4
LOOP_SAMPLES = int(round(LOOP_BEATS * BEAT * SR))
CYCLES = 3
TAIL = int(2.5 * SR)

# C major: two bars each, last two bars F then G so the loop lands home on C.
CHORDS: list[tuple[int, list[int]]] = [
    (48, [60, 64, 67, 72]),  # C
    (48, [60, 64, 67, 72]),
    (43, [55, 59, 62, 67]),  # G
    (43, [55, 59, 62, 67]),
    (45, [57, 60, 64, 69]),  # Am
    (45, [57, 60, 64, 69]),
    (41, [53, 57, 60, 65]),  # F
    (41, [53, 57, 60, 65]),
    (48, [60, 64, 67, 72]),
    (48, [60, 64, 67, 72]),
    (43, [55, 59, 62, 67]),
    (43, [55, 59, 62, 67]),
    (45, [57, 60, 64, 69]),
    (45, [57, 60, 64, 69]),
    (41, [53, 57, 60, 65]),  # F
    (43, [55, 59, 62, 67]),  # G
]

# beat, midi, duration in beats, velocity
MELODY: list[tuple[float, int, float, float]] = [
    (0.0, 64, 1.4, 0.42),
    (1.5, 67, 1.2, 0.38),
    (3.0, 72, 1.6, 0.48),
    (5.0, 71, 0.8, 0.34),
    (6.0, 69, 1.5, 0.4),
    (8.0, 67, 1.2, 0.4),
    (9.5, 66, 1.0, 0.34),
    (11.0, 62, 1.4, 0.36),
    (13.0, 66, 1.2, 0.38),
    (14.5, 67, 1.3, 0.42),
    (16.0, 69, 1.3, 0.4),
    (17.5, 72, 1.4, 0.46),
    (19.5, 76, 1.6, 0.44),
    (21.5, 74, 1.0, 0.34),
    (22.5, 72, 1.3, 0.38),
    (24.0, 69, 1.2, 0.4),
    (25.5, 72, 1.0, 0.36),
    (27.0, 77, 1.5, 0.46),
    (29.0, 76, 1.0, 0.34),
    (30.0, 74, 1.6, 0.4),
    (32.0, 72, 1.0, 0.4),
    (33.5, 76, 1.2, 0.46),
    (35.0, 79, 1.7, 0.5),
    (37.0, 76, 0.8, 0.34),
    (38.0, 74, 1.6, 0.4),
    (40.0, 74, 1.2, 0.4),
    (41.5, 71, 1.0, 0.34),
    (43.0, 67, 1.4, 0.38),
    (45.0, 71, 1.2, 0.36),
    (46.5, 74, 1.3, 0.42),
    (48.0, 72, 1.2, 0.4),
    (49.5, 69, 1.0, 0.34),
    (51.0, 67, 1.4, 0.38),
    (53.0, 64, 1.2, 0.36),
    (54.5, 69, 1.3, 0.4),
    (56.0, 65, 1.4, 0.38),
    (58.0, 69, 1.2, 0.36),
    (60.0, 67, 1.0, 0.4),
    (61.0, 66, 1.0, 0.34),
    (62.2, 62, 1.6, 0.36),
]


def midi_freq(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def env_attack(n: int, attack: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.clip(t / attack, 0.0, 1.0)


def synth_piano(freq: float, dur: float, vel: float) -> np.ndarray:
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    y = np.zeros(n)
    stiffness = 0.00028
    for h, amp, decay in (
        (1, 1.0, 1.55),
        (2, 0.38, 2.35),
        (3, 0.16, 3.3),
        (4, 0.07, 4.4),
    ):
        stretched = freq * h * np.sqrt(1.0 + stiffness * h * h)
        y += amp * np.sin(2 * np.pi * stretched * t) * np.exp(-t * decay)
    y *= env_attack(n, 0.012) * vel
    return y


def synth_bell(freq: float, dur: float, vel: float) -> np.ndarray:
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    modulator = np.sin(2 * np.pi * freq * 2.01 * t) * np.exp(-t * 3.4)
    y = np.sin(2 * np.pi * freq * t + 1.15 * modulator) * np.exp(-t * 1.85)
    y += 0.18 * np.sin(2 * np.pi * freq * 4.02 * t) * np.exp(-t * 4.8)
    y *= env_attack(n, 0.004) * vel
    return y


def synth_bass(freq: float, dur: float, vel: float) -> np.ndarray:
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.15)
    y += 0.28 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 2.4)
    y *= env_attack(n, 0.018) * vel
    return y


def synth_pad(freq: float, dur: float, vel: float) -> np.ndarray:
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    env = np.ones(n)
    a = min(n // 3, int(0.45 * SR))
    r = min(n // 3, int(0.7 * SR))
    if a > 1:
        env[:a] = np.linspace(0.0, 1.0, a)
    if r > 1:
        env[-r:] *= np.linspace(1.0, 0.0, r)
    y = np.sin(2 * np.pi * freq * t)
    y += 0.55 * np.sin(2 * np.pi * freq * 1.004 * t)
    y += 0.12 * np.sin(2 * np.pi * freq * 2 * t)
    return y * env * vel


def place(buf: np.ndarray, start: int, wave: np.ndarray, channel: int) -> None:
    if start >= len(buf) or wave.size == 0:
        return
    end = min(len(buf), start + len(wave))
    buf[start:end, channel] += wave[: end - start]


def place_loop(buf: np.ndarray, beat: float, wave: np.ndarray, channel: int) -> None:
    origin = int(round(beat * BEAT * SR))
    for cycle in range(CYCLES):
        place(buf, origin + cycle * LOOP_SAMPLES, wave, channel)


def reverb(x: np.ndarray) -> np.ndarray:
    wet = np.zeros_like(x)
    taps = (
        (0.029, 0.22),
        (0.047, 0.18),
        (0.071, 0.14),
        (0.103, 0.11),
        (0.149, 0.08),
        (0.211, 0.05),
    )
    for delay_s, gain in taps:
        d = int(delay_s * SR)
        wet[d:] += gain * x[:-d]
    echo = int(0.089 * SR)
    wet[echo:] += 0.22 * wet[:-echo]
    return x * 0.84 + wet * 0.42


def build() -> np.ndarray:
    total = CYCLES * LOOP_SAMPLES + TAIL
    mix = np.zeros((total, 2), dtype=np.float64)

    for bar, (bass_note, tones) in enumerate(CHORDS):
        start = bar * 4
        place_loop(mix, start, synth_bass(midi_freq(bass_note), BEAT * 3.2, 0.22), 0)
        place_loop(mix, start, synth_bass(midi_freq(bass_note), BEAT * 3.2, 0.22), 1)
        for tone in tones:
            pad = synth_pad(midi_freq(tone), BEAT * 4.6, 0.045)
            place_loop(mix, start, pad, 0)
            place_loop(mix, start, pad, 1)
        order = (0, 2, 1, 3)
        for step, idx in enumerate(order):
            note = tones[idx % len(tones)]
            hit = synth_piano(midi_freq(note), BEAT * 2.4, 0.3 if step else 0.38)
            # Piano sits a little left, bells a little right.
            place_loop(mix, start + step * 0.98, hit * 0.72, 0)
            place_loop(mix, start + step * 0.98, hit * 0.48, 1)

    for beat, note, beats, vel in MELODY:
        bell = synth_bell(midi_freq(note), beats * BEAT * 1.35, vel)
        place_loop(mix, beat, bell * 0.42, 0)
        place_loop(mix, beat, bell * 0.78, 1)

    mix = reverb(mix)
    mix = np.tanh(mix * 1.25)
    peak = float(np.max(np.abs(mix)))
    if peak > 0:
        mix *= 0.86 / peak
    loop = mix[LOOP_SAMPLES : 2 * LOOP_SAMPLES]
    nxt = mix[2 * LOOP_SAMPLES : 3 * LOOP_SAMPLES]
    seam = float(np.max(np.abs(loop - nxt)))
    boundary = float(abs(loop[0, 0] - loop[-1, 0]))
    print(f"loop {loop.shape[0] / SR:.2f}s  seam {seam:.5f}  boundary {boundary:.5f}  peak {np.max(np.abs(loop)):.3f}")
    return loop


def write_wav(path: Path, audio: np.ndarray) -> None:
    pcm = np.clip(audio, -1.0, 1.0)
    interleaved = (pcm * 32767.0).astype(np.int16).reshape(-1)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(interleaved.tobytes())


def main() -> None:
    import subprocess

    root = Path(__file__).resolve().parents[1]
    out_dir = root / "public" / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    wav_path = out_dir / "birthday.wav"
    mp3_path = out_dir / "birthday.mp3"
    write_wav(wav_path, build())
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav_path),
            "-codec:a",
            "libmp3lame",
            "-qscale:a",
            "2",
            "-ar",
            "44100",
            str(mp3_path),
        ],
        check=True,
        capture_output=True,
    )
    wav_path.unlink(missing_ok=True)
    print(mp3_path)


if __name__ == "__main__":
    main()
