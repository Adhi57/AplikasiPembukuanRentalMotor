import { invoke } from "@tauri-apps/api/core"
import { Motor } from "../types/motor.type"

export const getMotor = async (): Promise<Motor[]> => {
  return await invoke<Motor[]>("get_all_motor")
}

export const createMotor = async (data: Motor): Promise<void> => {
  await invoke("create_motor", { data })
}

export const updateMotor = async (id: number, data: Motor): Promise<void> => {
  await invoke("update_motor", { id, data })
}

export const deleteMotor = async (id: number): Promise<void> => {
  await invoke("delete_motor", { id })
}
