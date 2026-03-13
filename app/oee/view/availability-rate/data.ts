// app/oee/availability-rate/data.ts

export type AvailabilityRow = {
  date: string
  line1: number | null
  line2: number | null
  line3A: number | null
  line3B: number | null
  line3AB: number | null
  line4: number | null
  line5: number | null
  line6A: number | null
  line6B: number | null
  line6AB: number | null
  allLine: number | null
}

export const availabilityData: AvailabilityRow[] = [

  {
    date:"2026-03-01",
    line1:85.42,
    line2:97.92,
    line3A:79.17,
    line3B:null,
    line3AB:79.17,
    line4:86.11,
    line5:93.75,
    line6A:54.17,
    line6B:71.18,
    line6AB:62.67,
    allLine:81.10
  },

  {
    date:"2026-03-02",
    line1:79.17,
    line2:68.75,
    line3A:86.46,
    line3B:null,
    line3AB:86.46,
    line4:69.10,
    line5:84.38,
    line6A:75.00,
    line6B:78.85,
    line6AB:77.38,
    allLine:77.54
  },

  {
    date:"2026-03-03",
    line1:91.25,
    line2:88.60,
    line3A:82.30,
    line3B:null,
    line3AB:82.30,
    line4:87.90,
    line5:90.12,
    line6A:73.50,
    line6B:76.00,
    line6AB:74.75,
    allLine:85.60
  },

  {
    date:"2026-03-04",
    line1:87.40,
    line2:92.50,
    line3A:80.00,
    line3B:null,
    line3AB:80.00,
    line4:83.60,
    line5:89.10,
    line6A:60.20,
    line6B:68.45,
    line6AB:64.32,
    allLine:82.14
  },

  {
    date:"2026-03-05",
    line1:93.50,
    line2:95.20,
    line3A:88.10,
    line3B:null,
    line3AB:88.10,
    line4:90.75,
    line5:94.33,
    line6A:78.44,
    line6B:80.21,
    line6AB:79.32,
    allLine:89.65
  },

  {
    date:"2026-03-06",
    line1:88.30,
    line2:84.60,
    line3A:76.90,
    line3B:null,
    line3AB:76.90,
    line4:82.50,
    line5:86.75,
    line6A:69.33,
    line6B:72.10,
    line6AB:70.71,
    allLine:81.22
  }

]