import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, staticFile } from "remotion";
import { Act1_Trigger } from "./scenes/Act1_Trigger";
import { Act2_Resonance } from "./scenes/Act2_Resonance";
import { Act3_Turning } from "./scenes/Act3_Turning";
import { Act4_Evidence } from "./scenes/Act4_Evidence";
import { Act5_Anchor } from "./scenes/Act5_Anchor";
import { MasterOrb } from "./components/MasterOrb";

// Frame layout (60 fps):
// Act 1: 0-600      (0-10s)   Trigger
// Act 2: 600-1500   (10-25s)  Resonance
// Act 3: 1500-1980  (25-33s)  Turning
// Act 4: 1980-3480  (33-58s)  Evidence
// Act 5: 3480-4680  (58-78s)  Anchor
// Total: 4680 frames = 78s

export const TOTAL_FRAMES = 4680;
export const FPS = 60;

// Audio files — placed by user in public/audio/
// Set to true once audio files are in place
const ENABLE_AUDIO = false;

const BGMTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 120, 1500, 1620, 1860, 1980, 4560, 4680],
    [0, 0.5, 0.5, 0.2, 0.2, 0.5, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio src={staticFile("audio/bgm.mp3")} volume={volume} />;
};

/** Wrapper that passes global frame to MasterOrb */
const MasterOrbBridge: React.FC = () => {
  const frame = useCurrentFrame();
  return <MasterOrb globalFrame={frame} />;
};

export const LevelUpPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background music */}
      {ENABLE_AUDIO && (
        <Sequence from={0} durationInFrames={TOTAL_FRAMES} name="BGM">
          <BGMTrack />
        </Sequence>
      )}

      {/* SFX */}
      {ENABLE_AUDIO && (
        <>
          <Sequence from={120} durationInFrames={60} name="SFX: reveal">
            <Audio src={staticFile("audio/reveal.mp3")} volume={0.3} />
          </Sequence>
          <Sequence from={840} durationInFrames={60} name="SFX: whoosh 1">
            <Audio src={staticFile("audio/whoosh.mp3")} volume={0.35} />
          </Sequence>
          <Sequence from={1140} durationInFrames={60} name="SFX: whoosh 2">
            <Audio src={staticFile("audio/whoosh.mp3")} volume={0.35} />
          </Sequence>
          <Sequence from={1620} durationInFrames={120} name="SFX: impact">
            <Audio src={staticFile("audio/impact.mp3")} volume={0.7} />
          </Sequence>
          <Sequence from={1980} durationInFrames={60} name="SFX: reveal A">
            <Audio src={staticFile("audio/reveal.mp3")} volume={0.25} />
          </Sequence>
          <Sequence from={2460} durationInFrames={60} name="SFX: reveal B">
            <Audio src={staticFile("audio/reveal.mp3")} volume={0.25} />
          </Sequence>
          <Sequence from={2940} durationInFrames={60} name="SFX: reveal C">
            <Audio src={staticFile("audio/reveal.mp3")} volume={0.25} />
          </Sequence>
          {[3510, 3530, 3550, 3570, 3590, 3610].map((f, i) => (
            <Sequence key={i} from={f} durationInFrames={90} name={`SFX: chime ${i}`}>
              <Audio src={staticFile("audio/chime.mp3")} volume={0.2} />
            </Sequence>
          ))}
        </>
      )}

      {/* Scene layers (backgrounds + text only, no orbs) */}
      <Sequence from={0} durationInFrames={600} name="Act 1: Trigger">
        <Act1_Trigger />
      </Sequence>

      <Sequence from={600} durationInFrames={900} name="Act 2: Resonance">
        <Act2_Resonance />
      </Sequence>

      <Sequence from={1500} durationInFrames={480} name="Act 3: Turning">
        <Act3_Turning />
      </Sequence>

      <Sequence from={1980} durationInFrames={1500} name="Act 4: Evidence">
        <Act4_Evidence />
      </Sequence>

      <Sequence from={3480} durationInFrames={1200} name="Act 5: Anchor">
        <Act5_Anchor />
      </Sequence>

      {/* MasterOrb — top-level character spanning Acts 1-3 */}
      <Sequence from={0} durationInFrames={1980} name="MasterOrb">
        <MasterOrbBridge />
      </Sequence>
    </AbsoluteFill>
  );
};
