export interface Line {
  id: string
  name: string
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

export interface KodePakan {
  id: string
  kode: string
  description: string
}

export interface StandardThroughput {
  id: string
  lineId: string
  kodePakanId: string
  throughput: number
}

export interface MachineLossLevel1 {
  id: string
  name: string
}

export interface MachineLossLevel2 {
  id: string
  level1Id: string
  name: string
}

export interface MachineLossLevel3 {
  id: string
  level2Id: string
  name: string
}