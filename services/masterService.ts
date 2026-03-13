import {
  Line,
  Shift,
  KodePakan,
  MachineLossLevel1,
  MachineLossLevel2,
  MachineLossLevel3
} from "../types/master"

export const getLines = async (): Promise<Line[]> => {
  return [
    { id: "1", name: "CKP Line 1" },
    { id: "2", name: "CKP Line 2" }
  ]
}

export const getShifts = async (): Promise<Shift[]> => {
  return [
    { id: "1", name: "Shift 1", startTime: "07:00", endTime: "15:00" },
    { id: "2", name: "Shift 2", startTime: "15:00", endTime: "23:00" },
    { id: "3", name: "Shift 3", startTime: "23:00", endTime: "07:00" }
  ]
}

export const getKodePakan = async (): Promise<KodePakan[]> => {
  return [
    { id: "1", kode: "5111", description: "Starter Feed" },
    { id: "2", kode: "5122", description: "Grower Feed" }
  ]
}

export const getMachineLossLevel1 = async (): Promise<MachineLossLevel1[]> => {
  return [
    { id: "1", name: "Breakdown" },
    { id: "2", name: "Minor Stop" }
  ]
}

export const getMachineLossLevel2 = async (): Promise<MachineLossLevel2[]> => {
  return [
    { id: "1", level1Id: "1", name: "Motor" },
    { id: "2", level1Id: "1", name: "Gearbox" }
  ]
}

export const getMachineLossLevel3 = async (): Promise<MachineLossLevel3[]> => {
  return [
    { id: "1", level2Id: "1", name: "Bearing" },
    { id: "2", level2Id: "1", name: "Overheat" }
  ]
}