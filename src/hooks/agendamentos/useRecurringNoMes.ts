import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { CalendarDate, getLocalTimeZone } from "@internationalized/date"

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface RecurringNoDia {
  id: string
  booking_start: string
  booking_end: string
  price: number
  turno: "morning" | "afternoon" | "night"
  usuario: { fullname: string; phone: string }
  quadra: { name: string; image_url: string | null }
  esporte: { name: string }
  valid_until: string | null
}

function getTurno(hour: number): "morning" | "afternoon" | "night" {
  if (hour >= 13 && hour < 18) return "afternoon"
  if (hour >= 18) return "night"
  return "morning"
}

export function useRecurringNoMes(dataSelecionada: CalendarDate) {
  const [recurringPorDia, setRecurringPorDia] = useState<Record<string, RecurringNoDia[]>>({})
  const [loading, setLoading] = useState(true)

  const buscar = useCallback(async () => {
    setLoading(true)

    const jsDate = dataSelecionada.toDate(getLocalTimeZone())
    const ano = jsDate.getFullYear()
    const mes = jsDate.getMonth()

    const inicioMes = new Date(ano, mes, 1)
    const fimMes = new Date(ano, mes + 1, 0)
    const inicioISO = inicioMes.toISOString().split("T")[0]
    const fimISO = fimMes.toISOString().split("T")[0]

    const { data } = await supabase
      .from("recurring_bookings")
      .select(`
        id, day_of_week, start_time, end_time, price, valid_from, valid_until,
        user:users(fullname, phone),
        court_sport:court_sports(
          court:courts!inner(name, image_url, company_id),
          sport:sports(name)
        )
      `)
      .eq("court_sport.court.company_id", COMPANY_ID)
      .lte("valid_from", fimISO)
      .or(`valid_until.is.null,valid_until.gte.${inicioISO}`)

    const resultado: Record<string, RecurringNoDia[]> = {}

    for (const rb of data ?? []) {
      // Itera sobre todos os dias do mês e encontra os que batem com day_of_week
      for (let d = 1; d <= fimMes.getDate(); d++) {
        const dataAtual = new Date(ano, mes, d)
        if (dataAtual.getDay() !== rb.day_of_week) continue

        const dataISO = dataAtual.toISOString().split("T")[0]

        // Respeita valid_from e valid_until
        if (dataISO < rb.valid_from) continue
        if (rb.valid_until && dataISO > rb.valid_until) continue

        const [sh, sm] = rb.start_time.split(":").map(Number)
        const [eh, em] = rb.end_time.split(":").map(Number)

        const bookingStart = `${dataISO}T${rb.start_time}`
        const bookingEnd = `${dataISO}T${rb.end_time}`

        const entry: RecurringNoDia = {
          id: rb.id,
          booking_start: bookingStart,
          booking_end: bookingEnd,
          price: rb.price,
          turno: getTurno(sh),
          usuario: {
            fullname: (rb.user as any)?.fullname ?? "—",
            phone: (rb.user as any)?.phone ?? "—",
          },
          quadra: {
            name: (rb.court_sport as any)?.court?.name ?? "—",
            image_url: (rb.court_sport as any)?.court?.image_url ?? null,
          },
          esporte: {
            name: (rb.court_sport as any)?.sport?.name ?? "—",
          },
          valid_until: rb.valid_until,
        }

        if (!resultado[dataISO]) resultado[dataISO] = []
        resultado[dataISO].push(entry)
      }
    }

    setRecurringPorDia(resultado)
    setLoading(false)
  }, [dataSelecionada])

  useEffect(() => { buscar() }, [buscar])

  return { recurringPorDia, loading, refetch: buscar }
}