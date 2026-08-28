export interface MobileControlsState {
  x: number;
  z: number;
  jump: boolean;
  sprint: boolean;
}

export const mobileControlsState: MobileControlsState = {
  x: 0,
  z: 0,
  jump: false,
  sprint: false,
};

export function setMobileDirection(x: number, z: number): void {
  mobileControlsState.x = x;
  mobileControlsState.z = z;
}

export function setMobileJump(jump: boolean): void {
  mobileControlsState.jump = jump;
}

export function setMobileSprint(sprint: boolean): void {
  mobileControlsState.sprint = sprint;
}
