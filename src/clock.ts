import { clampTime, duration } from './timeline';

// Time is absolute during playback, so dropped frames never accumulate drift.
export class PlaybackClock {
  private held = 0;
  private anchor: number | null = null;

  get playing() { return this.anchor !== null; }

  current(now: number): number {
    return this.anchor === null ? this.held : clampTime(this.held + (now - this.anchor) / 1000);
  }

  play(now: number) {
    if (this.playing) return;
    if (this.held === duration) this.held = 0;
    this.anchor = now;
  }

  pause(now: number) {
    this.held = this.current(now);
    this.anchor = null;
  }

  seek(seconds: number, now: number) {
    this.held = clampTime(seconds);
    if (this.playing) this.anchor = this.held === duration ? null : now;
  }
}
