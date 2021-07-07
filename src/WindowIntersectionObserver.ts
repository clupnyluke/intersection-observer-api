import type * as IntersectionObserverTypes from './IntersectionObserver'
import * as IntersectionObserver from './IntersectionObserver'
import {  curry } from 'lodash'


//State
let disconnect: () => void
let windowObserverList: IntersectionObserver.ObserverTargetList = []

const observe:
  (
    target: Element,
    thresholds: number | number[],
    action: IntersectionObserver.ObserverTargetCallback
  ) => () => void =
  (
    target: Element,
    thresholds: number | number[],
    action: IntersectionObserver.ObserverTargetCallback
  ) => {
  const thresholdList = (Array.isArray(thresholds)?thresholds:[thresholds])
  const Uniquethresholds = [...new Set(thresholdList)]
  const finalThresholds = Uniquethresholds.filter(v => 0 <= v && v <= 1)
  if (finalThresholds.length !== Uniquethresholds.length) {
    console.warn('Thresholds for observation must be 0-1, Other entries ignored')
  }
  if (finalThresholds.length === 0) {
    console.error('No valid thresholds for observer')
    return undefined
  }
  const newObserverTarget = {
    target,
    thresholds: [...finalThresholds],
    action
  }
  const addToList = curry(IntersectionObserver.addObserverTargetToList)(windowObserverList)
  windowObserverList = addToList(newObserverTarget)
  rebuildObserver()
  return curry(unobserve)(newObserverTarget)
}

const rebuildObserver = () => {
  const makeObserver = curry(IntersectionObserver.makeObserverFromList)(windowObserverList)
  if (disconnect !== undefined) {
    disconnect()
  }
  disconnect = makeObserver(windowObserverList)
}


const unobserve = (observerTarget: IntersectionObserver.ObserverTarget) => {
  windowObserverList = windowObserverList.filter(v => observerTarget.target !== v.target)
  if (windowObserverList.length === 0) {
    disconnect();
    disconnect = undefined;
    return;
  }
  rebuildObserver();
}

export default observe;