const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

// Returns null if dates missing; 0 if range is invalid; >0 if valid range
export function countOccurrences(startDate, endDate, repeatDays) {
  if (!startDate || !endDate || !repeatDays?.length) return null
  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(endDate   + 'T00:00:00')
  if (isNaN(start) || isNaN(end)) return null
  if (end < start) return 0
  const dayNums = new Set(repeatDays.map(d => DAY_MAP[d]))
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (dayNums.has(cur.getDay())) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function hasRecurrence(task) {
  return !!(task.repeat_days?.length)
}

// Total occurrences. Uses TASK dates if set, otherwise PROJECT dates.
// Returns null if neither is fully defined.
export function getTaskTotal(task, project) {
  if (!hasRecurrence(task)) return 1
  const start = task.start_date || project?.start_date
  const end   = task.due_date   || project?.end_date
  return countOccurrences(start, end, task.repeat_days)
}

// Whether a task is fully trackable (recurrence days + valid project period)
export function isRecurringTracked(task, project) {
  if (!hasRecurrence(task)) return false
  const total = getTaskTotal(task, project)
  return total !== null && total > 0
}

export function totalOccurrences(task, project) {
  return getTaskTotal(task, project)
}

// Progress: sum of completed_count / sum of totals
export function computeProgress(tasks, project) {
  let done = 0, total = 0
  for (const t of tasks) {
    if (hasRecurrence(t)) {
      const tot = getTaskTotal(t, project)
      if (tot === null || tot === 0) {
        total += 1
        if (t.completed) done += 1
      } else {
        total += tot
        done  += Math.min(t.completed_count || 0, tot)
      }
    } else {
      total += 1
      if (t.completed) done += 1
    }
  }
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 }
}

// Returns [changes, shouldFlash]
export function computeCheckUpdate(task, project) {
  if (hasRecurrence(task)) {
    const total = getTaskTotal(task, project)
    if (total === null || total === 0) {
      return [{ completed: !task.completed }, false]
    }
    if (task.completed) {
      return [{ completed_count: 0, completed: false }, false]
    }
    const newCount = (task.completed_count || 0) + 1
    if (newCount >= total) {
      return [{ completed_count: newCount, completed: true }, false]
    }
    return [{ completed_count: newCount }, true]
  }
  return [{ completed: !task.completed }, false]
}
