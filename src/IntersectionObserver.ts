import { curry } from 'lodash'

// definitions
export type ObserverTargetCallback = (
  entry: IntersectionObserverEntry,
  scrollingDown: boolean,
  ratioGrowing: boolean
) => void

export interface ObserverTarget {
  target: Element,
  thresholds: number[]
  action: ObserverTargetCallback
}

interface ObserverTargetState {
  target: Element,
  thresholds: number[]
  action: ObserverTargetCallback
  previousIntersectionRatio: number
  previousY: number
}

export type ObserverOptions = {
  root: Element | Document
  rootMargin: string
}

export type ObserverTargetList = ObserverTargetState[]

export const addObserverTargetToList:
  (observerList: ObserverTargetList, observerTarget: ObserverTarget) => ObserverTargetList =
  (observerList: ObserverTargetList, observerTarget: ObserverTarget) => {
  const newObserverTarget = {
    ...observerTarget,
    previousIntersectionRatio: 0,
    previousY: 0
  }
  const duplicateElement = observerList.find(i => i.target === observerTarget.target)
  if (duplicateElement !== undefined) {
    console.error('Only one entry per element allowed in observer target list')
    return undefined
  }
  return [...observerList, newObserverTarget];
}

const manageObserverEntry:
  (entry: IntersectionObserverEntry, observerTarget: ObserverTargetState) => ObserverTargetState =
  (entry: IntersectionObserverEntry, observerTarget: ObserverTargetState) => {
    const scrollingDown = entry.boundingClientRect.y < observerTarget.previousY
    const ratioGrowing = entry.intersectionRatio > observerTarget.previousIntersectionRatio;
    observerTarget.action(entry, scrollingDown, ratioGrowing)
    return {
      ...observerTarget,
      previousY: entry.boundingClientRect.y,
      previousIntersectionRatio: entry.intersectionRatio
    }
}

const manageObserverEntriesInList:
  (observerTargets: ObserverTargetList, entries: IntersectionObserverEntry[])  => void =
  (observerTargets: ObserverTargetList, entries: IntersectionObserverEntry[])  => {
  const find = curry(findEntryTargetFromObserverList)(observerTargets)
  entries.forEach(entry => {
    const manage = curry(manageObserverEntry)(entry)
    const observerTarget = find(entry)
    if (observerTarget !== undefined) {
      manage(observerTarget)
    }
  })
}

const findEntryTargetFromObserverList:
  (targetList: ObserverTargetList, entry: IntersectionObserverEntry) =>  ObserverTargetState | undefined =
  (targetList: ObserverTargetList, entry: IntersectionObserverEntry) => {
    const observerTarget = targetList.find(i => i.target === observerTarget.target)
    const min = Math.min(entry.intersectionRatio, observerTarget.previousIntersectionRatio)
    const max = (min === entry.intersectionRatio)?observerTarget.previousIntersectionRatio:entry.intersectionRatio
    const thresholdMet = observerTarget.thresholds.find(i => min <= i && i <= max)
    if (!thresholdMet) {
      return undefined
    }
    return observerTarget;
  }
    
export const makeObserverFromList:
  (observerTargets: ObserverTargetList, options?: ObserverOptions) => () => void =
  (
    observerTargets: ObserverTargetList,
    options: ObserverOptions = 
      {
        root: null,
        rootMargin: '0'
      }
  ) => {
  let thresholdList: number[] = []
  observerTargets.forEach(target => {
    const finalThresholds = target.thresholds.filter(v => {0 <= v && v <= 1})
    if (finalThresholds.length !== target.thresholds.length) {
      console.warn('Thresholds for observation must be 0-1, Other entries ignored')
    }
    thresholdList = [...new Set([...thresholdList, ...finalThresholds])]
  })
  if (thresholdList.length === 0) {
    console.warn('No valid thresholds for observer')
  }
  const internalOptions = {
    ...options,
    thresholds: thresholdList
  }
  const manageEntries = curry(manageObserverEntriesInList)(observerTargets)
  const observer = new IntersectionObserver(manageEntries, internalOptions)
  observerTargets.forEach(observerTarget => observer.observe(observerTarget.target))
  return observer.disconnect
}

