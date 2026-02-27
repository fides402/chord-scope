# Chord Analyzer WebApp - Specification

## 1. Project Overview

**Project Name:** ChordScope  
**Type:** Single-page Web Application  
**Core Functionality:** High-accuracy chord detection from MP3/WAV audio files using advanced DSP algorithms  
**Target Users:** Musicians, music producers, students learning music theory

## 2. UI/UX Specification

### Layout Structure

- **Header:** Logo + App name (fixed, 60px height)
- **Main Area:**
  - Left: Waveform visualization + playback controls
  - Right: Detected chords timeline
- **Footer:** Status bar with algorithm info

### Responsive Breakpoints
- Desktop: > 1024px (side-by-side layout)
- Tablet/Mobile: ≤ 1024px (stacked layout)

### Visual Design

**Color Palette:**
- Background: `#0a0a0f` (deep dark)
- Surface: `#14141f` (card backgrounds)
- Primary: `#00ffc8` (cyan/mint accent)
- Secondary: `#ff6b9d` (pink accent)
- Text Primary: `#e8e8f0`
- Text Muted: `#6b6b80`
- Chord Colors: Each chord root gets distinct color from gradient palette

**Typography:**
- Headings: "JetBrains Mono", monospace - 700 weight
- Body: "IBM Plex Sans", sans-serif - 400/500 weight
- Chords Display: "JetBrains Mono" - 600 weight, 2rem size

**Spacing:**
- Base unit: 8px
- Container padding: 24px
- Card padding: 20px
- Gap between elements: 16px

**Visual Effects:**
- Subtle glow on primary accent elements
- Smooth transitions (0.3s ease)
- Waveform: gradient fill from primary to secondary
- Chord bars: rounded corners (8px), subtle shadow

### Components

1. **File Upload Zone**
   - Drag & drop area with dashed border
   - States: default, hover, file loaded
   - Accepts: .mp3, .wav

2. **Audio Player**
   - Play/Pause button
   - Progress bar with seek capability
   - Time display (current / total)

3. **Waveform Display**
   - Canvas-based visualization
   - Color gradient: cyan → pink
   - Height: 120px

4. **Chord Timeline**
   - Horizontal scrollable timeline
   - Each chord displayed as colored bar
   - Current position indicator (animated)

5. **Chord Display Panel**
   - Large current chord name
   - Confidence percentage
   - Notes in chord (e.g., "C E G")

## 3. Functionality Specification

### Core Features

1. **Audio File Loading**
   - Drag & drop or click to upload
   - Support MP3 and WAV formats
   - Max file size: 50MB

2. **Audio Processing Pipeline**
   - Load audio via Web Audio API
   - Convert to mono for analysis
   - Sample rate: 44100Hz

3. **Chord Detection Algorithm (Enhanced)**
   - **Step 1:** FFT analysis (2048 samples, Hann window)
   - **Step 2:** Harmonic Product Spectrum (HPS) for pitch detection
   - **Step 3:** Chromagram computation (12-bin for each semitone)
   - **Step 4:** Template matching with chord templates
   - **Step 5:** Viterbi smoothing for temporal coherence
   - **Chord Templates:** Major, Minor, 7th, Maj7, Min7, Dim, Aug, Sus2, Sus4

4. **Real-time Playback**
   - Synchronized chord detection during playback
   - Seek to any position
   - Visual highlighting of current chord

5. **Results Display**
   - Timeline showing all detected chords
   - Click on timeline segment to seek
   - Export chords as text (optional)

### User Interactions

- Upload file → auto-process and show waveform
- Click play → audio plays, chords highlight in sync
- Click timeline → seek to position
- Hover chord → show details

### Edge Cases

- Empty audio file: show error message
- No chords detected: show "No chords detected"
- Very short file (< 1s): process but warn user
- Unsupported format: show error with supported formats

## 4. Acceptance Criteria

1. ✓ User can upload MP3 or WAV file
2. ✓ Waveform displays correctly after upload
3. ✓ Audio plays with synchronized chord detection
4. ✓ Chords display with reasonable accuracy (> 80% for clear recordings)
5. ✓ Timeline shows chord progression
6. ✓ Seeking works correctly
7. ✓ UI is responsive on mobile
8. ✓ No console errors during normal operation
