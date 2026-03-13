import { calculateDuration } from "@/lib/operating-time-utils"
import { useState } from "react"

export default function OperatingTimeFormModal({ onClose, onSave }: any) {

  const [form, setForm] = useState<any>({
    date: "",
    line: "",
    shift: "",
    kodePakan: "",
    timeFrom: "",
    timeTo: "",
    shiftStart: "",
    shiftEnd: ""
  })

  function handleSubmit() {

    const duration = calculateDuration(
      form.timeFrom,
      form.timeTo
    )

    onSave({
      ...form,
      duration
    })

    onClose()
  }

  return (

    <div className="modal">

      <h2>Add Operating Loss</h2>

      <input placeholder="Date"
        onChange={e => setForm({...form, date: e.target.value})}
      />

      <input placeholder="Line"
        onChange={e => setForm({...form, line: e.target.value})}
      />

      <input placeholder="Shift"
        onChange={e => setForm({...form, shift: e.target.value})}
      />

      <input placeholder="Kode Pakan"
        onChange={e => setForm({...form, kodePakan: e.target.value})}
      />

      <input type="time"
        onChange={e => setForm({...form, timeFrom: e.target.value})}
      />

      <input type="time"
        onChange={e => setForm({...form, timeTo: e.target.value})}
      />

      <button onClick={handleSubmit}>
        Save
      </button>

      <button onClick={onClose}>
        Cancel
      </button>

    </div>

  )
}