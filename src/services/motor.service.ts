import { invoke } from "@tauri-apps/api/core"
import { Motor } from "../types/motor.type"

export const getMotor = async (): Promise<Motor[]> => {
  return await invoke<Motor[]>("get_motor")
}
