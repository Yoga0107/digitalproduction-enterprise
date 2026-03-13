export function calculateDuration(from: string, to: string): number {
  const start = new Date(`1970-01-01T${from}`)
  const end = new Date(`1970-01-01T${to}`)

  const diff = (end.getTime() - start.getTime()) / 1000 / 3600

  return parseFloat(diff.toFixed(2))
}

export function calculateOperatingTime(
  loadingTime: number,
  operatingLosses: number[]
): number {

  const totalLoss = operatingLosses.reduce((a, b) => a + b, 0)

  return parseFloat((loadingTime - totalLoss).toFixed(2))
}