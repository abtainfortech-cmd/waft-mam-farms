/**
 * Standard Vaccination & Treatment Schedule for Bovan Brown Layers
 * Used in Ghana / West Africa commercial poultry
 * 
 * Week numbers are counted from date of arrival (day-old chick).
 * "interval" means: repeat every N weeks after the first dose.
 */

export interface ScheduleItem {
  week: number           // Week of bird's life
  vaccine: string        // Vaccine or treatment name
  method: string         // Administration method
  type: 'vaccination' | 'treatment' | 'deworming'
  notes?: string         // Additional notes
  repeatInterval?: number // If set, repeat every N weeks (e.g. Newcastle boosters)
}

export const BOVAN_BROWN_SCHEDULE: ScheduleItem[] = [
  // === VACCINATIONS ===
  { week: 1,  vaccine: 'Marek\'s Disease',         method: 'Injection',      type: 'vaccination', notes: 'Usually done at hatchery' },
  { week: 3,  vaccine: 'Newcastle Disease (ND)',    method: 'Eye drop',      type: 'vaccination', notes: 'First ND dose — also covers Infectious Bronchitis (IB)' },
  { week: 3,  vaccine: 'Infectious Bronchitis (IB)', method: 'Eye drop',      type: 'vaccination', notes: 'Combined with ND at week 3' },
  { week: 6,  vaccine: 'Gumboro (IBD)',              method: 'Drinking water', type: 'vaccination', notes: 'Infectious Bursal Disease prevention' },
  { week: 8,  vaccine: 'Newcastle Disease Booster', method: 'Drinking water', type: 'vaccination', notes: 'Second ND dose' },
  { week: 8,  vaccine: 'Infectious Bronchitis Booster', method: 'Drinking water', type: 'vaccination' },
  { week: 10, vaccine: 'Fowl Pox',                  method: 'Wing web puncture', type: 'vaccination', notes: 'Important in Ghana — fowl pox is common' },
  { week: 12, vaccine: 'Newcastle Disease',         method: 'Drinking water', type: 'vaccination', notes: 'Third ND dose', repeatInterval: 8 },
  { week: 12, vaccine: 'Infectious Bronchitis',      method: 'Drinking water', type: 'vaccination' },
  { week: 14, vaccine: 'Gumboro Booster',           method: 'Drinking water', type: 'vaccination', notes: 'Second Gumboro dose' },
  { week: 16, vaccine: 'Fowl Typhoid',              method: 'Injection',      type: 'vaccination', notes: 'Pre-lay vaccination' },
  { week: 18, vaccine: 'Newcastle Disease (Pre-lay)',method: 'Injection',      type: 'vaccination', notes: 'Pre-lay booster — critical for egg production' },
  { week: 18, vaccine: 'Infectious Bronchitis (Pre-lay)', method: 'Injection', type: 'vaccination' },
  { week: 20, vaccine: 'Egg Drop Syndrome (EDS)',   method: 'Injection',      type: 'vaccination', notes: 'Pre-lay EDS protection' },

  // === DEWORMING ===
  { week: 8,  vaccine: 'Deworming (Piperazine)',     method: 'Feed medication', type: 'deworming', notes: 'First deworming', repeatInterval: 10 },
  { week: 16, vaccine: 'Deworming (Piperazine)',    method: 'Feed medication', type: 'deworming', notes: 'Pre-lay deworming' },

  // === PREVENTIVE TREATMENTS ===
  { week: 2,  vaccine: 'Coccidiosis Prevention',    method: 'Feed medication', type: 'treatment', notes: 'Add anticoccidial to feed weeks 2-6' },
  { week: 18, vaccine: 'Vitamin Supplement (Pre-lay)', method: 'Feed medication', type: 'treatment', notes: 'Stress pack 1 week before first egg' },
]

/**
 * Given a flock's current age in weeks, return the schedule items
 * that should have been done by now and those that are upcoming.
 */
export function getScheduleForAge(currentAgeWeeks: number): {
  past: ScheduleItem[]
  current: ScheduleItem[]
  upcoming: ScheduleItem[]
  all: ScheduleItem[]
} {
  const past: ScheduleItem[] = []
  const current: ScheduleItem[] = []
  const upcoming: ScheduleItem[] = []

  for (const item of BOVAN_BROWN_SCHEDULE) {
    // Handle repeated items (e.g. Newcastle every 8 weeks)
    if (item.repeatInterval) {
      let week = item.week
      while (week <= 100) { // up to ~2 years
        if (week < currentAgeWeeks - 1) {
          past.push({ ...item, week, notes: `${item.vaccine} (Week ${week})` })
        } else if (week <= currentAgeWeeks + 1) {
          current.push({ ...item, week, notes: `${item.vaccine} (Week ${week}) — DUE NOW` })
        } else if (week <= currentAgeWeeks + 4) {
          upcoming.push({ ...item, week, notes: `${item.vaccine} (Week ${week})` })
        }
        week += item.repeatInterval
      }
    } else {
      if (item.week < currentAgeWeeks - 1) {
        past.push(item)
      } else if (item.week <= currentAgeWeeks + 1) {
        current.push({ ...item, notes: (item.notes ? item.notes + ' — ' : '') + 'DUE NOW' })
      } else if (item.week <= currentAgeWeeks + 4) {
        upcoming.push(item)
      }
    }
  }

  // Deduplicate by vaccine+week
  const seen = new Set<string>()
  const dedup = (list: ScheduleItem[]) => list.filter(item => {
    const key = `${item.vaccine}-${item.week}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    past: dedup(past),
    current: dedup(current),
    upcoming: dedup(upcoming),
    all: BOVAN_BROWN_SCHEDULE,
  }
}
